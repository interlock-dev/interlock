import { describe, expect, it } from "vitest";
import { formatVerdict } from "../src/output.js";
import type { Verdict } from "interlock-core";

const verdict: Verdict = {
  tier: 2,
  authorClass: "agent",
  mode: "observe",
  perFile: [
    { path: "docs/a.md", tier: 0, matchedRule: "docs/**" },
    { path: "interlock.yml", tier: 2, matchedRule: "interlock.yml" },
  ],
  violations: [
    { kind: "agent-on-tier2", setting: "block", paths: ["interlock.yml"] },
  ],
  requirements: [
    "Tier 2 — protected paths touched (author: agent).",
    "BLOCKED — agent-on-tier2: interlock.yml",
  ],
};

describe("formatVerdict", () => {
  it("renders header, per-file table, and requirements", () => {
    const text = formatVerdict(verdict);
    expect(text).toContain("Tier 2");
    expect(text).toContain("agent");
    expect(text).toContain("docs/a.md");
    expect(text).toContain("interlock.yml");
    expect(text).toContain("BLOCKED — agent-on-tier2");
  });

  it("says so when the diff is empty", () => {
    const empty: Verdict = {
      tier: 0, authorClass: "human", mode: "observe",
      perFile: [], violations: [], requirements: ["Tier 0 — behaviour-neutral; eligible for auto-merge when CI is green."],
    };
    const text = formatVerdict(empty);
    expect(text).toContain("No changes detected");
    expect(text).not.toContain("auto-merge");
  });
});
