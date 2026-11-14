/**
 * Named views over the transaction listing.
 *
 * Each view is a saved filter the UI offers as a tab. Keeping them here rather
 * than letting callers assemble raw column filters means the definitions live
 * in one place, and that a view's filter and its sort order cannot drift apart.
 *
 * The matching SQL lives in `buildViewConditions` in the repository.
 */
export const TRANSACTION_VIEWS = ["main", "refurbs", "beerBikes", "builds", "waiting", "paid"] as const;

export type TransactionView = (typeof TRANSACTION_VIEWS)[number];

export function isTransactionView(value: unknown): value is TransactionView {
  return typeof value === "string" && (TRANSACTION_VIEWS as readonly string[]).includes(value);
}

/** Which of the two orderings a listing is paged through in. */
export type TransactionSortMode = "open" | "completed";

/**
 * Views of outstanding work are ordered urgent first, waiting-on-email last and
 * oldest first in between; views of finished work are ordered by most recently
 * completed. A view's ordering is derived here rather than passed in, so the
 * two can never disagree.
 */
export function sortModeForView(view: TransactionView | null): TransactionSortMode {
  return view === "waiting" || view === "paid" ? "completed" : "open";
}
