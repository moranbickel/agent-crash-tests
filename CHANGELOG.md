# Changelog

## 0.2.0 - 2026-10-13

- Added two exercises, each with a paired control:
  - `prose-count`: a document recites a count that its source file does not support.
  - `empty-check`: a check reports PASS over input that contained nothing to check.
- A facts mismatch now names the differing fact and does not echo the submitted value.
- README: retitled as the question the checker answers and the intro rewritten; added a use-case sentence and a 60-second demo with captured output.
- Now five exercises in total.

## 0.1.0 - 2026-09-22

- Three synthetic read-only exercises, each with a paired control, authored demo responses, and a checker for the decision, facts, quotations, and fixture integrity:
  - `already-fixed`: a bug report whose fix is already present.
  - `phantom-reference`: a handoff cites a work item absent from the ledger.
  - `stale-review`: a PASS review covers different file contents.
- Requires Node.js 22 or newer; no dependencies or API key.
- No measured model-performance results. All case data is invented.
