# Setup & commissioning — making the Constitution enforceable

A one-time runbook for the repo admin. The Constitution describes the rules; **this turns them
from prose the team agreed to into rules GitHub enforces.** Until Step 1 is done, the tiers are a
gentleman's agreement — anyone (or any agent) can push straight to `main`.

> This file is a runbook, not law — edit it freely. It is the *last* change that may land on
> `main` without the gate, because it is the change that closes the gate.

---

## Step 1 — Branch protection on `main` (the critical one)

Two ways: the GitHub UI (click-through) or the API (reproducible). Either gives the same result.

### Option A — GitHub UI

**Settings → Branches → Add branch ruleset** (or *Add classic branch protection rule*) for
`main`, and enable:

> **Solo configuration.** You are the single sovereign. Requiring 1 human approval on every PR
> would be unsatisfiable — you cannot approve your own PRs. The settings below enforce the
> single-sovereign model: green checks gate all PRs; the Code Owner review rule gates Tier-2
> (protected-path) PRs to you without requiring a second human approval on ordinary Tier-1 work.

| Setting | Enforces | Constitution |
|---|---|---|
| **Require a pull request before merging** | the hands cannot self-merge; nothing reaches `main` un-PR'd | Art. II, III |
| → **Require approvals: 0** | solo model — Tier-1 merges on green checks + agent reviews alone; Tier-2 is gated by the Code Owner rule below | Art. III |
| → **Require review from Code Owners** | you (the sole CODEOWNERS entry) must approve PRs touching protected paths (Tier-2) | Art. II, III, X |
| → **Dismiss stale approvals on new commits** | re-review after the diff changes | Art. III |
| **Require status checks to pass** → select **`{{CI_CHECK_NAME}}`** and **`interlock`** | `main` is always green; CI + the interlock gate are the innate-immunity gate | Art. I, V |
| → **Require branches to be up to date before merging** | no merge onto a stale base | Art. I |
| **Do not allow bypassing the above settings** (a.k.a. *include administrators / enforce_admins*) | no organ sits above the law — even the sovereign goes through review | Art. II interlock |
| **Block force pushes** | history is not rewritten under the fleet | Art. VIII |
| **Restrict deletions** | `main` cannot be deleted | — |

The status check named **`{{CI_CHECK_NAME}}`** is the job in `.github/workflows/ci.yml`. It only appears in
the picker *after the first CI run* — if you don't see it, push any commit / open any PR once,
let CI run, then add it.

### Option B — API (reproducible, needs work-account auth)

`gh` must be authenticated as a member of `{{OWNER}}` with admin on the repo (the
personal account cannot see it). Then:

```bash
gh api -X PUT repos/{{OWNER}}/{{REPO}}/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["{{CI_CHECK_NAME}}", "interlock"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "require_code_owner_reviews": true,
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

> **Solo sovereign:** `required_approving_review_count: 0` is intentional. You cannot approve
> your own PRs; Tier-1 merges on green checks + both agent reviews. The `require_code_owner_reviews`
> rule above still gates Tier-2 protected-path PRs to you — GitHub treats a CODEOWNERS review as
> distinct from the numeric approval count. If the team ever grows, raise the count by amendment
> (a CODEOWNERS-reviewed PR), never silently.

---

## Step 2 — Create the labels

The fleet speaks in labels. Create them once (the exact `gh label create` block lives in
[`triage-labels.md`](./triage-labels.md)). Run it from an environment authenticated for the org
repo, or create the labels in the GitHub UI under **Issues → Labels**.

## Step 3 — Open the Loop Journal

Create one pinned issue titled **"Loop Journal"** — the fleet writes one comment per cycle there
(Constitution Article IX). Then set its number in [`loop-policy.md`](./loop-policy.md):
`journal_issue: <number>`. (That edit is germline — it goes through a PR.)

## Step 4 — Populate CODEOWNERS

[`.github/CODEOWNERS`](../../.github/CODEOWNERS) should list you as the sole owner. You are the
single sovereign — Tier-2 (protected-path) PRs require your review; ordinary Tier-1 PRs merge on
green checks + both agent reviews without a human approval you cannot give yourself. There is no
second human to add. If the team ever grows, add teammates here and raise the approval count in
Step 1 by amendment.

## Step 5 — Commission in shadow, then go live

The fleet boots in `shadow` (`loop-policy.md` → `status: shadow`): it runs every cycle but
**merges nothing**, labelling would-be merges `would-auto-merge` for you to audit. When **ten
consecutive `would-auto-merge` PRs** have been audited clean, a sovereign flips
`status: live` (a germline edit — by PR). Auto-merge for Tiers 0 and 1 then turns on; Tier 2 stays
human forever.

## Step 6 — Sessionless operation (optional)

An optional event-driven workflow (a GitHub Actions file that wakes the loop on issue/PR/CI
events with no live session) is **not included in this scaffold**. Run the loop from a live agent
session instead: `/master-loop` once (it self-paces while your session is open),
`/loop /master-loop`, or a cloud `/schedule`. These run on your Claude Code subscription with no
extra API billing and are the recommended approach for a single-sovereign repo.

---

## Verify

After Step 1, confirm the gate is real — try to push a trivial commit straight to `main`:

```bash
git commit --allow-empty -m "test: protection" && git push origin main
```

It should be **rejected** ("protected branch hook declined"). If it goes through, protection is
not active — recheck Step 1. (Delete the test commit afterward: `git reset --hard origin/main`.)
