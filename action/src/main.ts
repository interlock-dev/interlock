import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  classify,
  classifyAuthor,
  gate,
  parsePolicy,
  PolicyError,
  InvalidPathError,
  type Policy,
} from "interlock-core";
import {
  buildComment,
  decodeContentResponse,
  extractTrailers,
  latestApprovers,
  mapFiles,
  MARKER,
  withRetry,
} from "./helpers.js";

type Octokit = ReturnType<typeof github.getOctokit>;

async function fetchPolicyText(
  octokit: Octokit,
  policyPath: string,
  baseRef: string
): Promise<string | null> {
  let res;
  try {
    res = await withRetry(() =>
      octokit.rest.repos.getContent({
        ...github.context.repo,
        path: policyPath,
        ref: baseRef,
      })
    );
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
  // decodeContentResponse throws for oversized/undecodable content — its throw
  // propagates out of fetchPolicyText to run().catch → setFailed (fail LOUD).
  return decodeContentResponse(res.data as { content?: string; encoding?: string; size?: number });
}

async function countHumanApprovals(
  octokit: Octokit,
  prNumber: number,
  policy: Policy
): Promise<number> {
  const reviews = await withRetry(() =>
    octokit.paginate(octokit.rest.pulls.listReviews, {
      ...github.context.repo,
      pull_number: prNumber,
    })
  );
  const approvers = latestApprovers(reviews);
  const humanApprovers = [...approvers].filter(
    (login) => classifyAuthor({ account: login }, policy) === "human"
  );
  return humanApprovers.length;
}

async function upsertComment(
  octokit: Octokit,
  prNumber: number,
  body: string
): Promise<void> {
  const comments = await withRetry(() =>
    octokit.paginate(octokit.rest.issues.listComments, {
      ...github.context.repo,
      issue_number: prNumber,
    })
  );
  const existing = comments.find((c) => c.body?.includes(MARKER));
  if (existing) {
    await withRetry(() =>
      octokit.rest.issues.updateComment({
        ...github.context.repo,
        comment_id: existing.id,
        body,
      })
    );
  } else {
    await withRetry(() =>
      octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: prNumber,
        body,
      })
    );
  }
}

async function setTierLabel(
  octokit: Octokit,
  prNumber: number,
  tier: number
): Promise<void> {
  const wanted = `interlock:tier-${tier}`;
  const labels = await withRetry(() =>
    octokit.rest.issues.listLabelsOnIssue({
      ...github.context.repo,
      issue_number: prNumber,
    })
  );
  for (const l of labels.data) {
    if (l.name.startsWith("interlock:tier-") && l.name !== wanted) {
      await withRetry(() =>
        octokit.rest.issues.removeLabel({
          ...github.context.repo,
          issue_number: prNumber,
          name: l.name,
        })
      );
    }
  }
  if (!labels.data.some((l) => l.name === wanted)) {
    await withRetry(() =>
      octokit.rest.issues.addLabels({
        ...github.context.repo,
        issue_number: prNumber,
        labels: [wanted],
      })
    );
  }
}

async function run(): Promise<void> {
  const token = core.getInput("github-token", { required: true });
  const policyPath = core.getInput("policy-path") || "interlock.yml";
  const octokit = github.getOctokit(token);
  const pr = github.context.payload.pull_request;
  if (!pr) {
    core.setFailed("Interlock only runs on pull_request events.");
    return;
  }
  const prNumber = pr.number;

  // The policy is read from the BASE ref: a PR cannot weaken the law that judges it.
  const policyText = await fetchPolicyText(
    octokit,
    policyPath,
    pr.base.ref as string
  );
  if (policyText === null) {
    core.info(
      `No ${policyPath} on ${pr.base.ref}. Run \`npx agent-interlock init\` to adopt Interlock.`
    );
    await core.summary
      .addRaw(
        `Interlock: no \`${policyPath}\` found on \`${pr.base.ref}\` — nothing to enforce. Run \`npx agent-interlock init\`.`
      )
      .write();
    return; // neutral: missing policy is a hint, not a failure
  }

  let policy: Policy;
  try {
    policy = parsePolicy(policyText);
  } catch (e) {
    if (e instanceof PolicyError) {
      core.setFailed(e.message); // invalid policy fails LOUD, never fail-open
      return;
    }
    throw e;
  }

  const apiFiles = await withRetry(() =>
    octokit.paginate(octokit.rest.pulls.listFiles, {
      ...github.context.repo,
      pull_number: prNumber,
      per_page: 100,
    })
  );
  const commits = await withRetry(() =>
    octokit.paginate(octokit.rest.pulls.listCommits, {
      ...github.context.repo,
      pull_number: prNumber,
      per_page: 100,
    })
  );

  const author = {
    account: (pr.user?.login as string) ?? "unknown",
    branch: pr.head?.ref as string | undefined,
    trailers: extractTrailers(commits.map((c) => c.commit.message)),
  };

  let verdict;
  try {
    verdict = classify(mapFiles(apiFiles), author, policy);
  } catch (e) {
    if (e instanceof InvalidPathError) {
      core.setFailed(e.message); // malformed paths fail LOUD — never silently pass a gate
      return;
    }
    throw e;
  }
  const needsApprovals = verdict.violations.some(
    (v) => v.setting === "require-review"
  );
  const humanApprovalCount = needsApprovals
    ? await countHumanApprovals(octokit, prNumber, policy)
    : 0;
  const gating = gate(verdict, { humanApprovalCount });

  const comment = buildComment(verdict, gating);
  let cosmeticError: Error | null = null;
  try {
    await upsertComment(octokit, prNumber, comment);
    await setTierLabel(octokit, prNumber, verdict.tier);
    await core.summary.addRaw(comment.replace(MARKER, "")).write();
  } catch (e) {
    cosmeticError = e as Error;
    core.warning(`Interlock could not post results: ${cosmeticError.message}`);
  }

  if (gating.shouldFail) {
    core.setFailed(gating.reasons.join("; "));
  } else if (cosmeticError) {
    core.setFailed(
      `verdict OK (Tier ${verdict.tier}) but Interlock could not post results: ${cosmeticError.message}`
    );
  } else {
    core.info(
      `Interlock: Tier ${verdict.tier} (${verdict.authorClass}), mode ${verdict.mode} — OK.`
    );
  }
}

run().catch((e: Error) => core.setFailed(`Interlock error: ${e.message}`));
