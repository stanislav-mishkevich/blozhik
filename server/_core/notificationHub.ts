import type { Response } from 'express';

type Listener = {
  id: string;
  res: Response;
};

const userListeners: Map<number, Set<Listener>> = new Map();

export function subscribe(userId: number, listener: Listener) {
  if (!userListeners.has(userId)) userListeners.set(userId, new Set());
  userListeners.get(userId)!.add(listener);
}

export function unsubscribe(userId: number, listener: Listener) {
  const set = userListeners.get(userId);
  if (!set) return;
  set.delete(listener);
  if (set.size === 0) userListeners.delete(userId);
}

export function publishNotification(userId: number, payload: any) {
  const set = userListeners.get(userId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener.res.write(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      // swallow write errors but continue
      console.warn('[NotificationHub] Failed to publish to listener', err);
    }
  }
}

export function clearAllListenersForUser(userId: number) {
  userListeners.delete(userId);
}
