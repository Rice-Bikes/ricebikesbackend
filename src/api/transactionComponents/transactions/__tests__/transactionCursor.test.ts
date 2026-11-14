import { describe, expect, it } from "vitest";

import {
  InvalidCursorError,
  type TransactionCursor,
  decodeCursor,
  encodeCursor,
} from "@/api/transactionComponents/transactions/transactionCursor";
import { sortModeForView } from "@/api/transactionComponents/transactions/transactionViews";

describe("transaction cursors", () => {
  it("round-trips an open cursor", () => {
    const cursor: TransactionCursor = {
      mode: "open",
      view: "main",
      show_employees: false,
      bucket: 2,
      sort_key: "2026-11-13 16:21:39",
      transaction_num: 17429,
    };
    expect(decodeCursor(encodeCursor(cursor), "main", false)).toEqual(cursor);
  });

  it("round-trips a completed cursor", () => {
    const cursor: TransactionCursor = {
      mode: "completed",
      view: "paid",
      show_employees: false,
      sort_key: "2026-11-13 16:21:39",
      transaction_num: 17429,
    };
    expect(decodeCursor(encodeCursor(cursor), "paid", false)).toEqual(cursor);
  });

  it("round-trips a viewless cursor", () => {
    const cursor: TransactionCursor = {
      mode: "open",
      view: null,
      show_employees: false,
      bucket: 1,
      sort_key: "infinity",
      transaction_num: 5,
    };
    expect(decodeCursor(encodeCursor(cursor), null, false)).toEqual(cursor);
  });

  it("produces a URL-safe cursor", () => {
    const encoded = encodeCursor({
      mode: "open",
      view: "main",
      show_employees: false,
      bucket: 0,
      sort_key: "2026-11-13 16:21:39.123456",
      transaction_num: 1,
    });
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(encoded)).toBe(encoded);
  });

  it("rejects a cursor issued for a different view", () => {
    const encoded = encodeCursor({
      mode: "open",
      view: "main",
      show_employees: false,
      bucket: 0,
      sort_key: "2026-11-13 16:21:39",
      transaction_num: 1,
    });
    // Same ordering, different filter: resuming here would skip rows.
    expect(() => decodeCursor(encoded, "refurbs", false)).toThrow(InvalidCursorError);
    // Different ordering entirely.
    expect(() => decodeCursor(encoded, "paid", false)).toThrow(InvalidCursorError);
    // And a view cursor must not be replayed against the unfiltered listing.
    expect(() => decodeCursor(encoded, null, false)).toThrow(InvalidCursorError);
  });

  it("rejects a cursor issued with a different show_employees setting", () => {
    const encoded = encodeCursor({
      mode: "open",
      view: "main",
      show_employees: false,
      bucket: 0,
      sort_key: "2026-11-13 16:21:39",
      transaction_num: 1,
    });
    expect(() => decodeCursor(encoded, "main", true)).toThrow(InvalidCursorError);
    expect(decodeCursor(encoded, "main", false).show_employees).toBe(false);
  });

  it("rejects a cursor naming a view that does not exist", () => {
    const encoded = Buffer.from(
      JSON.stringify({
        mode: "open",
        view: "nope",
        show_employees: false,
        bucket: 0,
        sort_key: "infinity",
        transaction_num: 1,
      }),
    ).toString("base64url");
    expect(() => decodeCursor(encoded, "main", false)).toThrow(InvalidCursorError);
  });

  it("rejects malformed cursors", () => {
    expect(() => decodeCursor("not-a-cursor", "main", false)).toThrow(InvalidCursorError);
    expect(() => decodeCursor(Buffer.from("[]").toString("base64url"), "main", false)).toThrow(InvalidCursorError);
  });

  it("rejects an open cursor that is missing its bucket", () => {
    const encoded = Buffer.from(
      JSON.stringify({ mode: "open", view: "main", show_employees: false, sort_key: "infinity", transaction_num: 1 }),
    ).toString("base64url");
    expect(() => decodeCursor(encoded, "main", false)).toThrow(InvalidCursorError);
  });

  it("rejects a non-integer transaction_num", () => {
    const encoded = Buffer.from(
      JSON.stringify({
        mode: "completed",
        view: "paid",
        show_employees: false,
        sort_key: "infinity",
        transaction_num: "1",
      }),
    ).toString("base64url");
    expect(() => decodeCursor(encoded, "paid", false)).toThrow(InvalidCursorError);
  });
});

describe("sortModeForView", () => {
  it("orders finished-work views by completion date", () => {
    expect(sortModeForView("waiting")).toBe("completed");
    expect(sortModeForView("paid")).toBe("completed");
  });

  it("orders outstanding-work views by urgency then age", () => {
    expect(sortModeForView("main")).toBe("open");
    expect(sortModeForView("refurbs")).toBe("open");
    expect(sortModeForView("beerBikes")).toBe("open");
    expect(sortModeForView("builds")).toBe("open");
    expect(sortModeForView(null)).toBe("open");
  });
});
