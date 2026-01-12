import { Validator, typedFetch, typedRecieve } from "@/api/validator/validator";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Validator utilities", () => {
  it("compile returns a usable type guard", () => {
    const v = new Validator();
    const guard = v.compile<{ foo: string }>({
      type: "object",
      properties: { foo: { type: "string" } },
      required: ["foo"],
    } as any);

    expect(guard({ foo: "bar" })).toBe(true);
    expect(guard({})).toBe(false);
  });

  it("typedFetch returns parsed JSON when response ok", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ foo: "bar" }),
    } as unknown as Response;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const validate = (d: unknown): d is { foo: string } => typeof d === "object" && (d as any)?.foo === "bar";

    const res = await typedFetch("http://example.test", validate as any);

    expect(res).toEqual({ foo: "bar" });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("typedFetch returns null for 204 No Content", async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      statusText: "No Content",
      text: async () => "",
    } as unknown as Response;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const validate = (_: unknown) => false;

    const res = await typedFetch("http://example.test", validate as any);
    expect(res).toBeNull();
  });

  it("typedFetch rejects when response not ok", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    } as unknown as Response;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const validate = (_: unknown) => true;

    await expect(typedFetch("http://example.test", validate as any)).rejects.toThrow("Not Found");
  });

  it("typedFetch rejects when JSON is invalid", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "not-json",
    } as unknown as Response;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const validate = (_: unknown) => true;

    await expect(typedFetch("http://example.test", validate as any)).rejects.toThrow();
  });

  it("typedFetch rejects when validate fails", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ foo: "baz" }),
    } as unknown as Response;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const validate = (_: unknown) => false;

    await expect(typedFetch("http://example.test", validate as any)).rejects.toThrow("invalid response");
  });

  it("typedRecieve returns text when validate passes and rejects when it fails", async () => {
    const req = { text: async () => "hello" } as unknown as Request;
    const validate = (t: unknown): t is string => t === "hello";

    await expect(typedRecieve(validate as any, req)).resolves.toBe("hello");

    const req2 = { text: async () => "bad" } as unknown as Request;
    const validate2 = (_: unknown) => false;

    await expect(typedRecieve(validate2 as any, req2)).rejects.toThrow("invalid response");
  });
});
