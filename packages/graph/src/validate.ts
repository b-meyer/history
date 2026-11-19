import type { Graph, Problem } from './load.ts';
import type { Claim, Entity } from './schema/entity.ts';
import type { Predicate } from './schema/vocab.ts';

export type ValidateOptions = {
  /** Today as YYYY-MM-DD; a reviewed date after it is rejected. */
  today: string;
};

const VOCAB_FILE = 'data/vocab/predicates.yaml';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Today's date in local time, as YYYY-MM-DD. */
export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Every predicate with an object declares an inverse, and inverses never clash. */
function checkVocab(predicates: Record<string, Predicate>): Problem[] {
  const problems: Problem[] = [];
  const report = (at: string, message: string): void => {
    problems.push({ file: VOCAB_FILE, at, message });
  };
  const names = new Set(Object.keys(predicates));
  const inverses = new Map<string, string>();

  for (const [id, predicate] of Object.entries(predicates)) {
    if (
      predicate.object !== undefined &&
      (predicate.inverse === undefined || predicate.inverseLabel === undefined)
    ) {
      report(id, 'a predicate with an object needs an inverse and an inverseLabel');
    }
    if (predicate.object === undefined && predicate.inverse !== undefined) {
      report(id, 'a predicate without an object cannot have an inverse');
    }
    if (predicate.inverse === undefined) continue;
    if (names.has(predicate.inverse)) {
      report(
        `${id}.inverse`,
        `inverse '${predicate.inverse}' is also a predicate; store the link once, on its subject`,
      );
    }
    const other = inverses.get(predicate.inverse);
    if (other !== undefined)
      report(`${id}.inverse`, `inverse '${predicate.inverse}' is also the inverse of '${other}'`);
    inverses.set(predicate.inverse, id);
  }
  return problems;
}

/** Coordinates belong to places, colours to traditions. */
function checkEntityFields(entity: Entity, file: string): Problem[] {
  const problems: Problem[] = [];
  const report = (at: string, message: string): void => {
    problems.push({ file, at, message });
  };
  if (entity.type === 'place' && entity.coords === undefined)
    report('coords', 'a place needs coords as [longitude, latitude]');
  if (entity.type !== 'place' && entity.coords !== undefined)
    report('coords', 'only places have coords; place other entities with claims');
  if (entity.coords !== undefined) {
    const [lon, lat] = entity.coords;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      report('coords', 'coords must be [longitude, latitude] within -180..180 and -90..90');
    }
  }
  if (entity.type !== 'tradition' && entity.color !== undefined)
    report('color', 'only traditions have a map colour');
  return problems;
}

/** The claim's predicate applies to its subject and object, with the date and basis it needs. */
function checkPredicate(
  graph: Graph,
  entity: Entity,
  claim: Claim,
  report: (field: string, message: string) => void,
): void {
  const predicate = graph.vocab.predicates[claim.predicate];
  if (predicate === undefined) {
    report('predicate', `unknown predicate '${claim.predicate}'; add it to ${VOCAB_FILE}`);
    return;
  }
  if (!predicate.subject.includes(entity.type)) {
    report(
      'predicate',
      `'${claim.predicate}' does not apply to a ${entity.type}; it applies to ${predicate.subject.join(', ')}`,
    );
  }
  if (predicate.object === undefined && claim.object !== undefined)
    report('object', `'${claim.predicate}' takes no object`);
  if (predicate.object !== undefined && claim.object === undefined) {
    report('object', `'${claim.predicate}' needs an object (${predicate.object.join(', ')})`);
  }
  if (predicate.object !== undefined && claim.object !== undefined) {
    const target = graph.entities.get(claim.object);
    if (target === undefined) report('object', `unknown entity '${claim.object}'`);
    else if (!predicate.object.includes(target.type)) {
      report(
        'object',
        `'${claim.predicate}' points at ${predicate.object.join(', ')}, not a ${target.type}`,
      );
    }
  }
  if (predicate.dated === true && claim.when === undefined)
    report('when', `'${claim.predicate}' needs a when`);
  if (predicate.basis !== undefined && !predicate.basis.includes(claim.basis)) {
    report(
      'basis',
      `'${claim.predicate}' needs basis ${predicate.basis.join(' or ')}, not ${claim.basis}`,
    );
  }
}

type ClaimContext = {
  graph: Graph;
  entity: Entity;
  file: string;
  today: string;
  claimIds: Map<string, string>;
};

function checkClaim(context: ClaimContext, claim: Claim, index: number): Problem[] {
  const { graph, entity, file, today, claimIds } = context;
  const problems: Problem[] = [];
  const report = (field: string, message: string): void => {
    problems.push({ file, at: `claims.${index}.${field}`, message });
  };

  if (!claim.id.startsWith(`${entity.id}.`))
    report('id', `claim ID must start with '${entity.id}.'`);
  const earlier = claimIds.get(claim.id);
  if (earlier === undefined) claimIds.set(claim.id, file);
  else report('id', `claim ID '${claim.id}' is already used in ${earlier}`);

  if (claim.reviewed > today)
    report('reviewed', `reviewed date ${claim.reviewed} is in the future`);
  checkPredicate(graph, entity, claim, report);

  if (claim.where !== undefined) {
    const place = graph.entities.get(claim.where);
    if (place === undefined) report('where', `unknown place '${claim.where}'`);
    else if (place.type !== 'place')
      report('where', `'${claim.where}' is a ${place.type}, not a place`);
  }
  for (const [sourceIndex, source] of claim.sources.entries()) {
    if (!graph.sources.has(source.key)) {
      report(
        `sources.${sourceIndex}.key`,
        `unknown source '${source.key}'; add data/sources/${source.key}.yaml`,
      );
    }
  }
  return problems;
}

/**
 * Checks what the schemas cannot: predicates, links between files, source keys, review dates.
 * Schema problems are reported by loadGraph; this adds the rest.
 */
export function validateGraph(graph: Graph, options: ValidateOptions): Problem[] {
  const problems = checkVocab(graph.vocab.predicates);
  const claimIds = new Map<string, string>();
  for (const [id, entity] of graph.entities) {
    const file = graph.entityFiles.get(id) ?? id;
    problems.push(...checkEntityFields(entity, file));
    const context: ClaimContext = { graph, entity, file, today: options.today, claimIds };
    for (const [index, claim] of entity.claims.entries())
      problems.push(...checkClaim(context, claim, index));
  }
  return problems;
}
