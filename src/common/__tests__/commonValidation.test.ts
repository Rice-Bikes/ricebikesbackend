import { commonValidations } from "@/common/utils/commonValidation";
import { describe, expect, it } from "vitest";

describe("commonValidations", () => {
  describe("id validation", () => {
    it("parses numeric string and transforms to a number", () => {
      const result = commonValidations.id.safeParse("123");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe("number");
        expect(result.data).toBe(123);
      }
    });

    it("throws via parse and returns a number", () => {
      const parsed = commonValidations.id.parse("42");
      expect(typeof parsed).toBe("number");
      expect(parsed).toBe(42);
    });

    it("fails when input is not numeric", () => {
      const result = commonValidations.id.safeParse("abc");
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain("ID must be a numeric value");
      }
    });

    it("fails when the number is zero or negative", () => {
      const resZero = commonValidations.id.safeParse("0");
      expect(resZero.success).toBe(false);
      if (!resZero.success) {
        const messages = resZero.error.errors.map((e) => e.message);
        expect(messages).toContain("ID must be a positive number");
      }

      const resNeg = commonValidations.id.safeParse("-5");
      expect(resNeg.success).toBe(false);
      if (!resNeg.success) {
        const messages = resNeg.error.errors.map((e) => e.message);
        expect(messages).toContain("ID must be a positive number");
      }
    });

    it("allows decimal numbers and preserves the numeric value", () => {
      const res = commonValidations.id.safeParse("1.5");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe(1.5);
      }
    });
  });

  describe("uuid validation", () => {
    it("accepts a valid lowercase uuid", () => {
      const good = "550e8400-e29b-41d4-a716-446655440000";
      const res = commonValidations.uuid.safeParse(good);
      expect(res.success).toBe(true);
    });

    it("accepts a valid uppercase uuid (case-insensitive)", () => {
      const goodUpper = "550E8400-E29B-41D4-A716-446655440000";
      const res = commonValidations.uuid.safeParse(goodUpper);
      expect(res.success).toBe(true);
    });

    it("rejects invalid uuid strings with an appropriate message", () => {
      const bad = "not-a-uuid";
      const res = commonValidations.uuid.safeParse(bad);
      expect(res.success).toBe(false);
      if (!res.success) {
        const messages = res.error.errors.map((e) => e.message);
        expect(messages).toContain("ID must be a valid UUID");
      }
    });
  });
});
