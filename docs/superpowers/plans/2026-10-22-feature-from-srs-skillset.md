# Feature-From-SRS Skillset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, generic 4-skill set (`feature-from-srs` orchestrator +
3 sub-skills) that lets an agent take one feature described in an existing SRS
document, build an FE mockup from existing component patterns, gate on human
UI approval, build the backend with TDD, get an independent domain-expert
code review, generate+run acceptance tests, and hand off Playwright
screenshots — all on a dedicated git branch gated by a second human approval
before merge.

**Architecture:** One thin orchestrator skill (`feature-from-srs`) sequences
the 7-step flow and calls out to 3 purpose-built sub-skills
(`spec-driven-mockup`, `ui-mockup-approval-gate`, `domain-expert-code-review`)
plus two already-existing skills it does not duplicate
(`superpowers:test-driven-development` for backend code+tests, `run` for dev
server + Playwright screenshots). `spec-driven-mockup` ships one real piece of
code — `scripts/extract_spec.py` — a dependency-light CLI that extracts the
section of an SRS (.docx/.md/.pdf) matching a keyword or UC-id. The two other
sub-skills are pure documentation (no code), one of which
(`ui-mockup-approval-gate`) is a discipline skill and must be built via the
RED-GREEN-REFACTOR pressure-test cycle, not written straight to disk.

**Tech Stack:** Python 3.11 stdlib + `python-docx` (already installed) for
.docx parsing, `pypdf` (optional, lazy-imported) for .pdf parsing, `unittest`
(stdlib, no pytest dependency since pytest is not installed in this
environment) for `extract_spec.py`'s tests. Skills are plain Markdown
(SKILL.md) per the Agent Skills spec.

**Spec:** `D:\Brd\docs\superpowers\specs\2026-10-22-feature-from-srs-skillset-design.md`

## Global Constraints

- Skills live under `D:\Brd\.claude\skills\` (project-scoped), not
  `~/.claude/skills/`.
- Must be generic/reusable across projects — no hardcoded BoardVerse file
  names, stack choices (Next.js/Prisma), or domain data. BoardVerse is only
  the first real-world test case.
- `extract_spec.py` must not auto-`pip install` missing dependencies (e.g.
  `pypdf`) — on missing dependency it raises a clear, actionable error.
- No real calls to third-party partner APIs (MoMo/Green SM or any other) —
  this skillset never performs network calls to external payment/shipping
  providers.
- No auto-deploy, no auto-creation of remote Git repos/PRs without being
  asked.
- `ui-mockup-approval-gate` and the "Gate 2" merge-approval step in
  `feature-from-srs` are both hard gates: never proceed past them without an
  unambiguous, explicit human answer. This includes never auto-merging a
  feature branch into `main`.
- `domain-expert-code-review` must dispatch a **fresh** subagent (not a fork)
  so the review is not contaminated by the implementation session's own
  reasoning, and that subagent must report via the `ReportFindings` tool
  (built into the environment already — not something to install or define).
- Each feature works on its own git branch (created at the start of the
  7-step flow) and is only merged into `main` after Gate 2 is explicitly
  approved.

## Review Focus

- A query to `extract_spec.py` that matches nothing in the document — the
  tool must say "no match found," not crash or silently return an empty
  success.
- An SRS `.docx` with plain paragraphs and no heading styles at all — the
  extractor must degrade gracefully (e.g., whole-document keyword context)
  instead of throwing because no "Heading" style was found.
- A human reply to the Gate 1 / Gate 2 question that is ambiguous ("ok nhìn
  được", "chắc ổn", silence/timeout) rather than an explicit yes/no — the gate
  skill must treat anything short of unambiguous approval as "not approved,"
  never optimistically parse it as a yes.
- An agent under time/sunk-cost pressure ("almost done", "looks fine to me")
  tempted to skip asking and self-approve the mockup or the merge — this is
  exactly what `ui-mockup-approval-gate`'s pressure-tested rationalization
  table must name and block.
- The domain-expert-review prompt omitting the actual SRS excerpt (only
  passing the code diff) — this would produce a generic code-quality review
  instead of a spec-conformance review, defeating the point of the step; the
  dispatch prompt template must always embed the extracted spec text.

---

## File Structure

```
D:\Brd\.claude\skills\
  feature-from-srs\
    SKILL.md
  spec-driven-mockup\
    SKILL.md
    scripts\
      extract_spec.py
      tests\
        test_extract_spec.py
  ui-mockup-approval-gate\
    SKILL.md
  domain-expert-code-review\
    SKILL.md
```

---

### Task 1: `extract_spec.py` — SRS section extractor

**Files:**
- Create: `D:\Brd\.claude\skills\spec-driven-mockup\scripts\extract_spec.py`
- Create: `D:\Brd\.claude\skills\spec-driven-mockup\scripts\tests\test_extract_spec.py`

**Interfaces:**
- Produces (used by `spec-driven-mockup/SKILL.md` and, indirectly, by
  `feature-from-srs/SKILL.md`):
  - CLI: `python extract_spec.py <file_path> <query> [--max-results N]`
    (default `--max-results 3`), prints each matched section as
    `=== {heading} ({location}) ===` followed by the matched text, blank
    line between sections. Exits non-zero with a one-line message on
    "no match" or on missing-dependency errors.
  - Importable API: `extract(path: pathlib.Path, query: str) -> list[Section]`
  - `Section` — `dataclasses.dataclass` with fields `heading: str`,
    `text: str`, `location: str`
  - `MissingDependencyError(RuntimeError)` — raised with a message telling
    the caller exactly what to `pip install`
  - `NoMatchError(RuntimeError)` — raised by `extract()` (not by `main()`,
    which catches it and prints "No matching section found for query: ...")
    when zero sections match

- [ ] **Step 1: Write failing tests for `.md` extraction**

```python
# D:\Brd\.claude\skills\spec-driven-mockup\scripts\tests\test_extract_spec.py
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import extract_spec


class TestExtractFromMarkdown(unittest.TestCase):
    def setUp(self):
        self.md_path = Path(self.enterContext(
            __import__("tempfile").TemporaryDirectory()
        )) / "srs.md"
        self.md_path.write_text(
            "# 1. Giới thiệu\n"
            "Nội dung giới thiệu chung.\n\n"
            "# 2. UC-04 Đăng nhập\n"
            "Khách hàng nhập email và mật khẩu để đăng nhập hệ thống.\n\n"
            "# 3. UC-07 Đặt cọc\n"
            "Khách hàng đặt cọc trước khi nhận hàng.\n",
            encoding="utf-8",
        )

    def test_finds_section_by_uc_id(self):
        sections = extract_spec.extract(self.md_path, "UC-04")
        self.assertEqual(len(sections), 1)
        self.assertIn("Đăng nhập", sections[0].heading)
        self.assertIn("mật khẩu", sections[0].text)

    def test_finds_section_by_keyword_in_body(self):
        sections = extract_spec.extract(self.md_path, "đặt cọc")
        self.assertEqual(len(sections), 1)
        self.assertIn("UC-07", sections[0].heading)

    def test_no_match_raises_nomatcherror(self):
        with self.assertRaises(extract_spec.NoMatchError):
            extract_spec.extract(self.md_path, "khong-ton-tai-xyz")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest D:\Brd\.claude\skills\spec-driven-mockup\scripts\tests\test_extract_spec.py -v`
Expected: FAIL/ERROR — `ModuleNotFoundError: No module named 'extract_spec'` (file does not exist yet)

- [ ] **Step 3: Implement the `.md` path**

Implement in `extract_spec.py`:
- `@dataclasses.dataclass class Section: heading: str; text: str; location: str`
- `class MissingDependencyError(RuntimeError): pass`
- `class NoMatchError(RuntimeError): pass`
- `def extract_from_md(path: Path, query: str) -> list[Section]:` — read the
  file as UTF-8 text, split into blocks on lines starting with `#`, each
  block's first line (stripped of leading `#`/whitespace) is the heading and
  `location` equals that same heading text (no separate page concept for
  markdown). A block matches when `query.lower()` is a substring of either
  the heading or the body text (case-insensitive). Return all matching
  blocks in document order. Raise `NoMatchError(query)` if the result list is
  empty.
- `def extract(path: Path, query: str) -> list[Section]:` dispatch by
  `path.suffix.lower()`: `.md` → `extract_from_md`; leave `.docx`/`.pdf`
  branches as calls to `extract_from_docx`/`extract_from_pdf` (defined in
  Steps 6 and 9); anything else raises
  `ValueError(f"Unsupported file type: {path.suffix}")`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest D:\Brd\.claude\skills\spec-driven-mockup\scripts\tests\test_extract_spec.py -v`
Expected: the 3 markdown tests PASS (docx/pdf tests don't exist yet)

- [ ] **Step 5: Write failing tests for `.docx` extraction**

```python
class TestExtractFromDocx(unittest.TestCase):
    def setUp(self):
        import docx
        tmp = Path(self.enterContext(__import__("tempfile").TemporaryDirectory()))
        self.docx_path = tmp / "srs.docx"
        doc = docx.Document()
        doc.add_heading("1. Giới thiệu", level=1)
        doc.add_paragraph("Nội dung giới thiệu chung.")
        doc.add_heading("3.4.4 UC-04 Đăng nhập", level=2)
        doc.add_paragraph("Khách hàng nhập email và mật khẩu để đăng nhập.")
        doc.save(str(self.docx_path))

    def test_finds_section_by_uc_id(self):
        sections = extract_spec.extract(self.docx_path, "UC-04")
        self.assertEqual(len(sections), 1)
        self.assertIn("Đăng nhập", sections[0].heading)
        self.assertIn("mật khẩu", sections[0].text)

    def test_docx_with_no_headings_falls_back_to_whole_document(self):
        import docx
        tmp = Path(self.enterContext(__import__("tempfile").TemporaryDirectory()))
        flat_path = tmp / "flat.docx"
        doc = docx.Document()
        doc.add_paragraph("Văn bản không có heading nào, chỉ có UC-09 nhắc tới ở đây.")
        doc.save(str(flat_path))
        sections = extract_spec.extract(flat_path, "UC-09")
        self.assertEqual(len(sections), 1)
        self.assertEqual(sections[0].heading, "(toàn văn)")
```

- [ ] **Step 6: Run test to verify it fails**

Run: `python -m unittest ...test_extract_spec.py -v`
Expected: FAIL — `AttributeError`/`NameError` on `extract_from_docx` (not implemented)

- [ ] **Step 7: Implement `extract_from_docx`**

`def extract_from_docx(path: Path, query: str) -> list[Section]:` — open with
`python-docx`'s `Document(path)`. Walk `doc.paragraphs`; track `current_heading`
whenever `paragraph.style.name` starts with `"Heading"` or equals `"Title"`
(update `current_heading = paragraph.text`), otherwise accumulate the
paragraph's text under the current heading. Group into blocks exactly like
the markdown case (one block per heading, `location = heading text`). If no
heading was ever encountered, treat the whole document as a single block with
`heading = "(toàn văn)"` and `location = "(toàn văn)"`. Apply the same
case-insensitive substring match as `extract_from_md`, raising `NoMatchError`
on zero matches.

- [ ] **Step 8: Run test to verify it passes**

Run: `python -m unittest ...test_extract_spec.py -v`
Expected: PASS for all `.md` and `.docx` tests

- [ ] **Step 9: Write failing tests for `.pdf` extraction and the missing-dependency path**

```python
class TestExtractFromPdf(unittest.TestCase):
    def test_raises_missing_dependency_when_pypdf_absent(self):
        with mock.patch.dict(sys.modules, {"pypdf": None}):
            with self.assertRaises(extract_spec.MissingDependencyError) as ctx:
                extract_spec.extract_from_pdf(Path("dummy.pdf"), "query")
        self.assertIn("pip install pypdf", str(ctx.exception))


class TestExtractDispatchAndCli(unittest.TestCase):
    def test_unsupported_extension_raises_valueerror(self):
        with self.assertRaises(ValueError):
            extract_spec.extract(Path("file.txt"), "query")

    def test_main_prints_no_match_message_and_exits_nonzero(self):
        tmp = Path(self.enterContext(__import__("tempfile").TemporaryDirectory()))
        md_path = tmp / "srs.md"
        md_path.write_text("# Mục 1\nNội dung A.\n", encoding="utf-8")
        with self.assertRaises(SystemExit) as ctx:
            extract_spec.main([str(md_path), "khong-ton-tai"])
        self.assertNotEqual(ctx.exception.code, 0)
```

- [ ] **Step 10: Run test to verify it fails**

Run: `python -m unittest ...test_extract_spec.py -v`
Expected: FAIL — `extract_from_pdf`/`main` not implemented yet

- [ ] **Step 11: Implement `extract_from_pdf` and `main`**

`def extract_from_pdf(path: Path, query: str) -> list[Section]:` — inside the
function body, `try: import pypdf` except `ImportError: raise
extract_spec.MissingDependencyError("Thiếu thư viện pypdf — chạy: pip install
pypdf")`. On success, read pages with `pypdf.PdfReader(path)`, treat each page
as one block (`heading = f"Trang {page_number}"`, `location` = same), apply
the same substring match as the other two extractors, raise `NoMatchError` on
zero matches.

`def main(argv: list[str] | None = None) -> None:` — `argparse` with
positional `file`, positional `query`, optional `--max-results` (default 3).
Call `extract(Path(args.file), args.query)`, catching `NoMatchError` → print
`f"No matching section found for query: {args.query}"` to stderr and
`sys.exit(1)`; catching `MissingDependencyError` → print its message to
stderr and `sys.exit(1)`. On success, print up to `--max-results` sections in
the `=== {heading} ({location}) ===` format described in Interfaces. Add
`if __name__ == "__main__": main()`.

- [ ] **Step 12: Run full test suite to verify it passes**

Run: `python -m unittest D:\Brd\.claude\skills\spec-driven-mockup\scripts\tests\test_extract_spec.py -v`
Expected: ALL tests PASS

- [ ] **Step 13: Commit**

```bash
git add "D:\Brd\.claude\skills\spec-driven-mockup\scripts\extract_spec.py" \
        "D:\Brd\.claude\skills\spec-driven-mockup\scripts\tests\test_extract_spec.py"
git commit -m "feat: add extract_spec.py SRS section extractor for spec-driven-mockup skill"
```

---

### Task 2: `ui-mockup-approval-gate` — discipline skill (hard gate)

**Files:**
- Create: `D:\Brd\.claude\skills\ui-mockup-approval-gate\SKILL.md`

**Interfaces:**
- Consumes: nothing (standalone discipline skill, invoked by
  `feature-from-srs` after the FE mockup is built)
- Produces: a documented behavioral contract that `feature-from-srs/SKILL.md`
  (Task 5) references as `**REQUIRED SUB-SKILL:** Use
  ui-mockup-approval-gate` right after the mockup-build step, and again
  (conceptually, as "Gate 2") at the end — note Task 5's Gate 2 is
  orchestrator-owned, not this skill, since Gate 2 approves the whole feature
  for merge, not just the UI.

This is a discipline skill (per "Match the Form to the Failure": pressure
scenario first, counters written only for rationalizations actually observed
— no invented content).

- [ ] **Step 1: Write the baseline pressure scenario prompt**

Draft a scenario where a fresh subagent has just finished building an FE
mockup for a fictional feature, is told "the user is in a meeting, respond
quickly", has a plausible-looking mockup, and is asked "what's the status of
this task?" — with no `ui-mockup-approval-gate` skill available. The scenario
must combine at least 2 pressures (time pressure + sunk-cost/"it's already
built and looks fine").

- [ ] **Step 2: Run baseline (RED) — dispatch a fresh subagent with the scenario and no skill**

Use the `Agent` tool with a fresh (non-fork) `general-purpose` subagent.
Record verbatim: did it claim done/approved on its own, did it invent user
approval, what exact words it used to justify moving on.

- [ ] **Step 3: Document the baseline failure**

Write down the literal rationalizations observed in Step 2 (e.g., "the user
is busy so I'll assume it's fine," "it looks reasonable, proceeding to
backend"). These become the rows of the rationalization table — do not invent
rows not observed.

- [ ] **Step 4: Write the skill (GREEN) addressing only the observed rationalizations**

Frontmatter:
```yaml
---
name: ui-mockup-approval-gate
description: Use when an FE mockup for a feature has just been built and before any backend code, merge, or "done" claim is made about that feature
---
```
Body must include, per the discipline-skill form (no soft guidance, no
nuance clauses):
- A one-line prohibition: never proceed past this point without an explicit,
  unambiguous approval message from the human, typed by them, in this
  conversation.
- What counts as approval vs. not (explicit "duyệt"/"ok, đúng rồi, làm tiếp"
  type statement = approval; silence, a vague reaction, a question back, "ok
  nhìn được" = NOT approval — ask again or treat as feedback to address).
- The rationalization table built from Step 3's verbatim observations.
- A red-flags list ("I'll just mention it's ready and keep going", "the user
  seems busy", "it looks done to me") mapped to "STOP — this means ask
  explicitly and wait.".
- The concrete mechanic: ask via `AskUserQuestion` (or equivalent) with the
  mockup's localhost URL and a plain description of what was built; on
  anything other than clear approval, loop back to revise the mockup and ask
  again — do not continue to backend work.

- [ ] **Step 5: Run the same scenario WITH the skill present (GREEN verification)**

Dispatch a fresh subagent with identical scenario pressures, this time with
`ui-mockup-approval-gate` available/invoked. Confirm it stops and asks
explicitly instead of self-approving.

- [ ] **Step 6: Refactor — look for new rationalizations**

If Step 5's subagent found a new way to route around the gate (a loophole not
covered by Step 4's table), add a counter for that specific loophole only,
and re-run Step 5 until two consecutive clean passes.

- [ ] **Step 7: Commit**

```bash
git add "D:\Brd\.claude\skills\ui-mockup-approval-gate\SKILL.md"
git commit -m "feat: add ui-mockup-approval-gate discipline skill (pressure-tested)"
```

---

### Task 3: `spec-driven-mockup` — technique skill

**Files:**
- Create: `D:\Brd\.claude\skills\spec-driven-mockup\SKILL.md`
- Uses: `scripts/extract_spec.py` from Task 1 (already in place)

**Interfaces:**
- Consumes: `extract_spec.py`'s CLI (`python extract_spec.py <file> <query>`)
  from Task 1.
- Produces: a documented procedure that `feature-from-srs/SKILL.md` (Task 5)
  references as `**REQUIRED SUB-SKILL:** Use spec-driven-mockup` for steps
  1-2 of the 7-step flow, and that hands off into
  `ui-mockup-approval-gate` (Task 2) once the mockup is ready.

- [ ] **Step 1: Write the application-scenario test (baseline, no skill)**

Scenario: fresh subagent is told "implement the login feature described in
`<SRS file>` in this repo; there's an existing `landing/index.html` and
maybe other pages already built — match their look." No skill available.
Observe: does it find the right SRS section unaided (likely inefficiently —
reads whole huge .docx), does it look at existing pages for patterns, does it
check whether an app even exists yet before writing code.

- [ ] **Step 2: Run baseline scenario, document gaps**

Record concretely where the unaided agent wastes effort or skips a step
(e.g., never checks for `package.json`, never looks at `landing/index.html`
before styling, dumps raw file content into context instead of using a
targeted extraction approach).

- [ ] **Step 3: Write the skill addressing the observed gaps**

Frontmatter:
```yaml
---
name: spec-driven-mockup
description: Use when building a frontend mockup for a feature that an existing SRS/spec document already describes
---
```
Body must cover, in this order:
1. **Find the spec section**: run
   `python <skill_dir>/scripts/extract_spec.py <srs_file> <keyword_or_UC_id>`
   to get the relevant excerpt instead of reading the whole document; if the
   file type isn't .docx/.md/.pdf, fall back to reading the file directly.
2. **Detect whether an app already exists**: look for a package manifest
   (`package.json` or stack equivalent) in the expected app root; if absent,
   bootstrap a minimal app skeleton first (ask the human one question about
   stack choice only if it cannot be inferred from existing docs/README in
   the repo — e.g. BoardVerse's own `HUONG_DAN_VIBE_CODE_*.md` already
   states a stack), then continue.
3. **Reuse existing component patterns**: before writing new markup/CSS,
   read the existing landing page / already-built pages in the repo and
   match their visual language (fonts, color tokens, component structure)
   instead of inventing a new one.
4. **Start the dev server**: use the `run` skill to launch it; keep track of
   how it was started so later steps (Task 5's orchestrator) can reuse or
   restart the same server instead of starting a redundant one.
5. **Hand off to the gate**: once the mockup renders, invoke
   `ui-mockup-approval-gate` — do not describe the mockup as "done" or
   proceed to backend work without it.

- [ ] **Step 4: Run the application scenario again WITH the skill**

Confirm the subagent now: calls `extract_spec.py` instead of reading the
whole doc, checks for an existing app before coding, visibly references the
existing landing page's patterns, and explicitly hands off to
`ui-mockup-approval-gate` rather than declaring completion itself.

- [ ] **Step 5: Commit**

```bash
git add "D:\Brd\.claude\skills\spec-driven-mockup\SKILL.md"
git commit -m "feat: add spec-driven-mockup technique skill"
```

---

### Task 4: `domain-expert-code-review` — technique skill

**Files:**
- Create: `D:\Brd\.claude\skills\domain-expert-code-review\SKILL.md`

**Interfaces:**
- Consumes: the SRS excerpt text produced by `extract_spec.py` (Task 1,
  passed through by whatever step calls this skill) and a code diff/path set
  for the just-implemented backend feature.
- Produces: a documented procedure that `feature-from-srs/SKILL.md` (Task 5)
  references as `**REQUIRED SUB-SKILL:** Use domain-expert-code-review` right
  after the backend TDD step and before the acceptance-test step.

- [ ] **Step 1: Write the application-scenario test (baseline, no skill)**

Scenario: fresh subagent is handed a code diff implementing a feature and
told "review this." No skill, and critically, the prompt in the scenario
omits the SRS excerpt on purpose at first to see whether an unguided agent
asks for it or just reviews code style. Also test the omission failure mode
directly named in Review Focus: a prompt that forgets to embed the spec
excerpt.

- [ ] **Step 2: Run baseline, document gaps**

Record whether the review comes back generic ("add error handling", "rename
this") versus spec-conformance focused ("SRS says UC-04 requires locking the
account after 5 failed attempts; this code has no such check").

- [ ] **Step 3: Write the skill**

Frontmatter:
```yaml
---
name: domain-expert-code-review
description: Use after backend code for a spec-described feature is implemented and before acceptance tests are written, to verify the code matches the spec's business rules
---
```
Body must specify:
1. **Always dispatch a fresh subagent** (not a fork — an independent read,
   per the design doc's rationale) via the `Agent` tool, type
   `general-purpose` or `code-review`.
2. **The dispatch prompt is a contract, not a suggestion** — it MUST embed,
   verbatim, inline in the prompt text (not just "see the SRS file"): (a) the
   SRS excerpt text already extracted via `extract_spec.py` for this
   feature, (b) the file paths or diff of the code just written, (c) an
   explicit instruction to role-play a domain expert in the business
   described by the spec and check: does the code implement every FR/BR/UC
   rule stated in the excerpt, are there business cases the excerpt
   describes that the code silently skips, (d) an explicit instruction to
   report results via the `ReportFindings` tool.
3. **Triage**: any finding marked at a severity indicating a missed
   business rule (not a style nitpick) sends the flow back to fix the code
   and re-run the backend's existing test suite before moving on; purely
   stylistic findings may be deferred.

- [ ] **Step 4: Run the application scenario again WITH the skill**

Confirm the subagent dispatch prompt (as constructed by whichever agent
follows this skill) embeds the spec excerpt and that the dispatched reviewer
calls `ReportFindings` and actually flags a planted spec-conformance gap in
the test code diff (seed the scenario's diff with one deliberately missing
business rule from the excerpt, confirm it's caught).

- [ ] **Step 5: Commit**

```bash
git add "D:\Brd\.claude\skills\domain-expert-code-review\SKILL.md"
git commit -m "feat: add domain-expert-code-review technique skill"
```

---

### Task 5: `feature-from-srs` — orchestrator skill

**Files:**
- Create: `D:\Brd\.claude\skills\feature-from-srs\SKILL.md`

**Interfaces:**
- Consumes: `spec-driven-mockup` (Task 3), `ui-mockup-approval-gate` (Task
  2), `domain-expert-code-review` (Task 4), plus the pre-existing
  `superpowers:test-driven-development` and `run` skills.
- Produces: the top-level entry point a human invokes by name
  (`feature-from-srs`) to implement one feature end-to-end.

- [ ] **Step 1: Write the skill**

Frontmatter:
```yaml
---
name: feature-from-srs
description: Use when implementing a new feature in a repo that already has an SRS/spec document describing it, from mockup through backend to a human-reviewable, merge-ready branch
---
```
Body, in order, each step naming the exact sub-skill/tool to use (no inline
re-explanation of what those skills already own):

0. **Branch**: `git checkout -b feature/<slug>` from `main` before doing
   anything else, where `<slug>` is derived from the UC-id/keyword given.
1. **Find spec**: `**REQUIRED SUB-SKILL:** Use spec-driven-mockup` for
   extracting the relevant SRS section (this also covers step 2 below, since
   that skill owns both extraction and mockup-building).
2. **Build mockup**: (owned by `spec-driven-mockup`, no separate step here).
3. **Gate 1**: `**REQUIRED SUB-SKILL:** Use ui-mockup-approval-gate` — do not
   proceed to backend work without its explicit approval outcome.
4. **Backend (TDD)**: `**REQUIRED SUB-SKILL:** Use
   superpowers:test-driven-development` to implement the backend per the
   extracted spec excerpt from step 1. This produces unit-level tests scoped
   to individual functions/modules.
5. **Domain-expert review**: `**REQUIRED SUB-SKILL:** Use
   domain-expert-code-review`, passing it the step-1 excerpt and the step-4
   diff. If it returns a business-rule-severity finding, fix and re-run step
   4's test suite before continuing.
6. **Acceptance tests**: write and run integration/acceptance-level tests
   exercising the full UC/FR flow described in the step-1 excerpt (distinct
   from step 4's unit tests — e.g. drive the actual API/UI flow end-to-end,
   not individual functions). Re-run these after any step-5 fix too.
7. **Screenshots**: `**REQUIRED SUB-SKILL:** Use run` to (re)start the dev
   server if it isn't still running from step 1-3, then use Playwright to
   screenshot the completed feature's key screens for the human to review.
8. **Gate 2 (merge approval)**: commit all work on the feature branch, then
   ask the human explicitly (e.g. via `AskUserQuestion`) whether the
   complete feature is approved to merge into `main`. On anything short of
   explicit approval, stay on the branch and iterate. Only on explicit
   approval, merge the branch into `main`. Never merge without that
   explicit answer — this is a hard gate, same severity as Gate 1.

Include a short "Quick Reference" table mapping each of the 9 steps above to
the skill/tool that owns it, and a "Common Mistakes" section listing: calling
`domain-expert-code-review` without the spec excerpt in hand, proceeding past
Gate 1/2 on an ambiguous reply, and skipping the branch-creation step.

- [ ] **Step 2: Self-consistency check against Tasks 2-4**

Re-read `ui-mockup-approval-gate/SKILL.md`, `spec-driven-mockup/SKILL.md`,
and `domain-expert-code-review/SKILL.md` as written, and confirm every
`**REQUIRED SUB-SKILL:**` reference in this orchestrator uses their actual
skill names and actually-produced interfaces (e.g., confirm
`spec-driven-mockup` really does invoke `ui-mockup-approval-gate` itself per
Task 3 Step 3 point 5, so the orchestrator's step 3 isn't duplicating a call
that already happens inside step 1).

- [ ] **Step 3: End-to-end dry run on a real BoardVerse feature**

Pick one small real UC from `SRS_BoardVerse_v1.0.docx` (e.g. UC-04 đăng
nhập). Invoke `feature-from-srs` for it in this repo and walk the flow for
real up through Gate 1 (stop there for this task — full backend
implementation of a real BoardVerse feature is a separate, later piece of
work, not part of building the skillset itself). Confirm: branch was
created, `extract_spec.py` returned the right UC-04 section, the mockup
visibly reused `landing/index.html`'s patterns, and Gate 1 asked explicitly
and waited rather than self-approving.

- [ ] **Step 4: Commit**

```bash
git add "D:\Brd\.claude\skills\feature-from-srs\SKILL.md"
git commit -m "feat: add feature-from-srs orchestrator skill"
```
