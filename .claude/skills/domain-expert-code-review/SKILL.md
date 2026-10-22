---
name: domain-expert-code-review
description: Use when backend code for a spec-described feature has just been implemented, before acceptance tests are written, to verify the code matches the spec's business rules
---

# Domain Expert Code Review

## Overview

A code review of spec-described backend work is not "review this diff." A
reviewer who is only handed a diff — even a careful one — reviews what's in
front of them: hashing strength, error handling, race conditions, style. None
of that tells you whether the code implements the business rule the spec
actually requires. Baseline testing confirmed this: given a login module with
a silently-missing account-lockout rule, and told only that "there's a spec
somewhere" but not shown it, a reviewer returned eight real findings — timing
attacks, unsalted hashes, a registration race — and listed the lockout gap
dead last, explicitly hedged as unverified ("worth a second pass against the
spec once it's available"). The one finding that mattered was buried under
generic security commentary because the reviewer never saw the rule it was
supposed to check against.

The fix is not a smarter reviewer. It's giving the reviewer the spec text
itself, inline, in the dispatch prompt — not a pointer to a file it has to go
find.

## When to Use

Use right after backend code for an SRS/BRD-described feature has been
written (post-TDD-green), and before acceptance tests are written for that
feature. This is the point in `feature-from-srs` between the backend
implementation step and the acceptance-test step.

Do not use for pure style/refactor passes with no spec behind them, and don't
substitute this for the acceptance tests themselves — this is a conformance
*review*, not a test suite.

## Quick Reference

| Step | Action |
|---|---|
| 1. Dispatch a fresh subagent | `Agent` tool, `general-purpose` or `code-review` type — never a fork, never yourself |
| 2. Build the dispatch prompt as a contract | Embed verbatim: the SRS excerpt text, the code diff/paths, a domain-expert role-play instruction, a `ReportFindings` instruction |
| 3. Triage the findings | Missed-business-rule severity → fix code + re-run backend test suite. Style-only → may defer. |

## Procedure

### 1. Always dispatch a fresh subagent

Use the `Agent` tool with `subagent_type: general-purpose` (or `code-review`
if available in your environment). Never use a fork, and never do the review
yourself inline. The value of this review is an independent read, unprimed
by the context in which the code was just written — a fork inherits that
context and loses the independence; reviewing it yourself has the same
problem.

### 2. The dispatch prompt is a contract, not a suggestion

The dispatch prompt must contain these four parts, in the prompt text
itself — not references to where the reviewer could go look them up:

1. **The SRS excerpt, verbatim, inline.** Paste the actual extracted text
   (the output of `extract_spec.py` from earlier in the flow) into the
   prompt. Not "the spec is in `deliverables/SRS.docx`, section 4.2" — the
   actual FR/BR/UC text, pasted in full. A reviewer without the rule text in
   front of it has nothing to check the code against, and will default to
   generic code review — this is exactly the baseline failure.
2. **The code just written.** The diff, or the file paths plus their current
   contents if a diff isn't available. Enough that the reviewer doesn't have
   to go hunting for what changed.
3. **An explicit role-play instruction.** Tell the reviewer to act as a
   domain expert in the business the spec describes (e.g. "you are a
   marketplace operations expert reviewing this checkout code" — name the
   actual domain, not a generic "senior engineer"), and to check two specific
   things against the excerpt: (a) does the code implement every FR/BR/UC
   rule stated in the excerpt, and (b) is there any business case the
   excerpt describes that the code silently skips. Name both checks
   explicitly — don't just say "review for spec conformance."
4. **An explicit instruction to report via `ReportFindings`.** Tell the
   reviewer to call the `ReportFindings` tool (already available in the
   environment — nothing to install or define) to report its results, rather
   than just replying in prose. State this plainly in the prompt; a reviewer
   not told this may report back in free text instead, which is harder to
   triage mechanically in step 3.

A minimal skeleton (adapt the bracketed parts, keep all four numbered parts
present):

```
A backend feature has just been implemented. Review it against the spec
excerpt below — not for code style, but for business-rule conformance.

=== SRS EXCERPT (verbatim) ===
<paste the full extract_spec.py output text here>
=== END EXCERPT ===

=== CODE JUST WRITTEN ===
<paste the diff, or file paths + contents>
=== END CODE ===

Role-play a domain expert in the business this spec describes (e.g. a
[payments / marketplace / healthcare-scheduling / ...] operations expert —
name the actual domain). Check specifically:
1. Does the code implement every FR/BR/UC rule stated in the excerpt above?
2. Is there any business case the excerpt describes that the code silently
   skips?

Report your findings by calling the `ReportFindings` tool — do not just
reply in prose.
```

Treat all four numbered parts as required fields, not optional framing —
leaving any one out reopens the gap the baseline failure demonstrated
(reviewer without the rule text defaults to generic review; reviewer without
the role-play instruction defaults to generic "senior engineer" review;
reviewer without the `ReportFindings` instruction replies in free text
instead of a structured, triageable report).

### 3. Triage the findings

Once `ReportFindings` returns:

- **Any finding at a severity indicating a missed business rule** (the code
  doesn't implement an FR/BR/UC the excerpt states, or silently skips a
  business case the excerpt describes) — go back and fix the code, then
  re-run the backend's existing test suite, before moving on to acceptance
  tests.
- **Purely stylistic findings** (naming, formatting, minor efficiency, things
  that don't touch whether a spec rule is implemented) — these may be
  deferred; they don't block moving on to acceptance tests.

## Common Mistakes

- Pointing the reviewer at "the SRS file" or "the spec, section 4.2" instead
  of pasting the actual excerpt text into the prompt. The reviewer either
  won't go read it, or reads the whole document instead of the relevant
  section — either way you've lost the targeted conformance check.
- Asking for "a code review" without the role-play + two named checks. A
  generic "review this" prompt reliably produces generic findings (hashing,
  error handling, races) that are all individually true but miss the one
  thing the spec actually requires, exactly as seen in baseline testing.
- Treating a "no findings" result from a reviewer who was never shown the
  spec excerpt as a clean bill of health — it isn't a conformance check at
  all if the excerpt was never in the prompt.
- Forgetting to tell the reviewer to call `ReportFindings`, then having to
  manually parse a prose reply to figure out severities for the triage step.
