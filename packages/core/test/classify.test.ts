import { describe, expect, it } from "vitest";
import { classifyAuthor, tierForPath } from "../src/classify.js";
import { parsePolicy } from "../src/policy.js";

const policy = parsePolicy(`
version: 1
authors:
  agents:
    accounts: ["*[bot]", "my-agent"]
    branches: ["claude/*", "agent/*"]
    trailers: ["Co-Authored-By: Claude*"]
tiers:
  tier0: ["docs/**", "**/*.md", "tests/**"]
  tier2: [".github/**", "interlock.yml", "src/auth/**"]
`);

describe("classifyAuthor", () => {
  it("matches bot accounts literally despite brackets in the glob", () => {
    // "[bot]" must NOT be treated as a character class
    expect(classifyAuthor({ account: "renovate[bot]" }, policy)).toBe("agent");
    expect(classifyAuthor({ account: "rb" }, policy)).toBe("human");
  });

  it("matches exact account names", () => {
    expect(classifyAuthor({ account: "my-agent" }, policy)).toBe("agent");
  });

  it("matches branch prefixes", () => {
    expect(
      classifyAuthor({ account: "farshad", branch: "claude/fix-1" }, policy)
    ).toBe("agent");
  });

  it("matches commit trailers", () => {
    expect(
      classifyAuthor(
        {
          account: "farshad",
          trailers: ["Co-Authored-By: Claude <noreply@anthropic.com>"],
        },
        policy
      )
    ).toBe("agent");
  });

  it("defaults to human", () => {
    expect(
      classifyAuthor({ account: "farshad", branch: "fix/typo" }, policy)
    ).toBe("human");
  });
});

describe("tierForPath", () => {
  it("matches tier0 globs", () => {
    expect(tierForPath("docs/intro.md", policy)).toEqual({
      tier: 0,
      matchedRule: "docs/**",
    });
  });

  it("defaults to tier 1", () => {
    expect(tierForPath("src/engine.ts", policy)).toEqual({
      tier: 1,
      matchedRule: "default",
    });
  });

  it("matches tier2 globs", () => {
    expect(tierForPath("src/auth/login.ts", policy).tier).toBe(2);
  });

  it("protected wins when globs overlap (tier2 checked first)", () => {
    // .github/README.md matches both "**/*.md" (tier0) and ".github/**" (tier2)
    expect(tierForPath(".github/README.md", policy)).toEqual({
      tier: 2,
      matchedRule: ".github/**",
    });
  });

  it("matches dotfiles (dot: true)", () => {
    expect(tierForPath(".github/workflows/ci.yml", policy).tier).toBe(2);
  });
});
