import { describe, it, expect } from 'vitest';
import { subscribe, unsubscribe, publishNotification } from './_core/notificationHub';

describe('Notification Hub', () => {
  it('should publish notifications to subscribed listeners', () => {
    const writes: string[] = [];
    const fakeRes: any = { write: (chunk: any) => writes.push(String(chunk)) };
    const listener = { id: 'test', res: fakeRes };
    subscribe(123, listener);
    publishNotification(123, { id: 1, type: 'follow', actorId: 456 });
    // Expect at least one write to have been made
    expect(writes.length).toBeGreaterThan(0);
    // Clean up
    unsubscribe(123, listener);
  });
});
