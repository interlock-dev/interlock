import { mkdtempSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPolicyYaml, runInit, WORKFLOW_SNIPPET } from "../src/commands/init.js";
import { parsePolicy } from "interlock-core";
import { germlinePaths } from "../src/constitution/render.js";

function tempRepo(dirs: string[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "interlock-test-"));
  for (const d of dirs) mkdirSync(join(root, d), { recursive: true });
  return root;
}

describe("buildPolicyYaml", () => {
  it("produces a valid policy that includes detected directories", () => {
    const yamlText = buildPolicyYaml({ hasDocs: true, hasTests: true });
    const policy = parsePolicy(yamlText); // must round-trip through our own parser
    expect(policy.tiers.tier0).toContain("docs/**");
    expect(policy.tiers.tier0).toContain("tests/**");
    expect(policy.tiers.tier2).toContain(".github/**");
    expect(policy.tiers.tier2).toContain("interlock.yml"); // the off-switch rule, always
  });

  it("omits undetected directories but always protects itself", () => {
    const policy = parsePolicy(
      buildPolicyYaml({ hasDocs: false, hasTests: false })
    );
    expect(policy.tiers.tier0).not.toContain("docs/**");
    expect(policy.tiers.tier2).toContain("interlock.yml");
    // no workflows yet, but .github/** must still be Tier 2 — see buildPolicyYaml
    expect(policy.tiers.tier2).toContain(".github/**");
  });
});

describe("runInit", () => {
  it("writes interlock.yml and prints the workflow snippet", () => {
    const root = tempRepo(["docs", "tests", ".github/workflows"]);
    const out: string[] = [];
    const code = runInit({ cwd: root, force: false }, { log: (s) => out.push(s), error: () => {} });
    expect(code).toBe(0);
    expect(existsSync(join(root, "interlock.yml"))).toBe(true);
    expect(parsePolicy(readFileSync(join(root, "interlock.yml"), "utf8")).version).toBe(1);
    expect(out.join("\n")).toContain("farshadpasbani/interlock@v1");
  });

  it("refuses to overwrite without --force", () => {
    const root = tempRepo();
    runInit({ cwd: root, force: false }, { log: () => {}, error: () => {} });
    const err: string[] = [];
    const code = runInit({ cwd: root, force: false }, { log: () => {}, error: (s) => err.push(s) });
    expect(code).toBe(2);
    expect(err.join("\n")).toContain("--force");
  });
});

describe("WORKFLOW_SNIPPET", () => {
  it("requests only the permissions the action needs (least privilege)", () => {
    expect(WORKFLOW_SNIPPET).toContain("contents: read");
    // The action reads and writes PRs (verdict comment + tier label). For a PR
    // resource, the issues-API comment/label endpoints map to the pull-requests
    // permission — so pull-requests: write is required and issues: write is not.
    expect(WORKFLOW_SNIPPET).toContain("pull-requests: write");
    expect(WORKFLOW_SNIPPET).not.toContain("issues: write");
  });
});

describe("buildPolicyYaml with germline (constitution mode)", () => {
  it("renders tier2 from germlinePaths when asked", () => {
    const yaml = buildPolicyYaml({ hasDocs: true, hasTests: true }, true);
    for (const g of germlinePaths()) expect(yaml).toContain(`"${g}"`);
  });
  it("default (no germline) keeps the lean tier2", () => {
    const yaml = buildPolicyYaml({ hasDocs: false, hasTests: false }, false);
    expect(yaml).toContain('"interlock.yml"');
    expect(yaml).not.toContain('"docs/agents/**"');
  });
});
