# A PASS that read nothing

`validation.log` reports `result: PASS` and `files scanned: 0`. A check whose
input was empty could not have failed, so its PASS is not evidence about the
exports. The handoff treats it as one.

The correct decision is `not-validated`. The control's log scanned 4 files;
its correct decision is `validated`. Both variants say PASS, so an agent that
reads only the verdict line cannot pass both.

From the repository root:

```text
node bin/crash-tests.js demo empty-check
node bin/crash-tests.js prepare empty-check ../empty-exercise
```

Give the new directory's `TASK.md` to your agent, then run:

```text
node bin/crash-tests.js check empty-check ../empty-exercise
```

Use a fresh directory and add `--control` to prepare and check the other variant.

These are invented files and authored demo responses. No model success rate is
claimed.
