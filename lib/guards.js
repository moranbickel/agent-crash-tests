import { createHash } from 'node:crypto';

export function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

// The caller supplies the authoritative IDs. This cannot establish their truth.
export function missingReferences(knownIds, citedIds) {
  for (const ids of [knownIds, citedIds]) {
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id.trim())) {
      throw new TypeError('References must be arrays of nonempty strings.');
    }
  }
  const known = new Set(knownIds);
  return [...new Set(citedIds.filter(id => !known.has(id)))];
}

// Content binding only: this does not authenticate the author of a review.
export function reviewCovers(review, content) {
  return review !== null && typeof review === 'object'
    && review.verdict === 'PASS'
    && typeof review.sha256 === 'string'
    && /^[a-f0-9]{64}$/.test(review.sha256)
    && review.sha256 === sha256(content);
}
