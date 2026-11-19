import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { parse } from 'yaml';
import type { z } from 'zod';
import { ENTITY_TYPES } from './schema/common.ts';
import { type Claim, type Entity, entitySchema } from './schema/entity.ts';
import { type Source, sourceSchema } from './schema/source.ts';
import { basisSchema, confidenceSchema, predicatesSchema, type Vocab } from './schema/vocab.ts';

export type Problem = {
  /** Path from the repo root, with forward slashes: data/entities/person/porphyry.yaml. */
  file: string;
  /** Where in the file, as a dotted path: claims.0.object. Empty for the whole file. */
  at: string;
  message: string;
};

export type Graph = {
  vocab: Vocab;
  entities: Map<string, Entity>;
  sources: Map<string, Source>;
  /** The file each entity came from, for problem reports. */
  entityFiles: Map<string, string>;
};

export type LoadResult = { graph: Graph; problems: Problem[] };

const term = (label: string): { label: string; meaning: string } => ({ label, meaning: '' });
const EMPTY_VOCAB: Vocab = {
  predicates: {},
  confidence: { A: term('A'), B: term('B'), C: term('C') },
  basis: { primary: term('primary'), scholarly: term('scholarly'), tradition: term('tradition') },
};

function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.yaml'))
    .toSorted()
    .map((name) => join(dir, name));
}

/** Reads YAML files against schemas, collecting problems with paths relative to the repo root. */
class Reader {
  readonly problems: Problem[] = [];
  readonly #root: string;

  constructor(dataDir: string) {
    this.#root = dirname(dataDir);
  }

  show(file: string): string {
    return relative(this.#root, file).replaceAll('\\', '/');
  }

  report(file: string, at: string, message: string): void {
    this.problems.push({ file: this.show(file), at, message });
  }

  /** Every scalar is read as a string (failsafe YAML); the schema converts it. */
  read<S extends z.ZodType>(file: string, schema: S): z.infer<S> | null {
    let raw: unknown;
    try {
      raw = parse(readFileSync(file, 'utf8'), { schema: 'failsafe' });
    } catch (error) {
      this.report(file, '', `not valid YAML: ${(error as Error).message.split('\n')[0] ?? ''}`);
      return null;
    }
    const result = schema.safeParse(raw ?? {});
    if (result.success) return result.data;
    for (const issue of result.error.issues) this.report(file, issue.path.join('.'), issue.message);
    return null;
  }
}

function readVocab(reader: Reader, dataDir: string): Vocab {
  const file = (name: string): string => join(dataDir, 'vocab', `${name}.yaml`);
  function readOne<S extends z.ZodType>(name: string, schema: S): z.infer<S> | null {
    if (existsSync(file(name))) return reader.read(file(name), schema);
    reader.report(file(name), '', 'missing vocabulary file');
    return null;
  }
  return {
    predicates: readOne('predicates', predicatesSchema) ?? EMPTY_VOCAB.predicates,
    confidence: readOne('confidence', confidenceSchema) ?? EMPTY_VOCAB.confidence,
    basis: readOne('basis', basisSchema) ?? EMPTY_VOCAB.basis,
  };
}

/** data/entities/<type>/<id>.yaml: the folder must be the type and the file name the ID. */
function readEntities(reader: Reader, dataDir: string): Pick<Graph, 'entities' | 'entityFiles'> {
  const entities = new Map<string, Entity>();
  const entityFiles = new Map<string, string>();
  const entitiesDir = join(dataDir, 'entities');
  if (!existsSync(entitiesDir)) return { entities, entityFiles };

  for (const folder of readdirSync(entitiesDir).toSorted()) {
    const folderPath = join(entitiesDir, folder);
    if (!statSync(folderPath).isDirectory()) continue;
    if (!(ENTITY_TYPES as readonly string[]).includes(folder)) {
      reader.report(
        folderPath,
        '',
        `unknown entity type folder; expected one of ${ENTITY_TYPES.join(', ')}`,
      );
      continue;
    }
    for (const file of yamlFiles(folderPath)) {
      const entity = reader.read(file, entitySchema);
      if (entity === null) continue;
      const name = basename(file, '.yaml');
      if (entity.id !== name)
        reader.report(file, 'id', `id '${entity.id}' does not match the file name '${name}'`);
      if (entity.type !== folder)
        reader.report(file, 'type', `type '${entity.type}' does not match its folder '${folder}'`);
      const earlier = entityFiles.get(entity.id);
      if (earlier !== undefined) {
        reader.report(file, 'id', `id '${entity.id}' is already used by ${earlier}`);
        continue;
      }
      entities.set(entity.id, entity);
      entityFiles.set(entity.id, reader.show(file));
    }
  }
  return { entities, entityFiles };
}

/** data/sources/<key>.yaml: the file name must be the key. */
function readSources(reader: Reader, dataDir: string): Pick<Graph, 'sources'> {
  const sources = new Map<string, Source>();
  for (const file of yamlFiles(join(dataDir, 'sources'))) {
    const source = reader.read(file, sourceSchema);
    if (source === null) continue;
    const name = basename(file, '.yaml');
    if (source.key !== name) {
      reader.report(file, 'key', `key '${source.key}' does not match the file name '${name}'`);
      continue;
    }
    sources.set(source.key, source);
  }
  return { sources };
}

/** Reads data/ into one in-memory graph. Files that fail their schema are reported and left out. */
export function loadGraph(dataDir: string): LoadResult {
  const reader = new Reader(dataDir);
  const vocab = readVocab(reader, dataDir);
  const graph: Graph = { vocab, ...readEntities(reader, dataDir), ...readSources(reader, dataDir) };
  return { graph, problems: reader.problems };
}

/** A claim as seen from one entity: its own claims, plus the inverse of claims that point at it. */
export type Link = { claim: Claim; subject: string; derived: boolean };

/**
 * Every claim about each entity. A claim is stored once, on its subject; the object's side is
 * derived here using the inverse declared in data/vocab/predicates.yaml.
 */
export function claimsByEntity(graph: Graph): Map<string, Link[]> {
  const byEntity = new Map<string, Link[]>();
  for (const id of graph.entities.keys()) byEntity.set(id, []);
  for (const [id, entity] of graph.entities) {
    for (const claim of entity.claims) {
      byEntity.get(id)?.push({ claim, subject: id, derived: false });
      if (claim.object !== undefined && claim.object !== id) {
        byEntity.get(claim.object)?.push({ claim, subject: id, derived: true });
      }
    }
  }
  return byEntity;
}
