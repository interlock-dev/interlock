import picomatch from "picomatch";
import type { Policy } from "./policy.js";
import type { AuthorClass, AuthorInfo, Tier } from "./types.js";

/** Paths: brackets behave as globs; dotfiles match (a guard must see dotfiles). */
const PATH_OPTS = { dot: true } as const;
/** Authors: nobracket so "*[bot]" matches literal "[bot]", not a char class. */
const AUTHOR_OPTS = { dot: true, nobracket: true } as const;

function firstMatch(
  value: string,
  patterns: string[],
  opts: object
): string | undefined {
  for (const p of patterns) {
    if (picomatch.isMatch(value, p, opts)) return p;
  }
  return undefined;
}

export function classifyAuthor(
  author: AuthorInfo,
  policy: Policy
): AuthorClass {
  const agents = policy.authors.agents;
  if (firstMatch(author.account, agents.accounts, AUTHOR_OPTS)) return "agent";
  if (author.branch && firstMatch(author.branch, agents.branches, AUTHOR_OPTS))
    return "agent";
  for (const trailer of author.trailers ?? []) {
    if (firstMatch(trailer, agents.trailers, AUTHOR_OPTS)) return "agent";
  }
  return "human";
}

export function tierForPath(
  path: string,
  policy: Policy
): { tier: Tier; matchedRule: string } {
  const t2 = firstMatch(path, policy.tiers.tier2, PATH_OPTS);
  if (t2) return { tier: 2, matchedRule: t2 };
  const t0 = firstMatch(path, policy.tiers.tier0, PATH_OPTS);
  if (t0) return { tier: 0, matchedRule: t0 };
  return { tier: 1, matchedRule: "default" };
}
