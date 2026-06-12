import { describe, expect, it } from "vitest";
import { gate } from "../src/gating.js";
import type { Verdict } from "../src/types.js";

function verdict(overrides: Partial<Verdict>): Verdict {
  return {
    tier: 2,
    authorClass: "agent",
    mode: "enforce",
    perFile: [],
    violations: [],
    requirements: [],
    ...overrides,
  };
}

describe("gate", () => {
  it("never fails in observe mode", () => {
    const v = verdict({
      mode: "observe",
      violations: [
        { kind: "agent-on-tier2", setting: "block", paths: ["interlock.yml"] },
      ],
    });
    expect(gate(v).shouldFail).toBe(false);
  });

  it("fails on block violations in enforce mode", () => {
    const v = verdict({
      violations: [
        { kind: "agent-on-tier2", setting: "block", paths: ["interlock.yml"] },
      ],
    });
    const g = gate(v);
    expect(g.shouldFail).toBe(true);
    expect(g.reasons[0]).toMatch(/agent-on-tier2/);
  });

  it("require-review fails without a human approval", () => {
    const v = verdict({
      authorClass: "human",
      violations: [
        {
          kind: "human-on-tier2",
          setting: "require-review",
          paths: ["interlock.yml"],
        },
      ],
    });
    expect(gate(v, { humanApprovalCount: 0 }).shouldFail).toBe(true);
    expect(gate(v, { humanApprovalCount: 1 }).shouldFail).toBe(false);
  });

  it("warn never fails", () => {
    const v = verdict({
      violations: [
        { kind: "human-on-tier2", setting: "warn", paths: ["interlock.yml"] },
      ],
    });
    expect(gate(v).shouldFail).toBe(false);
  });
});
