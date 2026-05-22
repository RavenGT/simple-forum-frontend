import { beforeEach, describe, expect, it } from "vitest";
import { userIdMiddleware, setCurrentUserId } from "./userIdMiddleware";

function makeCtx(): { request: Request } {
  return { request: new Request("https://example.com/api/test") };
}

describe("userIdMiddleware", () => {
  beforeEach(() => setCurrentUserId(null));

  it("sets X-User-Id when a user is set", async () => {
    setCurrentUserId("alice");
    const { request } = makeCtx();
    const result = (await userIdMiddleware.onRequest!({
      request,
      schemaPath: "/api/test",
      params: {},
      options: {},
    } as any)) as Request;
    expect(result.headers.get("X-User-Id")).toBe("alice");
  });

  it("omits X-User-Id when no user is set", async () => {
    const { request } = makeCtx();
    const result = (await userIdMiddleware.onRequest!({
      request,
      schemaPath: "/api/test",
      params: {},
      options: {},
    } as any)) as Request;
    expect(result.headers.has("X-User-Id")).toBe(false);
  });

  it("reflects updates to setCurrentUserId across calls", async () => {
    setCurrentUserId("alice");
    let result = (await userIdMiddleware.onRequest!({
      request: new Request("https://example.com"), schemaPath: "/", params: {}, options: {},
    } as any)) as Request;
    expect(result.headers.get("X-User-Id")).toBe("alice");

    setCurrentUserId("bob");
    result = (await userIdMiddleware.onRequest!({
      request: new Request("https://example.com"), schemaPath: "/", params: {}, options: {},
    } as any)) as Request;
    expect(result.headers.get("X-User-Id")).toBe("bob");
  });
});
