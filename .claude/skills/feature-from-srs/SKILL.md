---
name: feature-from-srs
description: Use when implementing a new feature in a repo that already has an SRS/spec document describing it
---

# Feature From SRS

## Overview

This is the top-level orchestrator for taking one spec-described feature from
"not started" to "merged, with a human having approved it twice." It does not
do any of the work itself — it sequences the existing skills/tools in the
right order and enforces the two points where a human must explicitly sign
off before the flow is allowed to continue. Skipping the sequencing (e.g.
starting backend work before a mockup exists, or merging without asking) is
the failure mode this skill exists to prevent.

**Fast-track mode (current default for this project):** to ship features fast
for a CV deadline, this flow is deliberately trimmed — no unit-test-driven
development, no written acceptance-test suite, no automated screenshots. The
human does their own manual testing in the browser and that is what decides
whether a feature works. What's still kept: both human-approval gates
(mockup, merge) and the domain-expert business-rule review — those are the
cheap, high-value checks and the ones this project explicitly asked to keep.

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
| 3. Backend | implement the backend per the step-1 spec excerpt — direct implementation, no TDD, no unit-test suite | this skill |
| 4. Domain-expert review | review the step-3 diff against the step-1 excerpt for business-rule conformance | **REQUIRED SUB-SKILL:** `domain-expert-code-review` |
| 5. Manual test handoff | start the dev server, tell the human what to click through; human's manual pass is the completion signal | **REQUIRED SUB-SKILL:** `run` |
| 6. Gate 2 (merge) | commit, ask the human, merge only on explicit approval | this skill |

## Progress Checklist

Maintain this checklist for the whole run and keep it visible to the human —
post the current state (as plain markdown checkboxes in your own text reply,
not buried inside a tool call) right after you finish each step, so anyone
reading the conversation can tell which step is running without having to
reconstruct it from tool output. Copy this block once at the start of the
run, then re-post it with boxes updated whenever a step completes, a gate
blocks, or a step has to re-run after a fix:

```
- [ ] 0. Branch created (feature/<slug>)
- [ ] 1. Spec excerpt found + mockup built (spec-driven-mockup)
- [ ] Gate 1 — mockup approved by human
- [ ] 3. Backend implemented
- [ ] 4. Domain-expert review done (no business-rule findings open)
- [ ] 5. Dev server running, handed off for manual testing
- [ ] Gate 2 — merge approved by human
```

Rules for keeping it honest:
- Check a box only when that step has actually finished (gate explicitly
  approved, etc.) — not when you've started it or intend to do it next.
- If step 4 produces a business-rule finding, uncheck step 3 (if already
  checked) until the fix is in — don't leave a stale check from before the
  fix.
- If a gate comes back as anything other than explicit approval, leave its
  box unchecked and say so plainly in the same message (e.g. "Gate 1 not yet
  approved — waiting on feedback") rather than omitting the checklist for
  that turn.
- This checklist is a communication aid, not a substitute for the hard-gate
  behavior defined in Gate 1 / Gate 2 below — an unchecked gate box still
  means stop and wait, regardless of how far the rest of the list has
  progressed.

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

#### UI rule: design for large volumes from the first mockup

Any screen that shows a **collection** (orders, boxes, products, customers,
payments, history...) must still be usable with hundreds of rows. Mockups
with 2 demo rows hide this problem; the human then discovers it on review
and the screen has to be rebuilt (this happened on UC-07/08/09: orders were
stacked vertically with the box list at the bottom of the page, and the human
rejected it with "do I have to scroll and hunt by eye?"). So, in the mockup
itself, not after the rejection:

- **List + detail, not a stack.** Show a compact list (one line per record)
  on one side and the selected record's detail on the other. Never render
  every record's full detail one after another down the page.
- **Search + filter + pagination** on every list. Filter chips carry counts
  (e.g. "Chờ kiểm đếm 12"). Order the list so what the user can act on right
  now comes first (actionable stage first, overdue first).
- **Do the searching/filtering/paging on the server** (query params on the
  API, `skip`/`take`), and load the list as lightweight summaries; fetch the
  full detail only for the selected record. Do not fetch everything and
  filter in the browser.
- **Separate concerns into tabs/pages.** A second kind of record (e.g. game
  boxes next to rental orders) gets its own tab with its own search/filter —
  not a section appended at the bottom of another list. Put a count badge on
  the tab when something needs attention.
- **Seed enough demo data to see the problem** (dozens of records, not 2)
  when the screen is a list, so the human reviews the layout under load. If
  seeding that much is out of scope, say so explicitly in the Gate 1 message
  instead of letting a 2-row screen look finished.
- **No layout shift on interaction.** Controls that appear on selection
  (a quantity input after clicking "Thiếu") must reserve their space up
  front; error/result text must not push the button the user just pressed.
  Use fixed-width columns + `whitespace-nowrap` for buttons and amounts.

State in the Gate 1 message how the screen behaves with many records (what is
paginated, what is searchable) so the human can reject it on that basis.

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

### Step 3 — Backend implementation

Implement the backend for this feature directly, scoped to the SRS excerpt
captured in step 1. **Fast-track mode: skip `superpowers:test-driven-development`
and do not write a unit-test suite** — write the code to satisfy the excerpt's
FR/BR rules, and rely on step 4's review plus the human's own manual testing
(step 5) to catch problems. If something is genuinely risky or easy to get
subtly wrong (e.g. a money/deposit calculation), a quick ad-hoc sanity check
is fine, but don't build out a formal suite for it.

### Step 4 — Domain-expert review

**REQUIRED SUB-SKILL:** Use `domain-expert-code-review`.

Give it exactly what it requires: the step-1 SRS excerpt verbatim, and the
step-3 diff (or the changed files' current contents). It dispatches its own
fresh subagent and reports back via `ReportFindings` — you don't need to
build that dispatch yourself beyond supplying these two inputs.

- If it returns a finding at business-rule severity (code doesn't implement,
  or silently skips, a rule the excerpt states): fix the code before
  continuing.
- If it returns only style-level findings: those may be deferred; proceed to
  step 5.

### Step 5 — Manual test handoff

**REQUIRED SUB-SKILL:** Use `run` to (re)start the dev server if it isn't
still running from step 1 (backend work in step 3 may have required a
restart). Once it's up, tell the human concretely what to click through to
exercise the feature (which screens, which UC flow, what edge cases from the
excerpt are worth checking) and wait for them to report back pass/fail.
**Fast-track mode: no automated acceptance-test suite, no Playwright
screenshots** — the human's own manual pass through the running app is what
decides whether the feature works. If they report something broken, fix it
and hand back for another manual pass before moving to step 6.

### Step 6 — Gate 2: merge approval (hard gate)

1. Commit all work on the feature branch.
2. Ask the human explicitly — via `AskUserQuestion` or the equivalent
   interactive-question tool in your environment — whether the complete
   feature (mockup + backend + review + their own manual test pass) is
   approved to merge into `main`.
3. **This is a hard gate, the same severity as Gate 1 in step 1 — human
   manual testing decides correctness, but merging still requires explicit
   sign-off.** Only on unambiguous, explicit approval do you merge the branch
   into `main`. Any other response — silence, a vague reaction, feedback, a
   question, "looks good" without a clear go-ahead — means: stay on the
   branch, treat it as feedback or as not yet answered, iterate, and ask
   again. Never auto-merge. There is no version of "effectively approved"
   that counts as approved, exactly as `ui-mockup-approval-gate` defines it
   for Gate 1 — the same standard applies here.

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
- Skipping step 5's manual handoff — i.e. declaring the feature "done" based
  only on the backend implementation and domain review, without the human
  actually having clicked through the running app. The human's manual pass
  is the completion signal in fast-track mode, not optional.
- Reintroducing a TDD unit-test suite or an automated acceptance-test /
  Playwright-screenshot pass "just to be safe" — fast-track mode drops these
  on purpose; don't quietly add them back.
- Building a list screen that only works with a handful of records: vertical
  stacks of full-detail cards, a secondary list parked at the bottom of the
  page, no search/filter/pagination, client-side filtering of everything. See
  "UI rule: design for large volumes" in Step 1 — design for volume in the
  mockup, not after the human rejects it.
- Letting an interaction shift the layout (an input appearing and pushing
  buttons sideways, wrapped button labels, error text taking the button's
  place). Reserve space up front.
- Testing the manual-test handoff against rows that no longer exist: when
  giving the human a test order/account list, re-check the data right before
  handing it over (earlier API smoke tests may have already consumed demo
  orders), and make the demo seed re-runnable.
- Letting the Progress Checklist go stale: checking a box before the step
  actually finished, or forgetting to re-post it after a step 4 fix forces
  step 3 to re-run — the checklist should always reflect current reality,
  not intent.
