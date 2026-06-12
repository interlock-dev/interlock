import type { Verdict } from "./types.js";

export interface GatingContext {
  /** Count of PR approvals from human-classified reviewers (Action supplies this). */
  humanApprovalCount?: number;
}

export interface GatingResult {
  shouldFail: boolean;
  reasons: string[];
}

export function gate(verdict: Verdict, ctx: GatingContext = {}): GatingResult {
  if (verdict.mode !== "enforce") return { shouldFail: false, reasons: [] };
  const reasons: string[] = [];
  for (const v of verdict.violations) {
    if (v.setting === "block") {
      reasons.push(`${v.kind}: blocked (${v.paths.join(", ")})`);
    }
    if (v.setting === "require-review" && (ctx.humanApprovalCount ?? 0) < 1) {
      reasons.push(`${v.kind}: requires a human approval; none present`);
    }
  }
  return { shouldFail: reasons.length > 0, reasons };
}
