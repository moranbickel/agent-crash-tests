#!/usr/bin/env node
import { caseIds, loadCase, prepare, checkWorkspace, demo } from '../lib/exercises.js';

const usage = `Usage:
  node bin/crash-tests.js list
  node bin/crash-tests.js demo [case]
  node bin/crash-tests.js prepare <case> <new-directory> [--control]
  node bin/crash-tests.js check <case> <directory> [--control]

Cases: ${caseIds.join(', ')}
Exit codes: 0 = success, 1 = failed check, 2 = usage/setup error.
Demo responses are authored examples, not model runs.`;

try {
  const args = process.argv.slice(2);
  const control = args.at(-1) === '--control';
  if (control) args.pop();
  const [command, id, target] = args;
  if (command === 'list' && args.length === 1 && !control) {
    for (const name of caseIds) console.log(`${name}: ${loadCase(name).title}`);
  } else if (command === 'demo' && args.length <= 2 && !control) {
    console.log('SYNTHETIC DEMO — authored answers, no model calls\n');
    let correct = true;
    for (const name of id ? [id] : caseIds) {
      console.log(name);
      for (const entry of demo(name)) {
        const { result } = entry;
        console.log(`  ${result.passed ? 'ACCEPT' : 'REJECT'} ${entry.label}`);
        for (const issue of result.issues) console.log(`    ${issue}`);
        correct &&= result.passed === entry.expectedPass;
      }
    }
    console.log(`\nDemo expectations ${correct ? 'met' : 'NOT met'}. This is checker validation, not model accuracy.`);
    process.exitCode = correct ? 0 : 1;
  } else if (command === 'prepare' && args.length === 3) {
    const files = prepare(id, target, control);
    console.log(`Prepared ${files.length} files in a new directory. Give TASK.md to your agent.`);
    console.log('Keep the checker and its answer keys outside the agent workspace.');
  } else if (command === 'check' && args.length === 3) {
    const result = checkWorkspace(id, target, control);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.passed ? 0 : 1;
  } else {
    console.log(usage);
    process.exitCode = args.length === 0 || command === '--help' ? 0 : 2;
  }
} catch (error) {
  console.error(error.code === 'EEXIST'
    ? 'Refusing to overwrite an existing directory. Choose a fresh location.'
    : 'Setup failed. Check the case name, directory, and file permissions.');
  process.exitCode = 2;
}
