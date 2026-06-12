export type Tier = 0 | 1 | 2;

export interface ChangedFile {
  path: string;
  /** Old path for renames — counts as touched too. */
  previousPath?: string;
  status: "added" | "modified" | "removed" | "renamed";
}

export interface AuthorInfo {
  /** PR author login (Action) or last commit author name (CLI). */
  account: string;
  /** Head branch name, if known. */
  branch?: string;
  /** Commit trailer lines, e.g. "Co-Authored-By: Claude <noreply@anthropic.com>". */
  trailers?: string[];
}

export type AuthorClass = "agent" | "human";

export type RuleSetting = "block" | "warn" | "require-review";

export interface FileVerdict {
  path: string;
  tier: Tier;
  /** The glob that decided the tier, or "default" for implicit tier 1. */
  matchedRule: string;
}

export interface Violation {
  kind: "agent-on-tier2" | "human-on-tier2";
  setting: RuleSetting;
  paths: string[];
}

export interface Verdict {
  tier: Tier;
  authorClass: AuthorClass;
  mode: "observe" | "enforce";
  perFile: FileVerdict[];
  violations: Violation[];
  /** Human-readable lines describing what this PR needs. */
  requirements: string[];
}
