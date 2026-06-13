# Launch playbook

Center of gravity: **the constitution is the rally point; Interlock is the call to action.**
The tool is the conversion mechanism (measurable, low-friction, absorbable). The constitution
is the moat (un-clonable worldview + receipts) and the thing that defends against the
platform-absorption pre-mortem. Lead with the idea; close with the install.

## Artifacts

| File | What | Where it goes |
|---|---|---|
| `manifesto.md` | The hero essay — "I gave my coding agents a constitution" | Blog (farshadpasbani.github.io/interlock or equiv). The canonical narrative; everything links here. |
| `show-hn.md` | HN: primary = submit the essay; fallback = tool-first Show HN | news.ycombinator.com |
| `reddit-claudeai.md` | Reddit post (constitution-led, fleet-built-it hook) | r/ClaudeAI, then r/ChatGPTCoding, r/ExperiencedDevs, r/devops |
| `x-thread.md` | 8-tweet thread | X |

## Sequence (don't fire everything at once)

1. **Publish the essay** on the blog first — it's the destination every other post links to.
   Make sure the repo README and `npx agent-interlock init` both work before anyone clicks
   (already verified live on npm).
2. **Hacker News** — submit the essay as the lead. Best on a weekday morning US-Eastern. Be
   present in the thread for the first 2–3 hours; HN lives or dies on author replies. The
   honest "here's a bug a review caught" beat is bait for good technical discussion — lean
   into it, don't defend.
3. **r/ClaudeAI same day or +1**, once you've got a feel for which framing landed on HN.
   Reddit wants you in the comments too.
4. **X thread** as the ambient/evergreen version — pin it; it keeps working after the HN
   spike fades.
5. **Publish the constitution as a standalone companion** (optional, post-traction): a
   dedicated `farshadpasbani/constitution` repo or a polished page, so the worldview has a
   home that isn't buried in the tool's `docs/agents/`. For launch, the in-repo
   `docs/agents/CONSTITUTION.md` link is enough.

## Before posting — fill these in

- [ ] Replace `[essay link]` / `[manifesto link]` placeholders with the real blog URL.
- [ ] Confirm the `CONSTITUTION.md` link resolves (it does today:
      https://github.com/farshadpasbani/interlock/blob/main/docs/agents/CONSTITUTION.md ).
- [ ] GitHub Marketplace listing is live (so "search the Marketplace" works for readers).
- [ ] `npx agent-interlock init` smoke-tested from a clean machine one more time.
- [ ] Decide whether to soft-launch (one channel, gather feedback, fix, then the rest) or
      go wide same day. Solo + zero audience → soft-launch HN first is lower-risk.

## The metric that matters

The kill rule from day one: **flat conversion-given-reach for 6–8 weeks = kill or pivot.**
The clock starts when reach exists — i.e. when these posts go out and the Marketplace listing
is live. Reach without conversion is a product signal; *no* reach is a distribution problem
(fix the posts/channels first, don't blame the product). Track: npm downloads, GitHub stars,
Marketplace installs (reach) vs. repos with a committed `interlock.yml` and repeat CI runs
(conversion).

## Tone reminders

- HN: technical honesty, invite critique, name the limitations and the caught bug. Hype gets
  punished; candor gets upvoted.
- Reddit: warmer to the agentic angle; the fleet-built-the-governor story can lead.
- X: hook-first, one idea per tweet, the install is the payoff not the opener.
- Everywhere: it's a fuse, not another AI. That line does a lot of work — keep it.
