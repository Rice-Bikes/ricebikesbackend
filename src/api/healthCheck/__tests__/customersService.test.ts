import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("CustomersService", () => {
  beforeEach(() => {
    // Ensure a clean module state and environment for tests that mock/spy
    vi.resetModules();
    vi.restoreAllMocks();

    process.env.GOOGLE_CLIENT_ID = undefined;
    process.env.GOOGLE_CLIENT_SECRET = undefined;
    process.env.GOOGLE_CLIENT_REFRESH_TOKEN = undefined;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("findAll returns failure when repository returns no customers", async () => {
    // Provide a lightweight, injected repository so the service doesn't try to
    // initialize the real async repository during tests.
    const fakeRepo: any = {
      findAllAsync: vi.fn().mockResolvedValue([]),
    };

    const { CustomersService } = await import("@/api/customer/customerService");
    const svc = new CustomersService(fakeRepo);

    const res = await svc.findAll();
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/No customers found/);
  }, 30000);

  it("findAll returns success when repository returns customers", async () => {
    const fakeRepo: any = {
      findAllAsync: vi.fn().mockResolvedValue([{ customer_id: "c1" }]),
    };
    const { CustomersService } = await import("@/api/customer/customerService");
    const svc = new CustomersService(fakeRepo);

    const res = await svc.findAll();
    expect(res.success).toBe(true);
    // responseObject should be an array with length 1
    expect(Array.isArray(res.responseObject)).toBe(true);
    // Using optional chaining to avoid a stricter type dependency on ServiceResponse types
    expect((res.responseObject as any)?.length).toBe(1);
  });

  it("createCustomer returns success when repository.create succeeds", async () => {
    const fakeRepo: any = {
      create: vi.fn().mockResolvedValue({ customer_id: "created" }),
    };
    const { CustomersService } = await import("@/api/customer/customerService");
    const svc = new CustomersService(fakeRepo);

    const res = await svc.createCustomer({ first_name: "A" } as any);
    expect(res.success).toBe(true);
    expect((res.responseObject as any)?.customer_id).toBe("created");
  });

  it("sendEmail returns failure when required env vars are missing", async () => {
    // Ensure env vars are not set before importing (set to empty string which is falsy)
    process.env.GOOGLE_CLIENT_ID = "";
    process.env.GOOGLE_CLIENT_SECRET = "";
    process.env.GOOGLE_CLIENT_REFRESH_TOKEN = "";

    const fakeRepo: any = {};
    const { CustomersService } = await import("@/api/customer/customerService");
    const svc = new CustomersService(fakeRepo);

    const res = await svc.sendEmail({ first_name: "bob", email: "b@b.com" } as any, 123);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Missing email configuration/i);
  });

  it("sendEmail verifies transporter and sends mail successfully", async () => {
    // Arrange
    // 1) Spy the OAuth2Client's prototype getAccessToken to return a token
    const googleAuth = await import("google-auth-library");
    vi.spyOn(googleAuth.OAuth2Client.prototype, "getAccessToken").mockResolvedValue({ token: "ok-token" } as any);

    // 2) Mock nodemailer.createTransport to return a transporter with verify/sendMail
    const nodemailerModule = await import("nodemailer");
    const nodemailerNs = (nodemailerModule as any).default ?? nodemailerModule;
    const verifyMock = vi.fn().mockResolvedValue(true);
    const sendMailMock = vi.fn().mockResolvedValue({
      accepted: ["ok@x.com"],
      response: "sent-ok",
    } as any);
    vi.spyOn(nodemailerNs, "createTransport").mockReturnValue({
      verify: verifyMock,
      sendMail: sendMailMock,
    } as any);

    // 3) Provide a repository and transaction details repository stub
    const fakeRepo: any = {
      create: vi.fn().mockResolvedValue({ customer_id: "c1" }),
    };
    const fakeTxRepo: any = {
      findAllItems: vi.fn().mockResolvedValue([]),
      findAllRepairs: vi.fn().mockResolvedValue([]),
    };

    // 4) Import service and inject repositories
    const { CustomersService } = await import("@/api/customer/customerService");
    const svc = new CustomersService(fakeRepo);
    // Override TransactionDetailsRepository with our fake implementation
    (svc as any).TransactionDetailsRepository = fakeTxRepo;

    // 5) Set required env variables
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.GOOGLE_CLIENT_REFRESH_TOKEN = "refresh";

    // Act
    const res = await svc.sendEmail({ first_name: "bob", email: "b@b.com" } as any, 456);

    // Assert
    expect(verifyMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });
});
