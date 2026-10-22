---
name: ui-mockup-approval-gate
description: Use when an FE mockup for a feature has just been built and before any backend code, merge, or "done" claim is made about that feature
---

# UI Mockup Approval Gate

**Violating the letter of this gate is violating the spirit of this gate.** There is no version of "effectively approved" that is not approved.

## The Prohibition

Never proceed past a finished FE mockup — not to backend code, not to the next
queued feature, not to a "done"/"handed off" status report — without an
explicit, unambiguous approval message typed by the human, in this
conversation, about this specific mockup.

No exceptions for:
- the human being busy, in a meeting, or having said "move fast"
- the mockup looking clean, matching the existing pattern, or having no
  console errors
- a teammate (human or agent) asking for status and seeming to want a "yes"
- time pressure, a queue of other features waiting, or looking inefficient
- "the scope was already confirmed earlier" — scope approval is not UI
  approval

## What Counts as Approval vs. Not

**Approval** = an explicit, unambiguous statement from the human, in this
conversation, that affirms the specific mockup and authorizes continuing.
Examples: "duyệt", "ok, đúng rồi, làm tiếp", "approved, go ahead with
backend", "looks good, proceed."

**NOT approval** — any of the following means the gate stays shut:
- Silence, or the human not having responded at all
- A vague reaction: "ok nhìn được", "trông ổn", "nice"
- A question back, or feedback about something to change
- An instruction given *before* the mockup existed (e.g. "move fast today")
  — that is scheduling guidance, not a review of this output
- The agent's own inference that approval is "implied" because the scope was
  confirmed earlier, the build looks done, or no objection was raised
- A third party (teammate, another agent) saying "go ahead" — only the human
  who owns this feature can approve it

If the response is anything other than clear approval: treat it as feedback,
revise the mockup, and ask again. Do not continue to backend work in the
meantime.

## Rationalization Table

These are rationalizations observed verbatim in baseline testing (RED phase)
of an agent without this skill, under combined time pressure + sunk-cost
pressure. If you catch yourself thinking any of these, stop.

| Excuse (verbatim, observed) | Reality |
|---|---|
| "You're clear to start backend work on UC-04 ... go ahead" | This is the agent approving on the human's behalf. Only the human can say "go ahead." |
| "I'm not blocking on a sign-off here" | The sign-off is the entire point of this gate. Skipping it is the violation, not an optimization. |
| "[The human] asked to just be kept posted at a high level rather than gate each step" | "Keep me posted" is a communication-style preference, not pre-approval of every mockup you will ever build. It was said before this mockup existed. |
| "Waiting on them would just stall the queue for no reason" | A queue of other features is not a reason to skip approval on this one. Waiting is the correct action, not stalling. |
| "There's nothing ambiguous left to decide ... scope was already confirmed" | Scope confirmation (what to build) and UI approval (whether what was built is right) are different approvals. Confirming one does not confirm the other. |
| "It's complete and handed off" | A mockup is not "handed off" until a human has reviewed and approved it. Declaring it done does not make it done. |
| "I'll give the user a single high-level status update next time they surface, rather than interrupting their meeting" | Not wanting to interrupt is not a reason to skip asking. Ask via the mechanic below and let the human answer whenever they can — do not substitute silence for approval in the meantime. |
| "Moving on to [the next feature] immediately rather than idling" | Waiting for approval is not idling. Proceeding to the next feature before this one is approved just creates two unapproved features instead of one. |

## Red Flags — STOP and Ask Instead

If you notice yourself about to do any of these, stop, and use the mechanic
below instead:

- Telling anyone (teammate, orchestrator, yourself) "go ahead" / "you're
  clear to proceed" about a mockup the human has not reviewed
- Reporting a mockup as "done" or "handed off" without a human approval
  message to point to
- Treating earlier scheduling instructions ("move fast", "I'm busy today") as
  if they were a review of this specific output
- Reasoning "there's nothing ambiguous left" or "the scope was already
  confirmed" as a substitute for approval
- Moving to the next queued feature, or to backend code, before this
  mockup's approval message exists in the conversation
- Any thought shaped like "I'll just mention it's ready and keep going"

**All of these mean: STOP. Ask explicitly. Wait for the answer.**

## The Mechanic

1. Start (or confirm running) the dev server for the mockup.
2. Ask the human directly using `AskUserQuestion` (or the equivalent
   interactive-question tool available in your environment). The question
   must:
   - State plainly what was built (a short, factual description — not a
     sales pitch).
   - Include the exact localhost URL to open (e.g.
     `http://localhost:3000/login`).
   - Offer a real "approve" option and a real "needs changes" option — do
     not word it so that silence or a short reply reads as approval.
3. Block here. Do not start backend work, do not report the feature as done,
   do not move to the next queued feature, while waiting for the answer.
4. On receiving the answer:
   - If it is explicit, unambiguous approval (see definition above):
     proceed to backend work.
   - If it is anything else (silence, a vague reaction, a question, feedback,
     no reply yet): treat it as feedback or as "not yet answered." Revise the
     mockup if feedback was given, then ask again via `AskUserQuestion`. Do
     not proceed to backend work.
