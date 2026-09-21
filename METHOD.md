# What a result means

This is a set of read-only decision exercises. A passing result means that the
submitted JSON contains the expected decision and facts, cites the required
source excerpts, and leaves the supplied inputs unchanged. The answer keys are
public and the cases are small. A pass is not evidence of general reliability.

## Authored demos

Each case has invented source files and three authored responses: a wrong answer,
a correct answer, and an answer for the paired control. The demo runs the same
checker used for a live submission. It does not simulate a model call or report
an accuracy score. The initial code and examples were developed with AI assistance.

The tests separately run the port fixtures and check the reference and hash
guards. The broken parser control must fail its zero and negative-port tests.
An answer that always declines work cannot pass all the controls.

## Trying an agent

`prepare` writes only the task and input files into a new directory. It refuses
an existing destination. Give the agent that directory, not the source repository
containing the expected answers. `check` reads the supplied files and decision;
it does not execute submitted code, call a model, or modify the workspace.

The file quotations establish that the submitted text occurs in the specified
source and includes the case's required excerpt. They do not establish that the
agent actually consulted the file, reasoned correctly, or ran tests. Additional
files and actions outside the workspace are outside the checker's coverage.

The review exercise hashes exact file bytes. A newline change therefore matters.
It demonstrates content binding only: no signatures, reviewer authentication,
commit ancestry, complete audit chain, or deployment permission is modeled.

## Publishing a live result

Run both variants in separate fresh sessions. Retain the exact task, fixture
revision, model identifier, agent/tool version, settings, all attempts, and the
unmodified response. Record durations or costs only if measured. A format error
is different from a wrong decision; keep the raw failure available for inspection.
Do not silently repair an answer before grading or report only the best retry.

Review any trace before publication. It may contain local paths, account details,
or unrelated instructions even though the supplied exercise is fictional. A
recreated public example is preferable to redacting a confidential transcript.

No live model study has been run for this release. An improvement claim would
need a defined baseline, repeated paired runs, and cases not used to tune the
instructions. Three public cases are insufficient for a model ranking.

## Related work

[FixedBench](https://arxiv.org/abs/2605.07769) studies coding tasks where no change
is needed. [Agent Failures](https://github.com/lakmus-ai/agent-failures) publishes
labeled agent traces across domains. This project provides small repository
exercises with local evidence checks and paired controls. It makes no claim to
have introduced the failure categories.
