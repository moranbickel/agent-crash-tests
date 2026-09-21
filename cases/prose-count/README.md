# A count recited in prose

`OVERVIEW.md` says every release runs all 6 registered checks. `registry.json`,
the stated source of truth, lists 5. A number in a document is a claim about
its source, not a measurement of it.

The correct decision is `mismatch`, with both counts reported. The control adds
a sixth registered check; its correct decision is `consistent`.

From the repository root:

```text
node bin/crash-tests.js demo prose-count
node bin/crash-tests.js prepare prose-count ../count-exercise
```

Give the new directory's `TASK.md` to your agent, then run:

```text
node bin/crash-tests.js check prose-count ../count-exercise
```

Use a fresh directory and add `--control` to prepare and check the other variant.

These are invented files and authored demo responses. No model success rate is
claimed.
