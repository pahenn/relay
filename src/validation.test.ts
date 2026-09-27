import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isValidUnifiedPushEndpoint,
  isValidUnifiedPushKeys,
} from './validation.js';

describe('isValidUnifiedPushEndpoint', () => {
  it('accepts an https distributor endpoint', () => {
    assert.equal(isValidUnifiedPushEndpoint('https://ntfy.sh/upA1b2C3d4?up=1'), true);
  });

  it('rejects plain http, other schemes, and junk', () => {
    assert.equal(isValidUnifiedPushEndpoint('http://ntfy.sh/upA1b2C3d4'), false);
    assert.equal(isValidUnifiedPushEndpoint('ftp://example.com/x'), false);
    assert.equal(isValidUnifiedPushEndpoint(''), false);
    assert.equal(isValidUnifiedPushEndpoint(null), false);
    assert.equal(isValidUnifiedPushEndpoint(42), false);
  });

  it('rejects oversized endpoints', () => {
    assert.equal(isValidUnifiedPushEndpoint('https://x.example/' + 'a'.repeat(2048)), false);
  });
});

describe('isValidUnifiedPushKeys', () => {
  const p256dh = 'B'.repeat(87); // typical uncompressed P-256 point, base64url
  const auth = 'a'.repeat(22); // typical 16-byte auth secret, base64url

  it('accepts a plausible key set', () => {
    assert.equal(isValidUnifiedPushKeys({ p256dh, auth }), true);
  });

  it('rejects missing or truncated keys', () => {
    assert.equal(isValidUnifiedPushKeys(null), false);
    assert.equal(isValidUnifiedPushKeys({}), false);
    assert.equal(isValidUnifiedPushKeys({ p256dh, auth: 'short' }), false);
    assert.equal(isValidUnifiedPushKeys({ p256dh: 'short', auth }), false);
  });
});
