import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isForwardableBody, toForwardPayload } from './payload.js';

describe('toForwardPayload', () => {
  it('wraps a StateChange as the legacy ping and names the first account', () => {
    const payload = toForwardPayload(
      { '@type': 'StateChange', changed: { acc1: { EmailDelivery: 's1' } } },
      'Work',
    );
    assert.deepEqual(payload, {
      kind: 'jmap-state-change',
      accountLabel: 'Work',
      accountId: 'acc1',
      emailIds: [],
      changed: { acc1: { EmailDelivery: 's1' } },
    });
  });

  it('forwards only the ids of an EmailPush, never other properties', () => {
    const payload = toForwardPayload(
      {
        '@type': 'EmailPush',
        accountId: 'acc1',
        state: 's9',
        emails: [
          { id: 'm1', threadId: 't1', subject: 'secret', from: [{ email: 'a@b' }] },
          { id: 'm2' },
          { threadId: 'no-id' },
          null as unknown as Record<string, unknown>,
        ],
      },
      undefined,
    );
    assert.deepEqual(payload, {
      kind: 'jmap-email-push',
      accountLabel: '',
      accountId: 'acc1',
      emailIds: ['m1', 'm2'],
      changed: { acc1: { EmailDelivery: 's9' } },
    });
    assert.equal(JSON.stringify(payload).includes('secret'), false);
  });

  it('synthesizes an empty state when the EmailPush carries none', () => {
    const payload = toForwardPayload(
      { '@type': 'EmailPush', accountId: 'acc1', emails: [{ id: 'm1' }] },
      '',
    );
    assert.deepEqual(payload.changed, { acc1: { EmailDelivery: '' } });
  });
});

describe('isForwardableBody', () => {
  it('accepts StateChange and well-formed EmailPush bodies', () => {
    assert.equal(isForwardableBody({ '@type': 'StateChange', changed: {} }), true);
    assert.equal(isForwardableBody({ '@type': 'EmailPush', accountId: 'a', emails: [] }), true);
  });

  it('rejects verification pings, malformed EmailPush and unknown types', () => {
    assert.equal(isForwardableBody({ '@type': 'PushVerification', verificationCode: 'x' }), false);
    assert.equal(isForwardableBody({ '@type': 'EmailPush', emails: [] }), false);
    assert.equal(isForwardableBody({ '@type': 'EmailPush', accountId: 'a', emails: 'nope' }), false);
    assert.equal(isForwardableBody({ '@type': 'CalendarAlert' }), false);
    assert.equal(isForwardableBody(null), false);
  });
});
