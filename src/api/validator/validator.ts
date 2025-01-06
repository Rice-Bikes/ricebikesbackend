import Ajv from "ajv";
import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import { type $Compiler, wrapCompilerAsTypeGuard } from "json-schema-to-ts";

export type TransactionDetailRequest = FromSchema<typeof transactionDetailRequestSchema>;

const transactionDetailRequestSchema = {
  $id: "transactionDetail.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "transactionDetail",
  type: "object",
  oneOf: [
    // if item is added
    {
      properties: {
        transaction_id: { type: "number" },
        item_id: { type: "string" },
        // repair_id: { type: "string" },
        changed_by: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["transaction_id", "item_id", "changed_by", "quantity", "item_id"],
    },
    // if repair is added
    {
      properties: {
        transaction_id: { type: "number" },
        // item_id: { type: "string" },
        repair_id: { type: "string" },
        changed_by: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["transaction_id", "item_id", "changed_by", "quantity", "repair_id"],
    },
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export type TypeGuard<T> = (data: unknown) => data is T;

/**
 * Wrapper around fetch to return a Promise that resolves to the desired type.
 *
 * Returns null if the response body is empty. Use isT() and isEmpty() to
 * validate.
 *
 * @param url      url to fetch from
 * @param validate TypeGuard that validates the response
 * @param options  fetch options
 * @returns        a Promise that resolves to the unmarshaled JSON response
 * @throws         an error if the fetch fails, there is no response body, or
 *                 the response is not valid JSON
 */
function typedFetch<T>(
  url: string,
  validate: TypeGuard<T>,
  options?: RequestInit,
  // timeout: number = 5000,
): Promise<T> {
  console.log("fetching url", url);

  const req: Request = new Request(url, options);
  return fetch(req).then((response: Response) => {
    console.log("response:", response);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.text().then((text: string) => {
      let data: unknown;

      if (text.length !== 0) {
        // Will throw an exception if the response is not valid JSON
        data = JSON.parse(text);
      }

      // Type of unmarshaled response needs to be validated
      if (validate(data)) {
        return data;
      }

      throw new Error(`invalid response: ${text}`);
    });
  });
}

/**
 * Wrapper around fetch to return a Promise that resolves to the desired type.
 *
 * Returns null if the response body is empty. Use isT() and isEmpty() to
 * validate.
 *
 * @param url      url to fetch from
 * @param validate TypeGuard that validates the response
 * @param options  fetch options
 * @returns        a Promise that resolves to the unmarshaled JSON response
 * @throws         an error if the fetch fails, there is no response body, or
 *                 the response is not valid JSON
 */
export function typedRecieve<T>(
  validate: TypeGuard<T>,
  request: Request,
  // timeout: number = 5000,
): Promise<T> {
  console.log("handling request", request);

  return request.text().then((text: unknown) => {
    // Type of unmarshaled response needs to be validated
    if (validate(text)) {
      return text;
    }
    throw new Error(`invalid response: ${text}`);
  });
}

export class Validator {
  public compile: <T>(schema: JSONSchema) => (data: unknown) => data is T;
  public constructor() {
    const ajv = new Ajv();
    const $compile: $Compiler = (schema) => ajv.compile(schema);
    this.compile = wrapCompilerAsTypeGuard($compile);
  }
}
