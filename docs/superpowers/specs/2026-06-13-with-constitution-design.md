# `agent-interlock init --with-constitution` — Design

**Date:** 2026-06-13
**Status:** Approved (brainstorm session 2026-06-13)
**Repo:** `farshadpasbani/interlock` · package: `agent-interlock` · License: Apache-2.0
**Supersedes:** the v0.4 "constitution template pack" line in
`docs/superpowers/specs/2026-06-12-interlock-v0.1-design.md` — pulled forward.

## What this is

An opt-in flag on the existing CLI that scaffolds the **full agent-fleet constitution** —
the charter, the master-loop controller, the loop-policy, CODEOWNERS, a stack-aware CI gate,
and the per-harness controller adapters — alongside the `interlock.yml` tier-gate. It makes
**the loop installable, not just admirable.**

```bash
agent-interlock init                      # unchanged: writes interlock.yml + prints the workflow
agent-interlock init --with-constitution  # ALSO lays down the constitution
```

It is **deterministic and self-contained**: no LLM, no network, no dependency on the
author's machine. Everything is sourced from `git`, `package.json`/`pyproject.toml`, and
templates embedded in the published bundle.

## Why

- The loop is the differentiated asset and the launch's selling point (see the two launch
  essays). But what `npx agent-interlock init` installs today is only the fuse (the
  tier-gate). A reader who falls for the loop essay then installs the gate, not the loop.
  This closes that gap.
- An agentic `/constitution-init` skill already scaffolds the constitution *intelligently*
  (stack-aware, opens a PR). This feature packages a **deterministic subset** into the npm
  CLI so anyone — on any agent harness, with no Claude skill — can adopt the governance.
- It deliberately preserves the wedge: `agent-interlock init` with no flag stays a
  one-minute, one-file install. The constitution is **opt-in**, never bundled into the core
  path. (The product decision from the v0.1 spec holds: fuse adoptable in a minute;
  constitution for those who want the whole organism.)

## Design principle that fell out of brainstorming

**The governance is project-agnostic; only the wiring is project-specific.** The tiers, the
cycle, the protected paths, shadow commissioning — none depend on *what* the project is.
What an agent is *allowed* to do is set by which paths are Tier 2, not by prose. So the only
fields the scaffold must get right are the **mechanical** ones (owner, repo, GitHub handle
for CODEOWNERS, stack commands), and every one of those is auto-detectable. The free-text
"what is this / who's it for" fields are orientation prose for `AGENTS.md`; they get a
one-line generic default the user may edit, and they never block the scaffold.

## CLI surface

- One new flag on `init`: `--with-constitution` (boolean), plus the existing `--force`.
- `agent-interlock init --with-constitution` runs the normal `interlock.yml` write **and**
  the constitution scaffold, with the two kept in sync (see *Germline sync*).
- Exit codes unchanged: `0` success, `2` config/safety error (e.g. refusing to overwrite).
- **Single-owner governance only.** There is no team mode. The constitution always ships in
  its single-sovereign form: Tier 1 merges on green CI + both review agents clean (no human
  counter-sign), Tier 2 is the owner's call. "One owner gives the green light" is the whole
  model — which removes a whole class of CODEOWNERS-membership and variant-template
  complexity.

## What it writes

Template → repo path (canonical mapping, mirroring `/constitution-init`):

| Template file | Written to |
|---|---|
| `CONSTITUTION.md` | `docs/agents/CONSTITUTION.md` |
| `loop-policy.md` | `docs/agents/loop-policy.md` |
| `master-loop.md` | `docs/agents/master-loop.md` |
| `field-guide.md` | `docs/agents/README.md` |
| `SETUP.md` | `docs/agents/SETUP.md` |
| `triage-labels.md` | `docs/agents/triage-labels.md` |
| `domain.md` | `docs/agents/domain.md` |
| `adr-0001-adopt-agent-governance.md` | `docs/adr/0001-adopt-agent-governance.md` |
| `AGENTS.md` | `AGENTS.md` |
| `CONTEXT.md` | `CONTEXT.md` |
| `CODEOWNERS` | `.github/CODEOWNERS` |
| `pull_request_template.md` | `.github/pull_request_template.md` |
| generated (stack-aware) | `.github/workflows/ci.yml` |
| `adapters/claude-SKILL.md` | `.claude/skills/master-loop/SKILL.md` |
| `adapters/cursor-master-loop.mdc` | `.cursor/rules/master-loop.mdc` |
| generated (thin) | `CLAUDE.md` (`@AGENTS.md` + Claude binding note) |

`loop-policy.md` is written with `status: shadow` and `journal_issue: null`. All harness
adapters are scaffolded (they're tiny); the user deletes any they don't use.

## Placeholder filling (deterministic sources)

The template carries 14 placeholders. Sources:

| Placeholder | Source |
|---|---|
| `{{OWNER}}`, `{{REPO}}` | parse `git remote get-url origin` (https + ssh forms) |
| `{{OWNER_HANDLE}}` | `{{OWNER}}` (the org/user from the remote) — **load-bearing**: CODEOWNERS needs a real handle |
| `{{GIT_ACCOUNT}}` | `git config user.email`, else `{{OWNER}}` |
| `{{INSTALL_CMD}}` `{{TEST_CMD}}` `{{LINT_CMD}}` `{{TYPECHECK_CMD}}` `{{FORMAT_CMD}}` `{{RUN_CMD}}` | stack detection (below) |
| `{{CI_CHECK_NAME}}` | `checks` (constant; the generated CI job name) |
| `{{PROJECT_DESCRIPTION}}` `{{TEAM_AND_DOMAIN}}` `{{END_USERS_AND_STAKES}}` | one-line generic default referencing the repo name, wrapped in an editable marker — cosmetic, non-blocking |

**Done invariant:** after fill, `grep -rE '\{\{' ` over the written files finds nothing.
(Generic defaults are real text, not placeholders — they satisfy the grep.)

### Stack detection

`detectStack(cwd)` returns the six commands + a flag for whether detection succeeded:

- **`package.json` present** → npm. Read its `scripts`: map `test`/`lint`/`typecheck` (or
  `tsc`)/`build`/`format` to `npm run <name>` when present; fall back to `npm install`,
  `npm test`, and omit-with-note for absent scripts (write a `# none configured` comment, as
  the current Interlock scaffold already does for missing lint/format).
- **`pyproject.toml` + `uv.lock`** → uv: `uv sync`, `uv run pytest`, `uv run ruff check .`,
  `uv run mypy .`, etc.
- **Neither** → leave generic command placeholders with a one-line "fill these in" comment
  and `print` a warning; the scaffold still completes.

`ci.yml` is generated to run the detected install + typecheck + test (+ the
Interlock-style "bundle reproducible" step is omitted — that's Interlock-repo-specific), job
name `checks` so it matches `{{CI_CHECK_NAME}}` and the SETUP branch-protection instructions.

## Single-owner governance (no variant logic)

There is no solo/team switch, so there are **no variant placeholders and no runtime
prose-editing**. The vendored template is the single-owner form outright: the Tier-1
human-counter-sign clause is already waived in the prose, and `.github/CODEOWNERS` lists the
one detected owner. This is the model the user wants — a single owner's green light merges a
PR — and it deletes the entire class of CODEOWNERS-membership and template-variant work.

(If a team mode is ever wanted, it returns as a separate amendment; the agentic
`/constitution-init` still offers it for repos that need it.)

## Germline sync (the dogfood invariant)

The set of protected paths must be identical in two places: `interlock.yml`'s `tier2` and
`loop-policy.md` §2's domain path globs. The CLI holds **one** germline-path list and renders
both from it, so they cannot drift at scaffold time:

```
docs/agents/**, .github/workflows/**, .github/CODEOWNERS, interlock.yml
```

When `--with-constitution` runs, `interlock.yml`'s `tier2` is generated from this list (plus
`interlock.yml` self-protection), superseding the leaner default `buildPolicyYaml` produces
for the no-constitution path.

## What it deliberately does NOT do

No network, no auth, no GitHub API. The scaffold writes files and **prints a one-time setup
checklist** (sourced from `SETUP.md`): the `gh label create` block, "enable branch
protection on `main` requiring the `checks` + `interlock` status checks," and "open a pinned
Loop Journal issue and set `journal_issue` in `loop-policy.md`." The genesis is the user's to
commit. (An opt-in `--pr` that uses `gh` is explicitly out of scope for v1.)

## Self-containment / build

- The constitution template is **vendored** into the repo at
  `packages/cli/templates/constitution/` (a committed copy of `~/.claude/constitution/`,
  minus `pacemaker/` and `.git`). This is the version-controlled source of truth for the
  packaged CLI; the author's `~/.claude/constitution/` stays the personal master.
- A prebuild step (`scripts/embed-templates.mjs`) reads those files and emits
  `src/templates.generated.ts` — a `Record<string, string>` of relative-path → file
  contents. esbuild bundles it, so the published CLI is still a **single self-contained
  file** with the templates inlined as strings. No runtime filesystem or download.
- `build` and `prepublishOnly` run the embed step before esbuild. The generated file is
  git-ignored (regenerated on build) or committed (decide in the plan; ignoring is cleaner).

## Architecture

Mirrors the existing `init.ts` (pure functions + a thin fs runner):

- `src/constitution/detect.ts` — `detectStack(cwd)`, `parseRemote(url)` /
  `detectRepo(cwd, exec)`. Pure (exec injected), unit-tested.
- `src/constitution/render.ts` — `fillPlaceholders(text, values)`, `germlinePaths()`,
  `buildCodeowners(owner, team)`, `buildCi(stack)`, the solo/team variant table. Pure.
- `src/commands/constitution.ts` — `scaffoldConstitution(opts, io)`: resolves values, renders
  every template, writes to disk at the canonical paths, prints the checklist. Does the fs.
- `src/templates.generated.ts` — generated; the embedded template strings.
- `init.ts` — extended: when `--with-constitution`, call `scaffoldConstitution` and render
  `interlock.yml`'s `tier2` from `germlinePaths()`.

## Error handling

- **Already governed:** `docs/agents/CONSTITUTION.md` exists → refuse without `--force` (exit
  2, "already has a constitution; this is an update — re-run with --force or edit by hand").
- **No git remote:** owner/repo undetectable → fill with a loud editable marker and **warn**
  that CODEOWNERS won't enforce until a real handle is set (this one genuinely matters).
- **No recognised stack:** generic command placeholders + a printed note; scaffold still
  succeeds.
- **Partial pre-existing files** (e.g. an `AGENTS.md` already present): `--force` overwrites;
  without it, refuse and name the conflict.

(There is no `--team` path, so no co-owner-discovery error case.)

## Testing

- `detectStack`: npm (full scripts / partial / none), uv, neither → correct command sets.
- `parseRemote`: `https://github.com/o/r.git`, `git@github.com:o/r.git`, no-`.git`, no remote.
- `fillPlaceholders`: every one of the 14 placeholders + the variant placeholders replaced;
  **invariant test**: no `{{` survives in any rendered template.
- Germline sync: `interlock.yml` `tier2` set == `loop-policy.md` domain globs (same source).
- Embed: the generated module contains every vendored template file, non-empty.
- Integration: scaffold into a temp git repo → assert every expected path exists, `status:
  shadow`, CI job named `checks`, and `grep -rE '\{\{'` over the output is empty.

## Scope

**In (v1 of the flag):**
- `--with-constitution` (single-owner only), deterministic scaffold, stack-aware CI,
  germline sync, embedded templates, setup-checklist output.

**Out (deferred):**
- Any team / multi-owner mode (single-owner is the model; team returns only as a future
  amendment or via the agentic `/constitution-init`).
- `--pr` (open the genesis via `gh`), label creation, branch-protection toggle, journal-issue
  creation — all printed as the checklist instead.
- LLM-grade adaptation of the prose fields (that's what the agentic `/constitution-init` is
  for; this is the no-LLM packaged path).
- The optional event-driven pacemaker workflow (explicitly excluded, as in the skill).

## Done criterion

`grep -rE '\{\{'` over a scaffolded repo finds nothing; `tsc` clean; the full vitest suite
green (new unit + integration tests included); a scaffold into a fresh temp repo produces a
valid, shadow-mode constitution whose `ci.yml` job is `checks` and whose protected-path lists
agree between `interlock.yml` and `loop-policy.md`.

## Open questions (non-blocking)

- Commit `src/templates.generated.ts` or git-ignore + regenerate on build? (Lean: ignore.)
- Should `--with-constitution` imply a different success message that points at the loop
  essay / SETUP? (Lean: yes — it's the natural funnel.)
- Naming: keep `--with-constitution`, or add `--with-loop` as an alias since the loop is the
  pitch? (Lean: ship `--with-constitution`, accept `--with-loop` as a hidden alias.)
