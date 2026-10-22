---
name: spec-driven-mockup
description: Use when building a frontend mockup for a feature that an existing SRS/spec document already describes
---

# Spec-Driven Mockup

## Overview

Building a mockup for a spec'd feature is not "open the whole SRS and start
coding." It is four ordered moves: pull the one relevant section instead of
the whole document, confirm what app already exists before adding to it,
copy the repo's own established visual language instead of inventing a new
one, and end at a human checkpoint instead of a self-declared "done."

Skipping any of these produces the same failure mode observed in baseline
testing: a working-looking mockup that ignored the project's intended stack,
doesn't visually match anything else in the repo, was never actually run,
and was reported "done" with no human having seen it.

## When to Use

Use when asked to build (or mock up) a frontend feature, and an SRS, BRD,
SDD, or other spec document already describes that feature's requirements
in this repo.

Do not use for features with no existing spec document (there's nothing to
extract), or for backend/API work with no UI surface (no mockup to gate).

## Quick Reference

| Step | Action | Owned by |
|---|---|---|
| 1. Find the spec section | `extract_spec.py <file> <query>` — not reading the whole doc | this skill |
| 2. Detect the app | Look for `package.json` (or stack equivalent); bootstrap if absent | this skill |
| 3. Reuse visual patterns | Read existing pages/components in the repo before styling anything new | this skill |
| 4. Start the dev server | **REQUIRED SUB-SKILL:** `run` | `run` |
| 5. Hand off for approval | **REQUIRED SUB-SKILL:** `ui-mockup-approval-gate` | `ui-mockup-approval-gate` |

## Procedure

### 1. Find the spec section — don't read the whole document

Run the extractor against the spec file with a keyword or use-case ID
instead of opening the document and reading it end to end:

```
python <skill_dir>/scripts/extract_spec.py <srs_file> <keyword_or_UC_id>
```

(`<skill_dir>` is this skill's own directory, e.g.
`.claude/skills/spec-driven-mockup`.) Run `python
<skill_dir>/scripts/extract_spec.py --help` for the full flag list (e.g.
`--max-results`) rather than guessing — don't duplicate that output here,
it's one command away. Prefer the use-case ID (`UC-01`) over a loose keyword
when you have one; it's a more precise match. If the spec's text is non-English
and your terminal mangles the output, set `PYTHONIOENCODING=utf-8` before
running the command.

If the spec file isn't `.md`, `.docx`, or `.pdf` (the extractor's supported
types), fall back to reading the file directly — don't force a format the
tool doesn't support.

**Known gap:** the `.docx` extractor reads paragraph headings/body text
only — it does not see content inside Word tables. If a query returns a
diagram or an adjacent section but not the specific requirement text you
expected (common for SRS docs that put FR/NFR/use-case rows in tables),
that's this gap, not a wrong query. Open the file directly for that one
section rather than giving up on targeted extraction for the rest.

### 2. Detect whether an app already exists

Before writing any code, look for a package manifest (`package.json`, or the
stack equivalent — `requirements.txt`/`pyproject.toml`, `Cargo.toml`, etc.)
at the expected app root.

- **Manifest found:** this is an existing app. Add the new feature inside it;
  don't scaffold a second one alongside it.
- **No manifest found:** bootstrap a minimal app skeleton first, *in the
  stack the repo has already committed to* — check the repo's own docs/README
  for a stated stack before asking (e.g. a project's own build-guidance doc
  may already say "Next.js + TypeScript + Tailwind"). Only ask the human a
  stack-choice question if nothing in the repo answers it. Building a raw
  static HTML/JS page when the repo's own docs already name a framework is
  not "no app exists yet" — it's skipping the bootstrap step.

### 3. Reuse existing component patterns

Before writing new markup or CSS, read the repo's existing landing page or
already-built pages/components. Pull their actual tokens — color variables,
font stack, spacing, button/card classes — and reuse them, rather than
inventing a parallel visual language that happens to look similar. The goal
is one site, not two that resemble each other.

### 4. Start the dev server

**REQUIRED SUB-SKILL:** `run` — use it to launch the app so the mockup is
reachable at a real URL, not just files on disk. Keep track of how it was
started (command, port) so a later orchestrating step can reuse or restart
the same server instead of launching a redundant one.

### 5. Hand off — don't self-declare done

Once the mockup renders, this skill's job is to hand off, not to conclude.

**REQUIRED SUB-SKILL:** `ui-mockup-approval-gate` — invoke it once the server
is up. Do not write a "done"/"what's out of scope" summary in its place, and
do not proceed to backend work yourself; the gate skill owns what counts as
approval and what happens next.

## Common Mistakes

- Unzipping/regex-parsing the spec file by hand, or reading it paragraph by
  paragraph, instead of calling `extract_spec.py` with a targeted query.
- Confirming no `package.json` exists and concluding "so build static files,"
  without checking whether the repo's own docs already name a stack to
  bootstrap into.
- Matching the landing page's "look" from memory/vibes instead of opening its
  CSS/JS and reusing the actual class names and custom properties.
- Writing files and then writing a completion report, with no dev server
  ever started and no human asked to look at anything.
