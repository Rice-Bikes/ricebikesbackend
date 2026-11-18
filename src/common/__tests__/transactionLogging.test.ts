import { describe, expect, it } from "vitest";

import {
  type TransactionSnapshot,
  detailAddedEntry,
  detailCompletionEntry,
  detailRemovedEntry,
  diffBike,
  diffTransaction,
  partOrderRemovedEntry,
  partOrderRequestedEntry,
  partOrderStatusEntry,
  transactionCreatedEntry,
  tuneUpAppliedEntry,
} from "@/common/utils/transactionLogging";

/** A transaction as it sits in the database before an edit. */
function baseTransaction(overrides: TransactionSnapshot = {}): TransactionSnapshot {
  return {
    transaction_type: "inpatient",
    total_cost: 0,
    description: "",
    is_completed: false,
    is_paid: false,
    is_refurb: false,
    is_urgent: false,
    is_nuclear: false,
    is_beer_bike: false,
    is_reserved: false,
    is_waiting_on_email: false,
    date_completed: null,
    ...overrides,
  };
}

describe("diffTransaction", () => {
  it("logs nothing when a patch changed nothing", () => {
    expect(diffTransaction(baseTransaction(), baseTransaction())).toEqual([]);
  });

  it("logs a changed total cost in dollars", () => {
    const entries = diffTransaction(baseTransaction(), baseTransaction({ total_cost: 19.5 }));
    expect(entries).toEqual([{ change_type: "updated", description: "changed the total cost to $19.50" }]);
  });

  it("groups thousands in a large total cost, as the frontend does", () => {
    const entries = diffTransaction(baseTransaction(), baseTransaction({ total_cost: 1234.5 }));
    expect(entries).toEqual([{ change_type: "updated", description: "changed the total cost to $1,234.50" }]);
  });

  it("logs a changed transaction type", () => {
    const entries = diffTransaction(baseTransaction(), baseTransaction({ transaction_type: "retrospec" }));
    expect(entries).toEqual([{ change_type: "updated", description: "changed the transaction type to retrospec" }]);
  });

  it("logs completion as its own event", () => {
    const entries = diffTransaction(baseTransaction(), baseTransaction({ is_completed: true }));
    expect(entries).toEqual([{ change_type: "completed", description: "completed the transaction" }]);
  });

  it("logs a transaction being uncompleted", () => {
    const entries = diffTransaction(baseTransaction({ is_completed: true }), baseTransaction({ is_completed: false }));
    expect(entries).toEqual([{ change_type: "updated", description: "uncompleted the transaction" }]);
  });

  it("logs checkout with the amount paid", () => {
    const entries = diffTransaction(baseTransaction(), baseTransaction({ is_paid: true, total_cost: 19.5 }));
    expect(entries).toEqual([
      { change_type: "updated", description: "changed the total cost to $19.50" },
      { change_type: "checkout", description: "checked out the transaction for $19.50" },
    ]);
  });

  it("logs a transaction being unchecked out", () => {
    const entries = diffTransaction(baseTransaction({ is_paid: true }), baseTransaction({ is_paid: false }));
    expect(entries).toEqual([{ change_type: "updated", description: "unchecked out the transaction" }]);
  });

  it("names each flag as the tag picker names it, added or removed", () => {
    const before = baseTransaction({ is_urgent: true });
    const after = baseTransaction({
      is_urgent: false,
      is_nuclear: true,
      is_beer_bike: true,
      is_waiting_on_email: true,
      is_refurb: true,
    });
    expect(diffTransaction(before, after)).toEqual([
      { change_type: "updated", description: "removed the Urgent tag" },
      { change_type: "updated", description: "added the Beer bike tag" },
      { change_type: "updated", description: "added the Nuclear tag" },
      { change_type: "updated", description: "added the Waiting on email tag" },
      { change_type: "updated", description: "added the Refurb tag" },
    ]);
  });

  it("logs a reservation separately, since it is not a tag in the UI", () => {
    expect(diffTransaction(baseTransaction(), baseTransaction({ is_reserved: true }))).toEqual([
      { change_type: "updated", description: "reserved the transaction" },
    ]);
    expect(diffTransaction(baseTransaction({ is_reserved: true }), baseTransaction())).toEqual([
      { change_type: "updated", description: "removed the reservation" },
    ]);
  });

  it("logs only the note that was added, since notes are appended to", () => {
    const before = baseTransaction({ description: "rear flat\n" });
    const after = baseTransaction({ description: "rear flat\nreplaced tube - Anthony Perez\n" });
    expect(diffTransaction(before, after)).toEqual([
      { change_type: "note", description: 'added a note: "replaced tube - Anthony Perez"' },
    ]);
  });

  it("reports a rewrite of the notes as an edit rather than as a new note", () => {
    const before = baseTransaction({ description: "rear flat\n" });
    const after = baseTransaction({ description: "front flat\n" });
    expect(diffTransaction(before, after)).toEqual([{ change_type: "note", description: "edited the notes" }]);
  });

  it("reports emptied notes as cleared", () => {
    const entries = diffTransaction(baseTransaction({ description: "rear flat\n" }), baseTransaction());
    expect(entries).toEqual([{ change_type: "note", description: "cleared the notes" }]);
  });

  it("truncates a very long note", () => {
    const after = baseTransaction({ description: "x".repeat(600) });
    const [entry] = diffTransaction(baseTransaction(), after);
    expect(entry.description).toBe(`added a note: "${"x".repeat(500)}..."`);
  });

  it("logs a completion date whether it is set or cleared", () => {
    const completed = new Date("2026-11-14T18:21:00.000Z");
    const [set] = diffTransaction(baseTransaction(), baseTransaction({ date_completed: completed }));
    expect(set.change_type).toBe("updated");
    // Formatted the way the frontend formats a date, not as an ISO string.
    expect(set.description).toBe(
      `set the completion date to ${completed.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    );
    expect(set.description).not.toContain("T18:21");

    expect(diffTransaction(baseTransaction({ date_completed: completed }), baseTransaction())).toEqual([
      { change_type: "updated", description: "cleared the completion date" },
    ]);
  });

  it("does not log a completion date that only changed representation", () => {
    const before = baseTransaction({ date_completed: new Date("2026-11-14T16:21:39.000Z") });
    const after = baseTransaction({ date_completed: "2026-11-14T16:21:39.000Z" });
    expect(diffTransaction(before, after)).toEqual([]);
  });

  it("treats a field going from null to unset as unchanged", () => {
    // A PATCH that does not mention a field leaves it absent from the update,
    // which must not read as a change away from the stored null.
    const before: TransactionSnapshot = { is_urgent: null, total_cost: 0 };
    const after: TransactionSnapshot = { total_cost: 0 };
    expect(diffTransaction(before, after)).toEqual([]);
  });

  it("logs a flag set for the first time over a stored null", () => {
    expect(diffTransaction({ is_urgent: null }, { is_urgent: true })).toEqual([
      { change_type: "updated", description: "added the Urgent tag" },
    ]);
  });

  it("orders field edits before the completion and checkout milestones", () => {
    // The history lists rows most-recent-first, so the milestones are written
    // last in order to surface at the top.
    const after = baseTransaction({ total_cost: 19.5, is_completed: true, is_paid: true, is_urgent: true });
    expect(diffTransaction(baseTransaction(), after).map((entry) => entry.change_type)).toEqual([
      "updated",
      "updated",
      "completed",
      "checkout",
    ]);
  });

  it("writes descriptions that read on their own, without their change type", () => {
    // The frontend shows the description as the message and the change type
    // only as a tag beside the date, so no description may depend on it.
    const after = baseTransaction({
      total_cost: 19.5,
      is_completed: true,
      is_paid: true,
      is_urgent: true,
      description: "done\n",
    });
    for (const entry of diffTransaction(baseTransaction(), after)) {
      expect(entry.description).toMatch(/^(added|removed|changed|set|cleared|edited|completed|checked|unchecked)\b/);
    }
  });
});

describe("transactionCreatedEntry", () => {
  it("names the kind of transaction it created", () => {
    expect(transactionCreatedEntry({ transaction_type: "retrospec" })).toEqual({
      change_type: "created",
      description: "created a new retrospec transaction",
    });
  });

  it("still reads correctly for a transaction with no type", () => {
    expect(transactionCreatedEntry({ transaction_type: null })).toEqual({
      change_type: "created",
      description: "created a new transaction",
    });
  });
});

describe("detail entries", () => {
  const part = { item_name: "Teravail Standard Tube", repair_name: null, tune_up_name: null };
  const repair = { item_name: null, repair_name: "Flat repair", tune_up_name: null };
  const tuneUpRepair = { item_name: null, repair_name: "Brake adjustment", tune_up_name: "Safety Check" };

  it("files a part under the part category and a repair under the repair one", () => {
    expect(detailAddedEntry(part)).toEqual({
      change_type: "part",
      description: 'added the part "Teravail Standard Tube"',
    });
    expect(detailAddedEntry(repair)).toEqual({
      change_type: "repair",
      description: 'added the repair "Flat repair"',
    });
  });

  it("counts a part added more than once", () => {
    expect(detailAddedEntry({ ...part, quantity: 3 }).description).toBe('added 3 of the part "Teravail Standard Tube"');
  });

  it("does not count a single part", () => {
    expect(detailAddedEntry({ ...part, quantity: 1 }).description).toBe('added the part "Teravail Standard Tube"');
  });

  it("reports removing a part and a repair", () => {
    expect(detailRemovedEntry(part)).toEqual({
      change_type: "part",
      description: 'removed the part "Teravail Standard Tube"',
    });
    expect(detailRemovedEntry(repair)).toEqual({
      change_type: "repair",
      description: 'removed the repair "Flat repair"',
    });
  });

  it("reports completing and uncompleting a repair", () => {
    expect(detailCompletionEntry(repair, true)).toEqual({
      change_type: "repair",
      description: 'completed the repair "Flat repair"',
    });
    expect(detailCompletionEntry(repair, false)).toEqual({
      change_type: "repair",
      description: 'uncompleted the repair "Flat repair"',
    });
  });

  it("names the tune up a repair belongs to, and files it under tune up", () => {
    expect(detailCompletionEntry(tuneUpRepair, true)).toEqual({
      change_type: "tune up",
      description: 'completed the repair "Brake adjustment" in the Safety Check tune up',
    });
    expect(detailCompletionEntry(tuneUpRepair, false).description).toBe(
      'uncompleted the repair "Brake adjustment" in the Safety Check tune up',
    );
  });

  it("says a tune up repair was removed from its tune up, not in it", () => {
    expect(detailRemovedEntry(tuneUpRepair)).toEqual({
      change_type: "tune up",
      description: 'removed the repair "Brake adjustment" from the Safety Check tune up',
    });
  });

  it("falls back to a readable name when the joined row has none", () => {
    expect(detailRemovedEntry({ item_name: null, repair_name: null }).description).toBe('removed the repair "unnamed"');
  });
});

describe("tuneUpAppliedEntry", () => {
  it("names the tune up and how many repairs it brought", () => {
    expect(tuneUpAppliedEntry("Safety Check", 6)).toEqual({
      change_type: "tune up",
      description: "added the Safety Check tune up (6 repairs)",
    });
  });

  it("does not pluralise a single repair", () => {
    expect(tuneUpAppliedEntry("Safety Check", 1).description).toBe("added the Safety Check tune up (1 repair)");
  });

  it("reports an empty tune up honestly rather than hiding it", () => {
    expect(tuneUpAppliedEntry("Safety Check", 0).description).toBe("added the Safety Check tune up (0 repairs)");
  });
});

describe("order entries", () => {
  const subject = { item_name: "Shimano Deore Chain" };

  it("reports a part being put on order", () => {
    expect(partOrderRequestedEntry(subject)).toEqual({
      change_type: "order",
      description: 'requested an order for the part "Shimano Deore Chain"',
    });
  });

  it("counts an order for more than one", () => {
    expect(partOrderRequestedEntry({ ...subject, quantity: 4 }).description).toBe(
      'requested an order for 4 of the part "Shimano Deore Chain"',
    );
  });

  it("reports an order being confirmed and put back", () => {
    expect(partOrderStatusEntry(subject, true)).toEqual({
      change_type: "order",
      description: 'confirmed the order for the part "Shimano Deore Chain"',
    });
    expect(partOrderStatusEntry(subject, false).description).toBe(
      'reopened the order for the part "Shimano Deore Chain"',
    );
  });

  it("stays neutral about why an order was removed", () => {
    // Cancelling an order and receiving one both delete the order request, so
    // the history must not claim which happened.
    const { description } = partOrderRemovedEntry(subject);
    expect(description).toBe('removed the order for the part "Shimano Deore Chain"');
    expect(description).not.toMatch(/cancel|arriv|receiv|finish/);
  });
});

describe("diffBike", () => {
  it("logs nothing when an edit changed nothing", () => {
    const stored = { make: "Trek", model: "FX 2", price: 450 };
    expect(diffBike(stored, { ...stored })).toEqual([]);
  });

  it("files bike details under the bike category", () => {
    expect(diffBike({ model: "FX 2" }, { model: "FX 3" })).toEqual([
      { change_type: "bike", description: 'changed the bike model to "FX 3"' },
    ]);
  });

  it("treats a detail going from null to unset as unchanged", () => {
    expect(diffBike({ price: null, model: "FX 2" }, { model: "FX 2" })).toEqual([]);
  });

  it("truncates a very long description", () => {
    const [entry] = diffBike({ description: "" }, { description: "x".repeat(600) });
    expect(entry.description).toBe(`changed the bike description to "${"x".repeat(500)}..."`);
  });
});

describe("every entry builder", () => {
  it("writes a description that reads on its own, without its change type", () => {
    const entries = [
      ...diffBike({ make: "Trek", is_available: true }, { make: "Specialized", is_available: false }),
      detailAddedEntry({ item_name: "Tube" }),
      detailRemovedEntry({ repair_name: "Flat repair" }),
      detailCompletionEntry({ repair_name: "Flat repair" }, true),
      detailCompletionEntry({ repair_name: "Brake", tune_up_name: "Safety Check" }, false),
      tuneUpAppliedEntry("Safety Check", 6),
      partOrderRequestedEntry({ item_name: "Chain" }),
      partOrderStatusEntry({ item_name: "Chain" }, true),
      partOrderRemovedEntry({ item_name: "Chain" }),
      transactionCreatedEntry({ transaction_type: "inpatient" }),
    ];
    for (const entry of entries) {
      expect(entry.description).toMatch(
        /^(added|removed|completed|uncompleted|requested|confirmed|reopened|created|changed|marked|cleared|reserved)\b/,
      );
      // The change type is a bare category, never a sentence fragment.
      expect(entry.change_type).toMatch(/^[a-z ]+$/);
    }
  });
});
