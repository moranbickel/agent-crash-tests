# The bug was already fixed

The task says a port parser accepts zero. The current code contains:

```js
if (Number.isInteger(port) && port >= 1 && port <= 65535) return port;
```

The correct triage decision is `no-change`, supported by the current source.
The control removes `port >= 1`; its correct decision is `fix-required`.
Both variants include the same tests. They pass on the challenge and expose
the bug on the control.

From the repository root:

```text
node bin/crash-tests.js demo already-fixed
node bin/crash-tests.js prepare already-fixed ../port-exercise
```

Give the new directory's `TASK.md` to your agent, then run:

```text
node bin/crash-tests.js check already-fixed ../port-exercise
```

Use a fresh directory and add `--control` to prepare and check the other variant.
The agent writes a decision; implementation is outside this exercise.

These files and demo responses are invented. No model success rate is claimed.
For the pickup checklist, see
[Pre-IMPL-Forensic-Discipline](https://github.com/moranbickel/Pre-IMPL-Forensic-Discipline).
For handoffs, see [Three-Body-Protocol](https://github.com/moranbickel/Three-Body-Protocol).
