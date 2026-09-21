import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { caseIds, loadCase, fixtureFiles, prepare, checkSnapshot, checkWorkspace, demo, factIssues } from '../lib/exercises.js';
import { missingReferences, reviewCovers, sha256 } from '../lib/guards.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'bin', 'crash-tests.js');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-crash-tests-'));
let index = 0;
function target() { return path.join(scratch, `exercise ${index++}`); }
function responses(id) {
  return JSON.parse(fs.readFileSync(path.join(root, 'cases', id, 'responses.json'), 'utf8'));
}
function run(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 15000 });
}

for (const id of caseIds) {
  test(`${id}: authored wrong answer rejected; correct and control accepted`, () => {
    for (const entry of demo(id)) assert.equal(entry.result.passed, entry.expectedPass, entry.label);
  });
  test(`${id}: copying the challenge answer into the control does not pass`, () => {
    const spec = loadCase(id);
    assert.equal(checkSnapshot(spec, fixtureFiles(spec, true), responses(id).correct, true).passed, false);
  });
  test(`${id}: right decision without evidence fails`, () => {
    const spec = loadCase(id);
    const answer = responses(id).correct;
    answer.citations = [];
    assert.equal(checkSnapshot(spec, fixtureFiles(spec), answer).passed, false);
  });
  test(`${id}: invented quote fails`, () => {
    const spec = loadCase(id);
    const answer = responses(id).correct;
    answer.citations.push({ path: Object.keys(spec.files)[0], quote: 'This sentence is absent from the fixture.' });
    assert.equal(checkSnapshot(spec, fixtureFiles(spec), answer).passed, false);
  });
  test(`${id}: correct-looking answer cannot hide changed inputs`, () => {
    const spec = loadCase(id);
    const files = fixtureFiles(spec);
    files[Object.keys(spec.files)[0]] += '\nchanged\n';
    assert.equal(checkSnapshot(spec, files, responses(id).correct).passed, false);
  });
  test(`${id}: prepare and CLI check use the actual files`, () => {
    const directory = target();
    assert.equal(run('prepare', id, directory).status, 0);
    assert.equal(fs.existsSync(path.join(directory, 'responses.json')), false);
    assert.equal(fs.existsSync(path.join(directory, 'case.json')), false);
    assert.equal(run('check', id, directory).status, 1);
    fs.writeFileSync(path.join(directory, 'decision.json'), JSON.stringify(responses(id).correct));
    const result = run('check', id, directory);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).passed, true);
    fs.writeFileSync(path.join(directory, 'decision.json'), '{ malformed');
    assert.equal(run('check', id, directory).status, 1);
  });
  test(`${id}: --control prepares and grades the alternative`, () => {
    const directory = target();
    prepare(id, directory, true);
    fs.writeFileSync(path.join(directory, 'decision.json'), JSON.stringify(responses(id).control));
    assert.equal(checkWorkspace(id, directory, true).passed, true);
    assert.equal(checkWorkspace(id, directory).passed, false);
  });
}

test('already-fixed: the actual fixture tests pass, and the control exposes zero and negative ports', () => {
  for (const control of [false, true]) {
    const directory = target();
    prepare('already-fixed', directory, control);
    const childEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('NODE_TEST_')));
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'test/port.test.cjs'], {
      cwd: directory, encoding: 'utf8', timeout: 15000, env: childEnv,
    });
    assert.equal(result.status, control ? 1 : 0, result.stderr);
    if (control) {
      assert.match(result.stdout, /not ok.*rejects zero/);
      assert.match(result.stdout, /not ok.*rejects negative port/);
    }
  }
});

test('reference guard corroborates both ledger fixtures', () => {
  const spec = loadCase('phantom-reference');
  for (const control of [false, true]) {
    const files = fixtureFiles(spec, control);
    const ids = JSON.parse(files['ledger.json']).items.map(item => item.id);
    assert.deepEqual(missingReferences(ids, ['TASK-204']), control ? [] : ['TASK-204']);
  }
});

test('reference guard rejects malformed IDs and deduplicates missing references', () => {
  assert.throws(() => missingReferences(null, ['A']), TypeError);
  assert.throws(() => missingReferences([''], ['A']), TypeError);
  assert.throws(() => missingReferences(['A'], [false]), TypeError);
  assert.deepEqual(missingReferences(['A'], ['B', 'B', 'A', 'C']), ['B', 'C']);
  assert.deepEqual(missingReferences([], ['A']), ['A']);
});

test('hash guard checks actual artifact bytes, verdict, and post-review changes', () => {
  const spec = loadCase('stale-review');
  for (const control of [false, true]) {
    const files = fixtureFiles(spec, control);
    const review = JSON.parse(files['review.json']);
    assert.equal(reviewCovers(review, files['artifact.json']), control);
    assert.equal(reviewCovers(review, files['artifact.json'] + '\n'), false);
    assert.equal(reviewCovers({ ...review, verdict: 'REVISE' }, files['artifact.json']), false);
    const expected = spec.expected[control ? 'control' : 'challenge'];
    assert.equal(expected.facts.currentSha256, sha256(files['artifact.json']));
    assert.equal(expected.facts.reviewedSha256, review.sha256);
  }
  assert.equal(reviewCovers(null, 'text'), false);
  assert.equal(reviewCovers({ verdict: 'PASS', sha256: '' }, 'text'), false);
});

test('preparation refuses existing directories and preserves their contents', () => {
  const directory = target();
  fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, 'keep.txt'), 'keep');
  assert.equal(run('prepare', 'already-fixed', directory).status, 2);
  assert.equal(fs.readFileSync(path.join(directory, 'keep.txt'), 'utf8'), 'keep');
  assert.equal(fs.existsSync(path.join(directory, 'TASK.md')), false);
});

test('invalid commands and cases fail with exit code 2', () => {
  assert.equal(run('demo', '../outside').status, 2);
  assert.equal(run('check', 'unknown', scratch).status, 2);
  assert.equal(run('prepare', 'stale-review').status, 2);
  assert.equal(run('list', '--control').status, 2);
  assert.equal(run('demo', 'stale-review', 'extra').status, 2);
  assert.equal(run('--help').status, 0);
  assert.equal(run('list').status, 0);
});

test('null, array, missing-facts and malformed-citation responses fail', () => {
  const spec = loadCase('already-fixed');
  for (const answer of [null, [], {}, { decision: 'no-change', citations: [null] },
    { decision: 'no-change', facts: { acceptsZero: false }, citations: [null] }]) {
    assert.equal(checkSnapshot(spec, fixtureFiles(spec), answer).passed, false);
  }
});

test('prototype property names cannot masquerade as source paths', () => {
  const spec = loadCase('already-fixed');
  const answer = responses(spec.id).correct;
  answer.citations.push({ path: '__proto__', quote: 'port >= 1' });
  assert.equal(checkSnapshot(spec, fixtureFiles(spec), answer).passed, false);
});

test('checker refuses directory links in place of fixture directories', () => {
  const directory = target();
  prepare('already-fixed', directory);
  const external = target();
  fs.mkdirSync(external);
  const moved = path.join(external, 'original-src');
  // Move only a newly created test fixture within this test's scratch root.
  assert.ok(path.resolve(moved).startsWith(path.resolve(scratch) + path.sep));
  fs.renameSync(path.join(directory, 'src'), moved);
  fs.symlinkSync(moved, path.join(directory, 'src'), process.platform === 'win32' ? 'junction' : 'dir');
  fs.writeFileSync(path.join(directory, 'decision.json'), JSON.stringify(responses('already-fixed').correct));
  assert.equal(checkWorkspace('already-fixed', directory).passed, false);
});

test('facts mismatch names the key and does not echo the value', () => {
  assert.deepEqual(factIssues({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] }), []);
  assert.deepEqual(factIssues({ a: 2, b: [1, 2] }, { a: 1, b: [1, 2] }), ['Fact does not match the fixture: a.']);
  assert.deepEqual(factIssues({ a: 1, b: [2, 1] }, { a: 1, b: [1, 2] }), ['Fact does not match the fixture: b.']);
  assert.deepEqual(factIssues({ a: 1 }, { a: 1, b: [1, 2] }), ['Missing fact: b.']);
  assert.deepEqual(factIssues({ a: 1, b: [1, 2], c: 'secret-value' }, { a: 1, b: [1, 2] }), ['Unexpected fact: c.']);
  assert.ok(!JSON.stringify(factIssues({ a: 'secret-value' }, { a: 1 })).includes('secret-value'));
  for (const bad of [null, [], 'x']) assert.deepEqual(factIssues(bad, { a: 1 }), ['facts must be an object.']);
});

test('prose-count: the stated count appears in prose and the registry counts differ by variant', () => {
  const spec = loadCase('prose-count');
  for (const control of [false, true]) {
    const files = fixtureFiles(spec, control);
    const registered = JSON.parse(files['registry.json']).checks.length;
    const expected = spec.expected[control ? 'control' : 'challenge'];
    assert.equal(registered, expected.facts.registeredCount);
    assert.match(files['OVERVIEW.md'], new RegExp(`all ${expected.facts.statedCount} registered checks`));
    assert.equal(registered === expected.facts.statedCount, control);
  }
});

test('empty-check: both variants say PASS and differ only in files scanned', () => {
  const spec = loadCase('empty-check');
  for (const control of [false, true]) {
    const files = fixtureFiles(spec, control);
    const expected = spec.expected[control ? 'control' : 'challenge'];
    assert.match(files['validation.log'], /^result: PASS$/m);
    const scanned = Number(files['validation.log'].match(/^files scanned: (\d+)$/m)[1]);
    assert.equal(scanned, expected.facts.filesScanned);
    assert.equal(scanned > 0, control);
  }
});
