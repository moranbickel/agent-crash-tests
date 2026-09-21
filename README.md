# How do you know the agent read the file?

[![test](https://github.com/moranbickel/agent-crash-tests/actions/workflows/test.yml/badge.svg)](https://github.com/moranbickel/agent-crash-tests/actions/workflows/test.yml)

You don't. You can only check what it wrote against the bytes it was given.
`agent-crash-tests` is five small read-only exercises that do exactly that: a
stale bug report, a nonexistent work item, an outdated review, a count recited
in prose, and a PASS from a check that read no input. Each has a paired control
where the opposite decision is right.

## Run the demos

Requires Node.js 22 or newer and Git. No packages to install, API keys, or model calls.

```text
git clone https://github.com/moranbickel/agent-crash-tests
cd agent-crash-tests
node bin/crash-tests.js demo
```

Example output:

```text
stale-review
  REJECT authored wrong answer
    Decision should be request-review.
    Reported facts do not match the fixture.
    Missing relevant evidence from review.json.
    Missing relevant evidence from artifact.json.
  ACCEPT authored correct answer
  ACCEPT authored control answer
```

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

Developed with AI assistance. No model-performance results are published in v0.1.
Maintained by [Moran Bickel](https://github.com/moranbickel). [MIT](LICENSE).
