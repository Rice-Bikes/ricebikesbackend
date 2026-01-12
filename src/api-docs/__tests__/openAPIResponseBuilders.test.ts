import { StatusCodes } from "http-status-codes";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";

describe("createApiResponse", () => {
  it("returns an object keyed by status code with description and JSON schema", () => {
    const dataSchema = z.string();
    const result = createApiResponse(dataSchema, "OK response", StatusCodes.OK);

    // Status code key should exist
    expect(result).toHaveProperty(String(StatusCodes.OK));

    const entry = result[String(StatusCodes.OK)];
    expect(entry).toHaveProperty("description", "OK response");
    expect(entry).toHaveProperty("content");
    expect(entry.content).toHaveProperty("application/json");

    const jsonSchema = entry.content["application/json"].schema;
    // It should be a Zod schema (has safeParse/parse)
    expect(typeof jsonSchema.safeParse).toBe("function");

    // Validate that the schema accepts the expected service response shape
    const valid = jsonSchema.safeParse({
      success: true,
      message: "ok",
      responseObject: "some string",
      statusCode: StatusCodes.OK,
    });
    expect(valid.success).toBe(true);

    // Missing required fields should fail
    const invalid = jsonSchema.safeParse({ success: true, message: "ok" });
    expect(invalid.success).toBe(false);
  });

  it("defaults to 200 when no status code is provided", () => {
    const dataSchema = z.string();
    const result = createApiResponse(dataSchema, "Default OK");
    expect(result).toHaveProperty("200");
    expect(result["200"].description).toBe("Default OK");
  });

  it("wraps provided schema correctly and validates responseObject shape", () => {
    const dataSchema = z.object({ name: z.string() });
    const result = createApiResponse(dataSchema, "Created", StatusCodes.CREATED);

    const jsonSchema = result[String(StatusCodes.CREATED)].content["application/json"].schema;

    // responseObject should be optional but, when present, must match provided dataSchema
    const ok = jsonSchema.safeParse({
      success: true,
      message: "created",
      responseObject: { name: "Alice" },
      statusCode: StatusCodes.CREATED,
    });
    expect(ok.success).toBe(true);

    const bad = jsonSchema.safeParse({
      success: true,
      message: "created",
      responseObject: { name: 123 }, // wrong type
      statusCode: StatusCodes.CREATED,
    });
    expect(bad.success).toBe(false);

    // Omitting responseObject entirely should still be valid
    const omitted = jsonSchema.safeParse({
      success: true,
      message: "created",
      statusCode: StatusCodes.CREATED,
    });
    expect(omitted.success).toBe(true);
  });
});
