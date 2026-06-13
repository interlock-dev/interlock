# r/ClaudeAI (and r/ChatGPTCoding / r/ExperiencedDevs / r/devops)

**Title:** I gave my Claude Code fleet a constitution — and had it build the tool that enforces it

**Body:**

If you run Claude Code (or a whole fleet of agents) that opens PRs, you've felt the gap:
reviewing every agent diff yourself kills the leverage, but letting them merge freely is how
you end up with an agent quietly rewriting your CI config at 2am. Supervision doesn't scale;
blind trust doesn't survive.

I stopped trying to *supervise* my agents and started *governing* them — with a written
constitution. One idea underneath it: a healthy system isn't goal-seeking, it's
deviation-correcting. You don't tell the fleet what to maximise (that way lies confident
busywork); you define what it must defend, and let it act freely everywhere else. A few of
the rules:

- **Tiered autonomy by reversibility of harm** — Tier 0 (docs/tests) runs free, Tier 1
  (normal code) gets review, Tier 2 (CI, auth, secrets, the governance files) is humans-only.
- **An immune rule:** the fleet may only act on work a human anchored (issues, roadmap) —
  never a to-do list it invents about itself. An agent that generates its own backlog and
  executes it is autoimmune, not autonomous.
- **A barrier between learning and law:** it writes lessons into docs/tests freely, but can
  never edit its own charter/gates without a human PR.
- **Shadow commissioning:** a new setup runs in shadow (would-have-merged labels, no real
  merges) until you've audited it enough to flip it live.

Full charter (it's public): [CONSTITUTION.md link]

The part that must be mechanical — tiers, protected paths, "an agent can't touch the
load-bearing walls" — I extracted into deterministic code, because prose an agent "mostly
obeys" isn't enforcement. That's **Interlock**: one `interlock.yml`, a GitHub Action that
stamps every PR with its tier. It's a fuse, not another AI — globs and rules, same verdict
every time, no model to jailbreak.

And the part this sub will appreciate: most of Interlock v0.1 was built and adversarially
reviewed by a Claude Code agent fleet running under that constitution. Its first act in CI
was correctly flagging its own setup PR as Tier 2 and refusing to auto-wave it through. The
governor governing its own birth.

Starts in observe mode (just labels, blocks nothing) so you build trust before handing over
merge authority — not the other way around.

    npx agent-interlock init

Apache-2.0, runs on your own GitHub Actions, no hosted service. **v0.2** is a Claude Code
hook so the same policy blocks protected-path edits locally, before the PR even exists.

- Essay (the why): [manifesto link]
- Repo: https://github.com/farshadpasbani/interlock

Genuinely curious what paths you'd mark Tier 2 in your own setup — everyone's "never let an
agent touch this" list is a little different.
