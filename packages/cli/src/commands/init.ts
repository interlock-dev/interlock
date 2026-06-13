import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { germlinePaths } from "../constitution/render.js";
import { scaffoldConstitution } from "./constitution.js";

export interface Detected {
  hasDocs: boolean;
  hasTests: boolean;
  hasWorkflows: boolean;
}

export const WORKFLOW_SNIPPET = `# .github/workflows/interlock.yml
name: Interlock
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
  pull-requests: write
  issues: write
jobs:
  interlock:
    runs-on: ubuntu-latest
    steps:
      - uses: farshadpasbani/interlock@v1
`;

export function buildPolicyYaml(d: Detected, withConstitution = false): string {
  const tier0: string[] = [];
  if (d.hasDocs) tier0.push("docs/**");
  tier0.push("**/*.md");
  if (d.hasTests) tier0.push("tests/**");

  const tier2: string[] = [];
  if (withConstitution) {
    tier2.push(...germlinePaths());
  } else {
    if (d.hasWorkflows) tier2.push(".github/**");
    tier2.push("interlock.yml"); // the gate cannot edit its own off-switch
  }

  const list = (items: string[]) =>
    items.map((i) => `    - "${i}"`).join("\n");

  return `# Interlock policy — https://github.com/farshadpasbani/interlock
version: 1
mode: observe            # flip to "enforce" once you trust the verdicts

authors:
  agents:
    accounts: ["*[bot]"]
    branches: ["claude/*", "codex/*", "agent/*"]
    trailers: ["Co-Authored-By: Claude*", "Co-Authored-By: *Codex*"]

tiers:
  tier0:                 # behaviour-neutral — candidate for auto-merge when CI is green
${list(tier0)}
  tier2:                 # protected paths — humans only
${list(tier2)}

rules:
  agent-on-tier2: block
  human-on-tier2: warn
`;
}

export interface InitOptions {
  cwd: string;
  force: boolean;
  withConstitution?: boolean;
}

export interface InitIo {
  log: (s: string) => void;
  error: (s: string) => void;
}

export function runInit(opts: InitOptions, io: InitIo): number {
  const target = join(opts.cwd, "interlock.yml");
  if (existsSync(target) && !opts.force) {
    io.error("interlock.yml already exists (use --force to overwrite)");
    return 2;
  }
  const detected: Detected = {
    hasDocs: existsSync(join(opts.cwd, "docs")),
    hasTests:
      existsSync(join(opts.cwd, "tests")) ||
      existsSync(join(opts.cwd, "test")) ||
      existsSync(join(opts.cwd, "__tests__")),
    hasWorkflows: existsSync(join(opts.cwd, ".github", "workflows")),
  };
  writeFileSync(target, buildPolicyYaml(detected, opts.withConstitution ?? false));
  io.log(`Wrote interlock.yml (mode: observe).`);
  io.log("");
  io.log("Add this workflow to finish the install:");
  io.log("");
  io.log(WORKFLOW_SNIPPET);
  io.log("Then open any PR — Interlock will post its first verdict.");
  if (opts.withConstitution) {
    io.log("");
    return scaffoldConstitution({ cwd: opts.cwd, force: opts.force }, io);
  }
  return 0;
}
