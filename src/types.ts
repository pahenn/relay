// Records exist in one of two flavours: FCM (mobile app) or Web Push (PWA in
// the browser). Older on-disk records predate the discriminator and only have
// `fcmToken` - the loader fills in `kind: 'fcm'` for those.
export type SubscriptionRecord =
  | FcmSubscriptionRecord
  | WebSubscriptionRecord;

interface BaseSubscriptionRecord {
  verificationCode: string | null;
  createdAt: number;
  lastPushAt: number | null;
  accountLabel?: string;
}

export interface FcmSubscriptionRecord extends BaseSubscriptionRecord {
  kind: 'fcm';
  fcmToken: string;
}

export interface WebSubscriptionRecord extends BaseSubscriptionRecord {
  kind: 'web';
  webPush: WebPushSubscription;
}

// Mirror of the browser's PushSubscriptionJSON: https://w3c.github.io/push-api
export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushVerification {
  '@type': 'PushVerification';
  pushSubscriptionId: string;
  verificationCode: string;
}

export interface StateChange {
  '@type': 'StateChange';
  changed: Record<string, Record<string, string>>;
}

// draft-ietf-jmap-emailpush: sent instead of a StateChange when the client
// registered a per-account delivery filter on its PushSubscription. `emails`
// holds whatever Email properties the client asked for - Bulwark clients ask
// for ids only, and the relay forwards nothing but ids regardless.
export interface EmailPush {
  '@type': 'EmailPush';
  accountId: string;
  emails: Array<Record<string, unknown>>;
  state?: string;
}

export type JmapPushBody = PushVerification | StateChange | EmailPush;

// What the relay actually forwards to a device. `changed` is always present
// so clients that only understand the state-change ping keep working; `kind`
// and `emailIds` tell newer clients which messages were delivered.
export interface ForwardPayload {
  kind: 'jmap-state-change' | 'jmap-email-push';
  accountLabel: string;
  accountId: string;
  emailIds: string[];
  changed: Record<string, Record<string, string>>;
}
