# Contribute one case

A useful contribution has a small fixture, a task, an independently checkable
answer, and a nearby control where a different decision is right. Explain the
failure in a few sentences and include commands that reproduce it.

Use invented data. Do not submit client material, internal source, private
prompts, real incident transcripts, credentials, or proprietary rules. Changing
names in a private artifact does not necessarily make it publishable. Rebuild
the example from a public concept instead.

Cases live under `cases/<name>/`: `case.json` contains the fixture and answer key;
`responses.json` contains explicitly authored examples; `README.md` explains the
case. Add the case ID to `lib/exercises.js` and add tests for its actual mechanism.
Run `npm test` and `npm run demo` before proposing it.

AI assistance is welcome. The contribution still needs a reproducible failure,
a valid control, and a clear explanation of what the check cannot establish.
Please avoid bulk-generated cases, invented performance figures, or essays that
repeat the README. Label a response as a model result only when a model produced
it; follow [METHOD.md](METHOD.md) when reporting a live run.

For an issue, include the case, operating system, Node version, exact command,
expected result, and actual result. Inspect attachments for private content.
