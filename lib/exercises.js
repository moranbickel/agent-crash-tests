import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
export const caseIds = ['already-fixed', 'phantom-reference', 'stale-review', 'prose-count', 'empty-check'];

export function loadCase(id) {
  if (!caseIds.includes(id)) throw new Error(`Unknown case: ${id}`);
  return JSON.parse(fs.readFileSync(path.join(root, 'cases', id, 'case.json'), 'utf8'));
}

function variantName(control) {
  return control ? 'control' : 'challenge';
}

export function fixtureFiles(spec, control = false) {
  return {
    ...spec.files,
    ...(control ? spec.controlOverrides : {}),
    'TASK.md': `${spec.task}\n\n${spec.responseInstructions}\n`,
  };
}

function relativeFile(name) {
  if (!name || path.isAbsolute(name) || name.includes('\\')
      || name.split('/').some(part => !part || part === '..' || part === '.')) {
    throw new Error('Fixture paths must be relative file paths.');
  }
  return name;
}

export function prepare(id, target, control = false) {
  const files = fixtureFiles(loadCase(id), control);
  for (const name of Object.keys(files)) relativeFile(name);
  // Deliberately refuse even an empty existing directory; no overwrites.
  fs.mkdirSync(target);
  for (const [name, content] of Object.entries(files)) {
    const destination = path.join(target, name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, { encoding: 'utf8', flag: 'wx' });
  }
  return Object.keys(files);
}

function readLocalFile(target, name) {
  let current = path.resolve(target);
  const base = fs.lstatSync(current);
  if (!base.isDirectory() || base.isSymbolicLink()) throw new Error('Workspace must be a real directory.');
  const parts = relativeFile(name).split('/');
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Linked fixture refused: ${name}`);
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`Not a directory: ${name}`);
    if (index === parts.length - 1 && (!stat.isFile() || stat.size > 1024 * 1024)) {
      throw new Error(`Expected a regular file of at most 1 MiB: ${name}`);
    }
  }
  return fs.readFileSync(current, 'utf8');
}

// Names the differing key so a wrong answer is diagnosable; values are never echoed.
export function factIssues(actual, expected) {
  if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
    return ['facts must be an object.'];
  }
  const issues = [];
  for (const key of Object.keys(expected)) {
    if (!Object.hasOwn(actual, key)) issues.push(`Missing fact: ${key}.`);
    else if (!isDeepStrictEqual(actual[key], expected[key])) issues.push(`Fact does not match the fixture: ${key}.`);
  }
  for (const key of Object.keys(actual)) {
    if (!Object.hasOwn(expected, key)) issues.push(`Unexpected fact: ${key}.`);
  }
  return issues;
}

export function checkSnapshot(spec, files, response, control = false) {
  const expected = spec.expected[variantName(control)];
  const issues = [];
  for (const [name, content] of Object.entries(fixtureFiles(spec, control))) {
    if (files[name] !== content) issues.push(`Input changed or missing: ${name}`);
  }
  const validObject = response !== null && typeof response === 'object' && !Array.isArray(response);
  if (!validObject) {
    issues.push('decision.json must contain an object.');
  } else {
    if (response.decision !== expected.decision) issues.push(`Decision should be ${expected.decision}.`);
    for (const issue of factIssues(response.facts, expected.facts)) issues.push(issue);
    const citations = response.citations;
    if (!Array.isArray(citations) || citations.length === 0) {
      issues.push('At least one source quotation is required.');
    } else {
      for (const citation of citations) {
        const knownPath = citation && Object.hasOwn(spec.files, citation.path);
        if (!knownPath || typeof citation.quote !== 'string' || !citation.quote.trim()
            || typeof files[citation.path] !== 'string' || !files[citation.path].includes(citation.quote)) {
          issues.push('Citation does not quote a supplied source file.');
        }
      }
      for (const required of expected.evidence) {
        if (!citations.some(c => c && c.path === required.path
            && typeof c.quote === 'string' && c.quote.includes(required.includes)
            && typeof files[c.path] === 'string' && files[c.path].includes(c.quote))) {
          issues.push(`Missing relevant evidence from ${required.path}.`);
        }
      }
    }
  }
  return { case: spec.id, variant: variantName(control), passed: issues.length === 0, issues };
}

export function checkWorkspace(id, target, control = false) {
  const spec = loadCase(id);
  const files = {};
  try {
    for (const name of Object.keys(fixtureFiles(spec, control))) files[name] = readLocalFile(target, name);
    const response = JSON.parse(readLocalFile(target, 'decision.json'));
    return checkSnapshot(spec, files, response, control);
  } catch (error) {
    // Do not echo local paths or submitted content into shareable reports.
    return {
      case: id, variant: variantName(control), passed: false,
      issues: [error instanceof SyntaxError ? 'decision.json is invalid JSON.'
        : 'Cannot read the required regular fixture files and decision.json.'],
    };
  }
}

export function demo(id) {
  const spec = loadCase(id);
  const responses = JSON.parse(fs.readFileSync(path.join(root, 'cases', id, 'responses.json'), 'utf8'));
  return [
    { label: 'authored wrong answer', expectedPass: false, result: checkSnapshot(spec, fixtureFiles(spec), responses.wrong) },
    { label: 'authored correct answer', expectedPass: true, result: checkSnapshot(spec, fixtureFiles(spec), responses.correct) },
    { label: 'authored control answer', expectedPass: true, result: checkSnapshot(spec, fixtureFiles(spec, true), responses.control, true) },
  ];
}
