# Hacker News

Two ways to run this on HN. Recommended: submit the **essay** as the lead (story submission),
because the constitution is the differentiated idea and HN rewards ideas over launches. Keep
the Show HN as a fallback / second beat if the essay lands well.

---

## Primary — story submission (the manifesto)

**Title:** I gave my coding agents a constitution

**URL:** link to the published essay (blog), which links the repo and the install.

*(The full text is in `manifesto.md`. Submit the essay, not the repo, as the primary link —
the repo is the CTA inside it.)*

---

## Fallback / alternate — Show HN (tool-first)

**Title:** Show HN: Interlock – a deterministic merge gate for AI coding agents

**URL:** https://github.com/farshadpasbani/interlock

**Body:**

I let AI agents (Claude Code, Codex) open PRs against my repos. The problem was never that
they're bad — it's that they're fast and occasionally catastrophic, and I had two settings:
review every diff myself (kills the speed) or trust them and hope (the genre where an agent
drops a database). No dial between.

The dial needed a theory, so I wrote one: a constitution for the agent fleet, built on one
inversion — a healthy system isn't goal-seeking, it's deviation-correcting. You don't tell
the agents what to maximise; you define what they must defend, and let them act freely
everywhere else. Tiered autonomy by reversibility of harm, an immune rule that the fleet may
only act on human-anchored work (never a to-do list it invents about itself), and a barrier
that lets it learn into docs/tests but never edit its own charter. Full text:
[essay link].

Interlock is the enforceable core of that, extracted into deterministic code. One
`interlock.yml` sorts every changed path into three tiers — Tier 0 (docs/tests,
auto-mergeable), Tier 1 (ordinary code, review), Tier 2 (CI config, auth, the policy file
itself — agents blocked, humans only). A GitHub Action posts the verdict on every PR.

The point it all hangs on: it's a fuse, not another AI. No LLM judges your PR — glob
matching, same input, same verdict, every time. A second model policing the first just gives
you two things that hallucinate.

Things that fell out of taking "never fail open" seriously: the policy is read from the PR's
base branch, so a PR can't weaken the rules that judge it; `interlock.yml` is Tier 2 by
default, so the gate can't edit its own off-switch; invalid/oversized policy fails loud,
never skipped. It starts in observe mode (labels, never blocks) so you watch it be right
before letting it bite.

    npx agent-interlock init

Honest about state: v0.1, GitHub Actions only, Tier-0 auto-merge is opt-in and coming in
v0.3; a local Claude Code / pre-commit adapter is v0.2. Apache-2.0, runs on your own CI.

Meta-note: the repo is governed by the same constitution it ships, and most of v0.1 was
built and adversarially reviewed by an agent fleet under that governance. Its first act in CI
was flagging its own setup PR as Tier 2. A review pass caught a `./`-prefix bypass that let a
protected path dodge its glob — fixed, with tests, and exactly the class of bug I'd most like
strangers to hunt for.

What would make you trust — or refuse to trust — something like this with merge rights?
