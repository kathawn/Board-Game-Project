---
name: feature-from-srs
description: Use when implementing a new feature in a repo that already has an SRS/spec document describing it
---

# Feature From SRS

## Overview

This is the top-level orchestrator for taking one spec-described feature from
"not started" to "merged, with a human having approved it twice." It does not
do any of the work itself — it sequences five existing skills/tools in the
right order and enforces the two points where a human must explicitly sign
off before the flow is allowed to continue. Skipping the sequencing (e.g.
starting backend work before a mockup exists, or merging without asking) is
the failure mode this skill exists to prevent.

## When to Use

Use when asked to implement a feature end-to-end in a repo that already has
an SRS, BRD, SDD, or equivalent spec document describing that feature.

Do not use for a single isolated step someone already told you to do (e.g.
"just run the acceptance tests" or "just build the mockup") — go straight to
the skill that owns that step instead. This orchestrator is for the whole
arc, not a fragment of it.

## Quick Reference

| Step | Action | Owned by |
|---|---|---|
| 0. Branch | `git checkout -b feature/<slug>` from `main` | this skill |
| 1. Spec → mockup → Gate 1 | find the SRS excerpt, build the mockup, start the dev server, hand off for approval | **REQUIRED SUB-SKILL:** `spec-driven-mockup` (internally also uses `run` and `ui-mockup-approval-gate`) |
| 2. — | *(no separate action — Gate 1 happens inside step 1; see note below)* | `spec-driven-mockup` / `ui-mockup-approval-gate` |
| 3. Backend (TDD) | implement the backend per the step-1 spec excerpt | **REQUIRED SUB-SKILL:** `superpowers:test-driven-development` |
| 4. Domain-expert review | review the step-3 diff against the step-1 excerpt for business-rule conformance | **REQUIRED SUB-SKILL:** `domain-expert-code-review` |
| 5. Acceptance tests | write/run integration tests exercising the full UC/FR flow | this skill (plain test-writing, not a sub-skill) |
| 6. Screenshots | (re)start the dev server, capture the finished feature | **REQUIRED SUB-SKILL:** `run`, then Playwright |
| 7. Gate 2 (merge) | commit, ask the human, merge only on explicit approval | this skill |

## Procedure

### Step 0 — Branch

Before touching anything else, create a feature branch from `main`:

```
git checkout -b feature/<slug>
```

Derive `<slug>` from the UC-id/keyword the human gave you (e.g.
`feature/uc-04-dat-thue-theo-ngay`). Do this first — every later step assumes
work is happening on an isolated branch, not on `main`.

### Step 1 — Spec-driven mockup (includes Gate 1)

**REQUIRED SUB-SKILL:** Use `spec-driven-mockup`.

Hand it the feature description / UC-id. It owns, in one continuous flow:
finding the relevant SRS excerpt (via `extract_spec.py`), detecting or
bootstrapping the app, reusing the repo's existing visual patterns, starting
the dev server (via its own use of the `run` skill), and — as the *last* step
of its own procedure — handing off to `ui-mockup-approval-gate` for human
approval of the mockup.

Keep the SRS excerpt text that `spec-driven-mockup` extracts; step 3 and step
4 both need it verbatim later. Do not re-extract it yourself.

### Step 2 — Gate 1 (no separate action here)

**Gate 1 is not a second step this orchestrator performs.** It already
happened inside step 1: `spec-driven-mockup` invokes `ui-mockup-approval-gate`
itself as the last move of its own procedure, and that skill is the one that
blocks on an explicit, unambiguous human approval message before anything
proceeds. This orchestrator does not call `ui-mockup-approval-gate` a second
time after `spec-driven-mockup` returns — doing so would mean asking the
human to approve the same mockup twice.

Only move on to step 3 once `spec-driven-mockup` has actually returned having
received explicit approval through that internal handoff. If it returns
because the mockup needs changes, stay in step 1 — iterate on the mockup, you
are not clear to proceed.

### Step 3 — Backend implementation (TDD)

**REQUIRED SUB-SKILL:** Use `superpowers:test-driven-development` to
implement the backend for this feature, scoped to the SRS excerpt captured in
step 1. This produces unit-level tests exercising individual
functions/modules — not the full user-facing flow (that's step 5).

### Step 4 — Domain-expert review

**REQUIRED SUB-SKILL:** Use `domain-expert-code-review`.

Give it exactly what it requires: the step-1 SRS excerpt verbatim, and the
step-3 diff (or the changed files' current contents). It dispatches its own
fresh subagent and reports back via `ReportFindings` — you don't need to
build that dispatch yourself beyond supplying these two inputs.

- If it returns a finding at business-rule severity (code doesn't implement,
  or silently skips, a rule the excerpt states): fix the code, then re-run
  step 3's test suite before continuing.
- If it returns only style-level findings: those may be deferred; proceed to
  step 5.

### Step 5 — Acceptance / integration tests

Write and run tests that exercise the full UC/FR flow described in the
step-1 excerpt end to end — e.g. drive the actual API or UI path a real user
would take, not individual functions in isolation. This is intentionally
distinct from step 3's unit tests; it's checking that the pieces work
together the way the use case describes, not that each function works alone.

If step 4 produced a fix, re-run these acceptance tests too, not just step
3's unit suite — a business-rule fix can change end-to-end behavior that unit
tests don't cover.

### Step 6 — Screenshots

**REQUIRED SUB-SKILL:** Use `run` to (re)start the dev server if it isn't
still running from step 1 (backend work in steps 3-5 may have required a
restart). Once it's up, use Playwright to screenshot the completed feature's
key screens — the same ones a human reviewer will want to see — so Gate 2 in
step 7 has concrete evidence to ask about, not just a text description.

### Step 7 — Gate 2: merge approval (hard gate)

1. Commit all work on the feature branch.
2. Ask the human explicitly — via `AskUserQuestion` or the equivalent
   interactive-question tool in your environment — whether the complete
   feature (mockup + backend + review + acceptance tests + screenshots) is
   approved to merge into `main`. Show or reference the step-6 screenshots in
   that question.
3. **This is a hard gate, the same severity as Gate 1 in step 1.** Only on
   unambiguous, explicit approval do you merge the branch into `main`. Any
   other response — silence, a vague reaction, feedback, a question, "looks
   good" without a clear go-ahead — means: stay on the branch, treat it as
   feedback or as not yet answered, iterate, and ask again. Never auto-merge.
   There is no version of "effectively approved" that counts as approved,
   exactly as `ui-mockup-approval-gate` defines it for Gate 1 — the same
   standard applies here.

## Common Mistakes

- Calling `domain-expert-code-review` without the step-1 spec excerpt
  actually in hand (e.g. just pointing it at "the SRS file") — it needs the
  verbatim text pasted into its dispatch prompt, not a pointer to go find it.
- Treating an ambiguous reply at Gate 1 or Gate 2 ("looks good", a question,
  silence) as approval and proceeding anyway. Neither gate self-approves;
  both require an explicit, unambiguous human statement.
- Skipping step 0 — starting work on `main` (or on whatever branch happened
  to be checked out) instead of creating `feature/<slug>` first.
- Treating Gate 1 as a second, separate invocation of
  `ui-mockup-approval-gate` that this orchestrator performs after
  `spec-driven-mockup` returns. `spec-driven-mockup` already owns that
  invocation as the last step of its own procedure — re-invoking the gate
  here would mean asking the human to approve the same mockup twice.
- Conflating step 3's unit tests with step 5's acceptance tests, or skipping
  step 5 because step 3's suite already passed — they check different
  things (individual functions vs. the full UC/FR flow).
