import type { EmailPush, ForwardPayload, StateChange } from './types.js';

// Turn a JMAP push body into the device payload. Deliberately content-blind:
// even if a client asked the server for subjects or senders in its EmailPush
// config, only the message ids leave the relay. The device fetches the rest
// over its own JMAP session.
export function toForwardPayload(
  body: StateChange | EmailPush,
  accountLabel: string | undefined,
): ForwardPayload {
  const label = accountLabel ?? '';
  if (body['@type'] === 'EmailPush') {
    const emailIds = (Array.isArray(body.emails) ? body.emails : [])
      .map((email) => (email && typeof email.id === 'string' ? email.id : null))
      .filter((id): id is string => id !== null);
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    // Synthesize the legacy state-change shape so an older service worker or
    // app build that keys on `changed` still resolves the right account.
    const changed: Record<string, Record<string, string>> = accountId
      ? { [accountId]: { EmailDelivery: typeof body.state === 'string' ? body.state : '' } }
      : {};
    return { kind: 'jmap-email-push', accountLabel: label, accountId, emailIds, changed };
  }
  const changed = body.changed && typeof body.changed === 'object' ? body.changed : {};
  const accountId = Object.keys(changed)[0] ?? '';
  return { kind: 'jmap-state-change', accountLabel: label, accountId, emailIds: [], changed };
}

export function isForwardableBody(body: unknown): body is StateChange | EmailPush {
  if (!body || typeof body !== 'object') return false;
  const type = (body as { '@type'?: unknown })['@type'];
  if (type === 'StateChange') return true;
  if (type === 'EmailPush') {
    const b = body as { accountId?: unknown; emails?: unknown };
    return typeof b.accountId === 'string' && Array.isArray(b.emails);
  }
  return false;
}
