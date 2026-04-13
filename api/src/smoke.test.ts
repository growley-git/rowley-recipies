import { describe, expect, it } from "vitest";
import { mergeGroceryLines } from "@rowley/domain";

describe("api smoke", () => {
  it("uses domain merge", () => {
    expect(mergeGroceryLines([])).toEqual([]);
  });
});
