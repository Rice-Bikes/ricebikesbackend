/**
 * Keyset (cursor) pagination for the transaction listing.
 *
 * The listing uses two different sort orders, so a single numeric `after_id`
 * cannot describe a position in the result set. Instead each page hands back an
 * opaque cursor holding the full sort key of the last row it returned, and the
 * next query resumes strictly after that key.
 *
 * `sort_key` is the Postgres text rendering of the (coalesced) timestamp the
 * ordering uses, taken straight from the query rather than round-tripped
 * through a JS `Date`. The columns are `timestamp without time zone`, so
 * turning them into `Date`s and back would shift them by the server's UTC
 * offset and make the cursor land on the wrong row.
 */

import { type TransactionView, isTransactionView, sortModeForView } from "./transactionViews";

/**
 * Position in the default ordering: urgent first, waiting-on-email last,
 * oldest first within each group.
 */
export interface OpenCursor {
  mode: "open";
  /** The view this cursor was issued for; null when no view was requested. */
  view: TransactionView | null;
  /** Whether employee transactions were included when this cursor was issued. */
  show_employees: boolean;
  /** Sort bucket of the last row; see sortBucket() in the repository. */
  bucket: number;
  /** `COALESCE(date_created, 'infinity')` as text. */
  sort_key: string;
  transaction_num: number;
}

/** Position in the completed ordering: most recently completed first. */
export interface CompletedCursor {
  mode: "completed";
  /** The view this cursor was issued for; null when no view was requested. */
  view: TransactionView | null;
  /** Whether employee transactions were included when this cursor was issued. */
  show_employees: boolean;
  /** `COALESCE(date_completed, '-infinity')` as text. */
  sort_key: string;
  transaction_num: number;
}

export type TransactionCursor = OpenCursor | CompletedCursor;

export class InvalidCursorError extends Error {
  constructor(message = "Invalid cursor") {
    super(message);
    this.name = "InvalidCursorError";
  }
}

export function encodeCursor(cursor: TransactionCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

/**
 * Decodes a cursor produced by {@link encodeCursor}.
 *
 * @throws {InvalidCursorError} if the cursor is malformed, or if it was issued
 * for a different view or a different show_employees setting than the one now
 * being requested. Resuming a cursor against a different filter would silently
 * skip every row sorting before it, so changing either has to start again from
 * the first page.
 */
export function decodeCursor(
  raw: string,
  expectedView: TransactionView | null,
  expectedShowEmployees: boolean,
): TransactionCursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw new InvalidCursorError("Cursor is not valid base64url-encoded JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new InvalidCursorError();
  }
  const candidate = parsed as Record<string, unknown>;

  const cursorView = candidate.view === null ? null : isTransactionView(candidate.view) ? candidate.view : undefined;
  if (cursorView === undefined) {
    throw new InvalidCursorError("Cursor does not name a valid view");
  }
  if (cursorView !== expectedView) {
    throw new InvalidCursorError(
      `Cursor was issued for the ${describeView(cursorView)} but this request is for the ${describeView(expectedView)}`,
    );
  }

  if (typeof candidate.show_employees !== "boolean") {
    throw new InvalidCursorError();
  }
  if (candidate.show_employees !== expectedShowEmployees) {
    throw new InvalidCursorError(
      `Cursor was issued with show_employees=${candidate.show_employees} but this request uses show_employees=${expectedShowEmployees}`,
    );
  }

  const expectedMode = sortModeForView(expectedView);
  if (candidate.mode !== expectedMode) {
    throw new InvalidCursorError();
  }
  if (typeof candidate.sort_key !== "string" || !Number.isInteger(candidate.transaction_num)) {
    throw new InvalidCursorError();
  }

  if (expectedMode === "completed") {
    return {
      mode: "completed",
      view: cursorView,
      show_employees: candidate.show_employees,
      sort_key: candidate.sort_key,
      transaction_num: candidate.transaction_num as number,
    };
  }

  if (!Number.isInteger(candidate.bucket)) {
    throw new InvalidCursorError();
  }
  return {
    mode: "open",
    view: cursorView,
    show_employees: candidate.show_employees,
    bucket: candidate.bucket as number,
    sort_key: candidate.sort_key,
    transaction_num: candidate.transaction_num as number,
  };
}

function describeView(view: TransactionView | null): string {
  return view === null ? "unfiltered listing" : `"${view}" view`;
}
