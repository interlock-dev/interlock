import type { Verdict } from "interlock-core";

export function formatVerdict(verdict: Verdict): string {
  const lines: string[] = [];
  lines.push(
    `Interlock: Tier ${verdict.tier} (${verdict.authorClass} author, mode: ${verdict.mode})`
  );

  if (verdict.perFile.length === 0) {
    lines.push("No changes detected against the base ref.");
    return lines.join("\n");
  }

  lines.push("");
  const width = Math.max(4, ...verdict.perFile.map((f) => f.path.length));
  lines.push(`${"PATH".padEnd(width)}  TIER  RULE`);
  for (const f of verdict.perFile) {
    lines.push(`${f.path.padEnd(width)}  ${String(f.tier).padEnd(4)}  ${f.matchedRule}`);
  }
  lines.push("");
  lines.push(...verdict.requirements);
  return lines.join("\n");
}
