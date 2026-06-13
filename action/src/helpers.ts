import type { ChangedFile, Verdict } from "interlock-core";
import type { GatingResult } from "interlock-core";
import { extractTrailers } from "interlock-core";

export const MARKER = "<!-- interlock-verdict -->";

/**
 * Decode a repos.getContent file response. Returns null only for "file truly
 * absent" shapes. Throws for oversized/undecodable content — an unreadable
 * policy must fail LOUD, never be mistaken for "no policy".
 */
export function decodeContentResponse(data: {
  content?: string;
  encoding?: string;
  size?: number;
}): string | null {
  if (data.encoding === "none" || (data.content === "" && (data.size ?? 0) > 0)) {
    throw new Error(
      `policy file too large to read inline (size: ${data.size ?? "unknown"} bytes) — refusing to treat as absent`
    );
  }
  if (!data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf8");
}

export interface ReviewLike {
  state: string;
  user: { login: string } | null;
}

/**
 * Logins whose LATEST approval-relevant review is APPROVED. Reviews arrive
 * chronologically; CHANGES_REQUESTED or DISMISSED supersedes an earlier
 * APPROVED, while COMMENTED never changes approval state.
 */
export function latestApprovers(reviews: ReviewLike[]): Set<string> {
  const lastState = new Map<string, string>();
  for (const r of reviews) {
    if (!r.user) continue;
    if (r.state === "APPROVED" || r.state === "CHANGES_REQUESTED" || r.state === "DISMISSED") {
      lastState.set(r.user.login, r.state);
    }
  }
  return new Set(
    [...lastState.entries()].filter(([, s]) => s === "APPROVED").map(([l]) => l)
  );
}

export interface ApiFile {
  filename: string;
  status: string;
  previous_filename?: string;
}

export function mapFiles(apiFiles: ApiFile[]): ChangedFile[] {
  return apiFiles.map((f) => {
    if (f.status === "renamed" && f.previous_filename) {
      return {
        path: f.filename,
        previousPath: f.previous_filename,
        status: "renamed" as const,
      };
    }
    // "copied" deliberately maps to modified WITHOUT previousPath: the copy's source was not modified, only the destination needs tiering.
    const status =
      f.status === "added" || f.status === "removed"
        ? (f.status as "added" | "removed")
        : ("modified" as const);
    return { path: f.filename, status };
  });
}

export { extractTrailers };

export function buildComment(verdict: Verdict, gating: GatingResult): string {
  const icon = gating.shouldFail ? "❌" : verdict.tier === 2 ? "⚠️" : "✅";
  const lines: string[] = [];
  lines.push(MARKER);
  lines.push(
    `### ${icon} Interlock — Tier ${verdict.tier} (${verdict.authorClass} author, mode: ${verdict.mode})`
  );
  lines.push("");
  lines.push("| Path | Tier | Rule |");
  lines.push("| --- | --- | --- |");
  for (const f of verdict.perFile) {
    lines.push(`| \`${f.path}\` | ${f.tier} | \`${f.matchedRule}\` |`);
  }
  lines.push("");
  for (const r of verdict.requirements) lines.push(`- ${r}`);
  if (gating.shouldFail) {
    lines.push("");
    lines.push(`**Check failed:** ${gating.reasons.join("; ")}`);
  }
  return lines.join("\n");
}

/** Two attempts, brief pause — in enforce mode there is no silent pass. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
    return await fn();
  }
}
