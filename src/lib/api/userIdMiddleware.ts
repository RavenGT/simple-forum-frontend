import type { Middleware } from "openapi-fetch";

let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export const userIdMiddleware: Middleware = {
  async onRequest({ request }) {
    if (currentUserId) request.headers.set("X-User-Id", currentUserId);
    return request;
  },
};
