# X / Twitter thread

Lead with the idea, not the tool. The constitution is the hook; the install is the payoff.

---

**1/**
I let AI agents write code and open PRs against my repos while I sleep.

What made that safe wasn't a smarter model. It was a written constitution for the fleet — a
charter for what they may do alone, what needs me, and what they may never touch.

The case for governing agents, not supervising them: 🧵

**2/**
The dilemma everyone with capable agents hits:

Review every diff → you rebuilt the bottleneck you bought agents to escape.
Trust them → one "tidies up" your CI config at 2am and you learn in prod.

Supervision doesn't scale. Blind trust doesn't survive. No dial between.

**3/**
So I built a dial — and it needed a theory.

I borrowed it from physiology: a healthy body isn't goal-seeking, it's deviation-correcting.
It doesn't maximise a number; it defends setpoints and corrects when they drift.

Pursue output → metastasis.
Defend setpoints → homeostasis.

**4/**
So the constitution never tells the agents what to maximise. It defines what they defend:

• Tiered autonomy by reversibility of harm (docs free / code reviewed / CI+auth = humans only)
• They may only act on work a human anchored — never a to-do list they invent (that's autoimmune)
• They learn into docs, never into the law

**5/**
Most of that charter is prose an agent "mostly" obeys.

But a governance system you can talk out of governing isn't one.

So I extracted the part that must be mechanical into deterministic code. No LLM in the loop.
Globs + rules, same verdict every time.

A fuse, not another AI.

**6/**
That's Interlock. One `interlock.yml`, a GitHub Action that stamps every PR with its tier —
Tier 2 = agents may not pass.

Reads its policy from the base branch (a PR can't weaken the rules that judge it). Protects
its own config (can't edit its own off-switch). Starts in observe mode.

**7/**
The part I can't argue with:

The repo is governed by the same constitution it ships. An agent fleet built most of v0.1
under it. The first thing the finished gate did in CI was flag its own setup PR as Tier 2 —
refusing to wave through the change that installed it.

The governor governing its own birth.

**8/**
v0.1. Apache-2.0. Runs on your own CI, nothing hosted.

```
npx agent-interlock init
```

Essay (the why): [link]
Repo: github.com/farshadpasbani/interlock

If you run agents: which paths would you never let one touch?
