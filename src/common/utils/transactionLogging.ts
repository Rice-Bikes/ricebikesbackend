/**
 * Automatic transaction history.
 *
 * Every edit to a transaction belongs in TransactionLogs, and writing those
 * rows is the backend's job: a client that forgets to post a log (or posts a
 * log for an edit that then fails) leaves the history wrong. This module turns
 * a before/after pair of transactions into the entries that describe what
 * actually changed, so the service layer only has to persist them.
 *
 * The wording follows how the frontend renders a history row: `description` is
 * the message, shown on its own as the line people read, and `change_type` is a
 * short category shown title-cased in the metadata beside the date and author.
 * So a description is a complete statement of what happened ("checked out the
 * transaction for $19.50") rather than a fragment that only reads correctly
 * next to its change type, and a change type is a bare category ("checkout").
 *
 * Values and vocabulary match the frontend too: dollars and dates are formatted
 * as it formats them, and an edit to one of the transaction's flags is reported
 * with the tag name and the add/remove wording from the tag picker.
 */

/** A single history row, minus the bookkeeping the repository fills in. */
export interface TransactionLogEntry {
  change_type: string;
  description: string;
}

/**
 * The transaction fields a PATCH can touch. Both the plain and the aggregate
 * transaction shapes satisfy this, and the types are deliberately loose
 * because a value can arrive from the database or straight off a request body.
 */
export interface TransactionSnapshot {
  transaction_type?: string | null;
  total_cost?: number | null;
  description?: string | null;
  is_completed?: boolean | null;
  is_paid?: boolean | null;
  is_refurb?: boolean | null;
  is_urgent?: boolean | null;
  is_nuclear?: boolean | null;
  is_beer_bike?: boolean | null;
  is_reserved?: boolean | null;
  is_waiting_on_email?: boolean | null;
  date_completed?: Date | string | null;
}

/**
 * The categories a row can be filed under. They are kept short and generic
 * because the frontend shows them as a tag rather than as part of a sentence;
 * "updated" also matches the bulk of the rows already in the table.
 */
const CHANGE_TYPE = {
  created: "created",
  updated: "updated",
  completed: "completed",
  checkout: "checkout",
  note: "note",
  part: "part",
  repair: "repair",
  tuneUp: "tune up",
  order: "order",
  bike: "bike",
} as const;

/** Longest note excerpt written into a description, to keep rows readable. */
const MAX_NOTE_LENGTH = 500;

/**
 * The transaction's boolean flags, named as the tag picker names them so that
 * the history says what the person actually clicked.
 *
 * is_completed, is_paid and is_reserved are absent on purpose: they are not
 * tags in the UI, and are reported as their own events below.
 */
const TAG_FIELDS: ReadonlyArray<{ field: keyof TransactionSnapshot; label: string }> = [
  { field: "is_urgent", label: "Urgent" },
  { field: "is_beer_bike", label: "Beer bike" },
  { field: "is_nuclear", label: "Nuclear" },
  { field: "is_waiting_on_email", label: "Waiting on email" },
  { field: "is_refurb", label: "Refurb" },
];

/** Dollars, formatted as the frontend's formatDollars does: "$19.50". */
function formatDollars(amount: number | null | undefined): string {
  return (amount ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** A date, formatted as the frontend's formatDateTime does. */
function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function truncate(value: string): string {
  if (value.length <= MAX_NOTE_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_NOTE_LENGTH)}...`;
}

/** Null and undefined both mean "unset", so neither counts as a change. */
function isUnset(value: unknown): boolean {
  return value === null || value === undefined;
}

/**
 * Whether two values are the same for the purpose of the history.
 *
 * A snapshot can leave a field out where another holds an explicit null, which
 * is the same absence described two ways. Comparing with `!==` would read that
 * as a change, and report a field as cleared when nothing happened to it.
 */
function sameValue(before: unknown, after: unknown): boolean {
  if (isUnset(before) && isUnset(after)) {
    return true;
  }
  return before === after;
}

function timestampOf(value: Date | string | null | undefined): number | null {
  if (isUnset(value)) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

/**
 * Notes are written by appending a line, so report just the line that was
 * added when the old text is still a prefix of the new. Anything else is a
 * rewrite, which there is no way to summarise, so it is reported as an edit.
 */
function describeNotesChange(before: string | null | undefined, after: string | null | undefined): string {
  const previous = before ?? "";
  const current = after ?? "";
  if (current.trim().length === 0) {
    return "cleared the notes";
  }
  if (!current.startsWith(previous)) {
    return "edited the notes";
  }
  const added = current.slice(previous.length).trim();
  return added.length === 0 ? "edited the notes" : `added a note: "${truncate(added)}"`;
}

/**
 * The entries describing how `before` became `after`.
 *
 * Returns an empty array when a PATCH changed nothing, so that a no-op edit
 * does not clutter the history. Entries come back in the order they should be
 * written: ordinary field edits first, then the completion and checkout
 * milestones, which the history lists most-recent-first.
 */
export function diffTransaction(before: TransactionSnapshot, after: TransactionSnapshot): TransactionLogEntry[] {
  const entries: TransactionLogEntry[] = [];

  if (!sameValue(before.transaction_type, after.transaction_type) && !isUnset(after.transaction_type)) {
    entries.push({
      change_type: CHANGE_TYPE.updated,
      description: `changed the transaction type to ${after.transaction_type}`,
    });
  }

  if (!sameValue(before.total_cost, after.total_cost)) {
    entries.push({
      change_type: CHANGE_TYPE.updated,
      description: `changed the total cost to ${formatDollars(after.total_cost)}`,
    });
  }

  if (!sameValue(before.description, after.description)) {
    entries.push({
      change_type: CHANGE_TYPE.note,
      description: describeNotesChange(before.description, after.description),
    });
  }

  for (const tag of TAG_FIELDS) {
    const previous = before[tag.field];
    const current = after[tag.field];
    if (sameValue(previous, current) || isUnset(current)) {
      continue;
    }
    entries.push({
      change_type: CHANGE_TYPE.updated,
      description: `${current ? "added" : "removed"} the ${tag.label} tag`,
    });
  }

  if (!sameValue(before.is_reserved, after.is_reserved) && !isUnset(after.is_reserved)) {
    entries.push({
      change_type: CHANGE_TYPE.updated,
      description: after.is_reserved ? "reserved the transaction" : "removed the reservation",
    });
  }

  const beforeCompletedAt = timestampOf(before.date_completed);
  const afterCompletedAt = timestampOf(after.date_completed);
  if (afterCompletedAt !== beforeCompletedAt) {
    entries.push({
      change_type: CHANGE_TYPE.updated,
      description:
        afterCompletedAt === null
          ? "cleared the completion date"
          : `set the completion date to ${formatDateTime(new Date(afterCompletedAt))}`,
    });
  }

  // Completion and checkout are the two milestones the shop reads the history
  // for, so they are reported as events and named after the buttons that cause
  // them ("Complete"/"Uncomplete", "Checkout"/"Uncheckout").
  if (!sameValue(before.is_completed, after.is_completed) && !isUnset(after.is_completed)) {
    entries.push(
      after.is_completed
        ? { change_type: CHANGE_TYPE.completed, description: "completed the transaction" }
        : { change_type: CHANGE_TYPE.updated, description: "uncompleted the transaction" },
    );
  }

  if (!sameValue(before.is_paid, after.is_paid) && !isUnset(after.is_paid)) {
    entries.push(
      after.is_paid
        ? {
            change_type: CHANGE_TYPE.checkout,
            description: `checked out the transaction for ${formatDollars(after.total_cost)}`,
          }
        : { change_type: CHANGE_TYPE.updated, description: "unchecked out the transaction" },
    );
  }

  return entries;
}

/** The entry recording that a transaction was created. */
export function transactionCreatedEntry(transaction: TransactionSnapshot): TransactionLogEntry {
  const type = transaction.transaction_type;
  return {
    change_type: CHANGE_TYPE.created,
    description: type ? `created a new ${type} transaction` : "created a new transaction",
  };
}

/**
 * What a transaction detail refers to, as much of it as the history needs.
 *
 * A detail is a part, a standalone repair, or a repair that came from a tune
 * up, and which one it is decides both how it is described and the category it
 * is filed under. The names are nullable because the columns they come from
 * are, and a left join can miss its row.
 */
export interface DetailSubject {
  item_name?: string | null;
  repair_name?: string | null;
  tune_up_name?: string | null;
  quantity?: number | null;
}

/** A name for a detail, falling back to something readable when it is missing. */
function subjectName(subject: DetailSubject): string {
  const name = subject.item_name ?? subject.repair_name;
  return name && name.trim().length > 0 ? truncate(name.trim()) : "unnamed";
}

/** "the part X", "the repair Y" — how a detail is referred to in a sentence. */
function subjectPhrase(subject: DetailSubject): string {
  const kind = subject.item_name ? "part" : "repair";
  return `the ${kind} "${subjectName(subject)}"`;
}

/** The category a detail's entries are filed under. */
function subjectChangeType(subject: DetailSubject): string {
  if (subject.tune_up_name) {
    return CHANGE_TYPE.tuneUp;
  }
  return subject.item_name ? CHANGE_TYPE.part : CHANGE_TYPE.repair;
}

/**
 * Where a detail sits, when it came from a tune up. Tune up repairs are worth
 * distinguishing from ones added on their own, because a person reading the
 * history wants to know which tune up a repair belongs to.
 */
function inTuneUp(subject: DetailSubject, preposition = "in"): string {
  return subject.tune_up_name ? ` ${preposition} the ${subject.tune_up_name} tune up` : "";
}

/** The entry recording that a part or repair was added to a transaction. */
export function detailAddedEntry(subject: DetailSubject): TransactionLogEntry {
  const quantity = subject.quantity ?? 1;
  const count = quantity > 1 ? `${quantity} of ` : "";
  return {
    change_type: subjectChangeType(subject),
    description: `added ${count}${subjectPhrase(subject)}${inTuneUp(subject)}`,
  };
}

/** The entry recording that a part or repair was removed from a transaction. */
export function detailRemovedEntry(subject: DetailSubject): TransactionLogEntry {
  return {
    change_type: subjectChangeType(subject),
    description: `removed ${subjectPhrase(subject)}${inTuneUp(subject, "from")}`,
  };
}

/**
 * The entry recording that a repair was completed or reopened. Items are
 * created already complete and are not something a person checks off, so this
 * is only reached for repairs, including the repairs inside a tune up.
 */
export function detailCompletionEntry(subject: DetailSubject, completed: boolean): TransactionLogEntry {
  return {
    change_type: subjectChangeType(subject),
    description: `${completed ? "completed" : "uncompleted"} ${subjectPhrase(subject)}${inTuneUp(subject)}`,
  };
}

/** The entry recording that a tune up was applied to a transaction. */
export function tuneUpAppliedEntry(tune_up_name: string | null | undefined, repairCount: number): TransactionLogEntry {
  const name = tune_up_name && tune_up_name.trim().length > 0 ? tune_up_name.trim() : "unnamed";
  const repairs = `${repairCount} repair${repairCount === 1 ? "" : "s"}`;
  return {
    change_type: CHANGE_TYPE.tuneUp,
    description: `added the ${name} tune up (${repairs})`,
  };
}

/** The entry recording that a part was put on order for a transaction. */
export function partOrderRequestedEntry(subject: DetailSubject): TransactionLogEntry {
  const quantity = subject.quantity ?? 1;
  const count = quantity > 1 ? `${quantity} of ` : "";
  return {
    change_type: CHANGE_TYPE.order,
    description: `requested an order for ${count}the part "${subjectName(subject)}"`,
  };
}

/**
 * The entry recording that an order was marked as placed, or put back to
 * unordered after being marked by mistake.
 */
export function partOrderStatusEntry(subject: DetailSubject, ordered: boolean): TransactionLogEntry {
  const verb = ordered ? "confirmed" : "reopened";
  return {
    change_type: CHANGE_TYPE.order,
    description: `${verb} the order for the part "${subjectName(subject)}"`,
  };
}

/**
 * The entry recording that an order request is gone from the transaction.
 *
 * Worded neutrally on purpose: the UI deletes the order request both when an
 * order is cancelled and when it arrives and becomes a part on the
 * transaction, and the two reach the backend as the same request, so the
 * history cannot claim which one happened.
 */
export function partOrderRemovedEntry(subject: DetailSubject): TransactionLogEntry {
  return {
    change_type: CHANGE_TYPE.order,
    description: `removed the order for the part "${subjectName(subject)}"`,
  };
}

/**
 * The bike fields an edit can touch.
 *
 * A bike is not part of a transaction, but the transaction is where the shop
 * works on it, so changing its details belongs in that transaction's history.
 * Numbers are numbers here because the repository already normalises the
 * decimal columns it reads them from.
 */
export interface BikeSnapshot {
  make?: string | null;
  model?: string | null;
  description?: string | null;
  bike_type?: string | null;
  size_cm?: number | null;
  condition?: string | null;
  price?: number | null;
  is_available?: boolean | null;
  weight_kg?: number | null;
  reservation_customer_id?: string | null;
  deposit_amount?: number | null;
}

/** A text field's new value, quoted, or a note that it was emptied. */
function describeText(label: string, value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text.length === 0 ? `cleared the bike ${label}` : `changed the bike ${label} to "${truncate(text)}"`;
}

/** A measured field's new value with its unit, or a note that it was emptied. */
function describeMeasure(label: string, value: number | null | undefined, unit: string): string {
  return isUnset(value) ? `cleared the bike ${label}` : `changed the bike ${label} to ${value} ${unit}`;
}

/** A money field's new value, or a note that it was emptied. */
function describeMoney(label: string, value: number | null | undefined): string {
  return isUnset(value) ? `cleared the bike ${label}` : `changed the bike ${label} to ${formatDollars(value)}`;
}

/**
 * The entries describing how a bike's details changed.
 *
 * Returns an empty array when an edit changed nothing, so saving a field
 * without touching it does not clutter the history.
 */
export function diffBike(before: BikeSnapshot, after: BikeSnapshot): TransactionLogEntry[] {
  const descriptions: string[] = [];

  if (!sameValue(before.make, after.make)) {
    descriptions.push(describeText("make", after.make));
  }
  if (!sameValue(before.model, after.model)) {
    descriptions.push(describeText("model", after.model));
  }
  if (!sameValue(before.description, after.description)) {
    descriptions.push(describeText("description", after.description));
  }
  if (!sameValue(before.bike_type, after.bike_type)) {
    descriptions.push(describeText("type", after.bike_type));
  }
  if (!sameValue(before.condition, after.condition)) {
    descriptions.push(describeText("condition", after.condition));
  }
  if (!sameValue(before.size_cm, after.size_cm)) {
    descriptions.push(describeMeasure("size", after.size_cm, "cm"));
  }
  if (!sameValue(before.weight_kg, after.weight_kg)) {
    descriptions.push(describeMeasure("weight", after.weight_kg, "kg"));
  }
  if (!sameValue(before.price, after.price)) {
    descriptions.push(describeMoney("price", after.price));
  }
  if (!sameValue(before.deposit_amount, after.deposit_amount)) {
    descriptions.push(describeMoney("deposit", after.deposit_amount));
  }
  if (!sameValue(before.is_available, after.is_available) && !isUnset(after.is_available)) {
    descriptions.push(after.is_available ? "marked the bike available" : "marked the bike unavailable");
  }
  if (!sameValue(before.reservation_customer_id, after.reservation_customer_id)) {
    // The customer's name is not on the bike, so the history says that a
    // reservation changed rather than inventing who it is for.
    descriptions.push(
      isUnset(after.reservation_customer_id) ? "cleared the bike reservation" : "reserved the bike for a customer",
    );
  }

  return descriptions.map((description) => ({ change_type: CHANGE_TYPE.bike, description }));
}
