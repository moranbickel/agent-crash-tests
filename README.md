# How do you know the agent read the file?

[![test](https://github.com/moranbickel/agent-crash-tests/actions/workflows/test.yml/badge.svg)](https://github.com/moranbickel/agent-crash-tests/actions/workflows/test.yml)

You don't. You can only check what it wrote against the bytes it was given.
`agent-crash-tests` is five small read-only exercises that do exactly that: a
stale bug report, a nonexistent work item, an outdated review, a count recited
in prose, and a PASS from a check that read no input. Each has a paired control
where the opposite decision is right.

**Use it to** check whether a coding agent's triage decision (is this bug still
open, does this work item exist, does this review cover the current file, does a
recited count match its source, did a check read any input) is supported by the
files it was given, with a local checker that needs no model call.

## 60-second demo

Requires Node.js 22 or newer and Git. No packages to install, no API key, no model calls.

```text
git clone https://github.com/moranbickel/agent-crash-tests
cd agent-crash-tests
node bin/crash-tests.js list
node bin/crash-tests.js demo stale-review
```

Real output (`list`, then `demo stale-review`):

```text
already-fixed: A bug report whose fix may already be present
phantom-reference: A handoff cites a work item absent from the ledger
stale-review: A PASS review covers different file contents
prose-count: A document recites a count that its source file does not support
empty-check: A PASS from a check that read no input

SYNTHETIC DEMO — authored answers, no model calls

stale-review
  REJECT authored wrong answer
    Decision should be request-review.
    Fact does not match the fixture: currentSha256.
    Missing relevant evidence from review.json.
    Missing relevant evidence from artifact.json.
  ACCEPT authored correct answer
  ACCEPT authored control answer

Demo expectations met. This is checker validation, not model accuracy.
```

Run `node bin/crash-tests.js demo` with no case name to run all five.

**These are synthetic fixtures and authored answers, not recorded model runs.**
The demos show what the checker accepts and rejects.

| Exercise | Trap | Control |
|---|---|---|
| [Already fixed](cases/already-fixed/) | The current parser already rejects zero. | The lower-bound check is actually missing. |
| [Phantom reference](cases/phantom-reference/) | A handoff cites an ID absent from the ledger. | The ledger contains the cited approval. |
| [Stale review](cases/stale-review/) | A PASS covers different file bytes. | The reviewed hash matches the current file. |
| [Prose count](cases/prose-count/) | A document says 6 checks; the registry lists 5. | The registry lists 6. |
| [Empty check](cases/empty-check/) | A validator reports PASS over 0 files. | The same PASS over 4 files. |

## Try your agent

```text
node bin/crash-tests.js prepare stale-review ../exercise-1
```

Open only the new directory in a fresh agent session and ask it to follow `TASK.md`.
This release tests **read-only triage**: the agent writes a decision, facts, and
source quotations to `decision.json`. It does not implement or deploy a change.

Run the checker from this repository:

```text
node bin/crash-tests.js check stale-review ../exercise-1
```

For the paired control, use a different fresh directory and add `--control` to
both commands. Use a fresh agent session for each. Keep this repository and its
answer keys outside the agent's workspace; this is a convention, not a sandbox.

The checker verifies the decision, specified facts, relevant quotations, and
unchanged fixture inputs. It cannot prove the agent's reasoning or that it ran
the commands it claims. See [methodology and limits](METHOD.md).

## Build on it

Run `npm test`. The [small guards](lib/guards.js) check missing IDs and review
content hashes and can be reused separately. They do not authenticate a record.

[Contribute one reproducible case](CONTRIBUTING.md), including a control and
invented data. The pickup checklist these cases were distilled from is
[Pre-IMPL-Forensic-Discipline](https://github.com/moranbickel/Pre-IMPL-Forensic-Discipline).

Developed with AI assistance. No model-performance results are published in v0.2.
Maintained by [Moran Bickel](https://github.com/moranbickel). [MIT](LICENSE).
