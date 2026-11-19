import type { Audit, Claim } from './schema/entity.ts';

/** confirmed and changed pass; flagged does not. */
export function isPassing(audit: Audit): boolean {
  return audit.verdict !== 'flagged';
}

/** The latest audit by date; on a tie, the later one in the list. */
export function latestAudit(audits: Audit[]): Audit | undefined {
  let latest: Audit | undefined;
  for (const audit of audits) if (latest === undefined || audit.on >= latest.on) latest = audit;
  return latest;
}

/**
 * How many independent passing audits a claim has. Two passes are independent when they have
 * different auditors, or when one checked the claim against a source other than its first.
 */
export function independentPasses(claim: Claim): number {
  const primary = claim.sources[0]?.key;
  const seen = new Set<string>();
  for (const audit of claim.audits.filter(isPassing)) {
    const other = audit.source !== undefined && audit.source !== primary ? audit.source : '';
    seen.add(`${audit.by}|${other}`);
  }
  return seen.size;
}

/** A claim may publish when its latest audit isn't flagged and it has a human pass or two independent ones. */
export function meetsThreshold(claim: Claim): boolean {
  const latest = latestAudit(claim.audits);
  if (latest === undefined || !isPassing(latest)) return false;
  const human = claim.audits.some((audit) => audit.by === 'human' && isPassing(audit));
  return human || independentPasses(claim) >= 2;
}
