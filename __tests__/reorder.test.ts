import { describe, expect, it } from "vitest";
import { moveItem, sortMessages } from "components/admin/SortableList";
import { reorderedList, withFacts } from "hooks/useReorder";
import type { Profile } from "lib/types/content";

const rows = [
  { id: 1, name: "a", order: 0 },
  { id: 2, name: "b", order: 1 },
  { id: 3, name: "c", order: 2 },
];

describe("moveItem", () => {
  it("moves the active item to the over item's slot", () => {
    expect(moveItem(rows, 1, 3)?.map((r) => r.id)).toEqual([2, 3, 1]);
    expect(moveItem(rows, 3, 1)?.map((r) => r.id)).toEqual([3, 1, 2]);
  });

  it("is a no-op when dropped outside, in place, or on an unknown id", () => {
    expect(moveItem(rows, 2, null)).toBeNull();
    expect(moveItem(rows, 2, undefined)).toBeNull();
    expect(moveItem(rows, 2, 2)).toBeNull();
    expect(moveItem(rows, 2, 99)).toBeNull();
  });

  it("does not mutate the input", () => {
    const copy = rows.map((r) => ({ ...r }));
    moveItem(rows, 1, 3);
    expect(rows).toEqual(copy);
  });

  it("works with string ids", () => {
    const facts = [{ id: "x" }, { id: "y" }];
    expect(moveItem(facts, "y", "x")).toEqual([{ id: "y" }, { id: "x" }]);
  });
});

describe("reorderedList", () => {
  it("keeps the {items} shape and renumbers order by index", () => {
    const next = [rows[2], rows[0], rows[1]];
    expect(reorderedList(next)).toEqual({
      items: [
        { id: 3, name: "c", order: 0 },
        { id: 1, name: "a", order: 1 },
        { id: 2, name: "b", order: 2 },
      ],
    });
  });

  it("adds order to rows that lacked it", () => {
    expect(reorderedList([{ id: 7 }])).toEqual({ items: [{ id: 7, order: 0 }] });
  });
});

describe("withFacts", () => {
  const profile: Profile = {
    bio: ["hi"],
    photoUrl: "/me.jpg",
    facts: [
      { label: "One", icon: "code" },
      { label: "Two", icon: "code" },
    ],
  };

  it("swaps the facts and keeps the rest of the entry", () => {
    const facts = [...profile.facts].reverse();
    const next = withFacts({ profile, isDefault: true }, facts);
    expect(next).toEqual({ profile: { ...profile, facts }, isDefault: true });
  });

  it("leaves an empty cache empty", () => {
    expect(withFacts(undefined, profile.facts)).toBeUndefined();
  });
});

describe("sortMessages", () => {
  it("reads naturally", () => {
    expect(sortMessages.pickedUp("Alpha", 1, 4)).toBe(
      "Picked up Alpha, at position 1 of 4.",
    );
    expect(sortMessages.moved("Alpha", 2, 4)).toBe("Alpha moved to position 2 of 4.");
    expect(sortMessages.dropped("Alpha", 2, 4)).toBe(
      "Alpha dropped at position 2 of 4.",
    );
    expect(sortMessages.cancelled("Alpha")).toBe("Moving Alpha was cancelled.");
  });
});
