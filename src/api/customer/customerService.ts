import type { Customer } from "@/api/customer/customerModel";
import type { CustomersRepositoryDrizzle } from "@/api/customer/customerRepositoryDrizzle";
import { createCustomerRepository, createCustomerRepositorySync } from "@/api/customer/customerRepositoryFactory";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { serviceLogger as logger } from "@/common/utils/logger";
import { render } from "@react-email/components";
import { OAuth2Client, auth } from "google-auth-library";
import { StatusCodes } from "http-status-codes";
import nodemailer, { type SentMessageInfo } from "nodemailer";
// import { render } from "@react-email/components";
import { RiceBikesEmail, RiceBikesNewBikeEmail, RiceBikesReciept } from "../../../emails";
import type { Item } from "../transactionComponents/items/itemModel";
import type { Repair } from "../transactionComponents/repairs/repairModel";
import { TransactionDetailsRepositoryDrizzle } from "../transactionComponents/transactionDetails/transactionDetailsRepositoryDrizzle";

// const resend = new Resend(process.env.RESEND_API_KEY);

export class CustomersService {
  private CustomersRepository: CustomersRepositoryDrizzle;
  private TransactionDetailsRepository: TransactionDetailsRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: CustomersRepositoryDrizzle) {
    // If repository is provided, use it directly
    this.TransactionDetailsRepository = new TransactionDetailsRepositoryDrizzle();
    if (repository) {
      this.CustomersRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.CustomersRepository = createCustomerRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.CustomersRepository = await createCustomerRepository();
      this.repositoryInitialized = true;
      logger.debug("Customer repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize customer repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all customers from the database
  async findAll(): Promise<ServiceResponse<Customer[] | null>> {
    try {
      await this.ensureRepository();
      const customers = await this.CustomersRepository.findAllAsync();
      if (!customers || customers.length === 0) {
        return ServiceResponse.failure("No customers found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Customer[]>("customers found", customers);
    } catch (ex) {
      const errorMessage = `Error finding all customers: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving customers.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single customer by their ID
  async findById(id: string): Promise<ServiceResponse<Customer | null>> {
    try {
      await this.ensureRepository();
      const customer = await this.CustomersRepository.findByIdAsync(id);
      if (!customer) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Customer>("Customer found", customer);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a customer
  async createCustomer(customer: Customer): Promise<ServiceResponse<Customer | null>> {
    try {
      await this.ensureRepository();
      const newCustomer = await this.CustomersRepository.create(customer);
      return ServiceResponse.success<Customer>("Customer created", newCustomer);
    } catch (ex) {
      const errorMessage = `Error creating customer: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating customer.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCustomer(customer: Customer): Promise<ServiceResponse<Customer | null>> {
    try {
      await this.ensureRepository();
      const updatedCustomer = await this.CustomersRepository.update(customer);
      return ServiceResponse.success<Customer>("Customer updated", updatedCustomer);
    } catch (ex) {
      const errorMessage = `Error updating customer: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating customer.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async sendReciept(
    customer: Customer,
    transaction_num: number,
    transaction_id: string,
  ): Promise<ServiceResponse<Customer | null>> {
    console.log(
      "Required credentials",
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
    );
    let mailStatus: SentMessageInfo;
    try {
      const authClient = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: "https://developers.google.com/oauthplayground",
      });

      authClient.setCredentials({
        refresh_token: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
      });

      const accessTokenResponse = await authClient.getAccessToken();
      if (!accessTokenResponse.token) {
        return ServiceResponse.failure("Error getting access token", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
      const accessToken = accessTokenResponse.token;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "ricebikes@gmail.com",
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
          accessToken,
          expires: 1484314697598,
        },
      });

      const transactionItemsResponse = await this.TransactionDetailsRepository.findAllItems(transaction_id);
      const transactionRepairsResponse = await this.TransactionDetailsRepository.findAllRepairs(transaction_id);

      const transactionItems: Item[] = (transactionItemsResponse ?? []).map((row) => row.Item as Item);
      const transactionRepairs: Repair[] = (transactionRepairsResponse ?? []).map((row) => row.Repair as Repair);
      const processedMail = await render(
        RiceBikesReciept({
          username: `${customer.first_name} ${customer.last_name}`,
          items: transactionItems,
          repairs: transactionRepairs,
          transaction_num,
        }),
      );

      mailStatus = await transporter.sendMail({
        from: "ricebikes@gmail.com",
        to: customer.email,
        subject: `Transaction Receipt - ${transaction_num}`,
        html: processedMail,
      });
    } catch (error) {
      console.log("Error authorizing/sending email", error);
      return ServiceResponse.failure("Error authorizing/sending email", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    console.log(mailStatus);
    try {
      if (mailStatus.accepted.length === 0) {
        throw new Error(mailStatus.response);
      }
      console.log(`Email sent: ${mailStatus.response}`);
      return ServiceResponse.success<Customer>("Email sent", customer);
    } catch (error) {
      console.log(error);
      return ServiceResponse.failure(`Error sending email ${error}`, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async sendEmail(customer: Customer, transaction_num: number): Promise<ServiceResponse<Customer | null>> {
    console.log(
      "Required credentials",
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
    );
    let mailStatus: SentMessageInfo;
    try {
      // quick validation: ensure required env vars exist (log presence, not values)
      const missing = [] as string[];
      if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
      if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
      if (!process.env.GOOGLE_CLIENT_REFRESH_TOKEN) missing.push("GOOGLE_CLIENT_REFRESH_TOKEN");
      if (missing.length > 0) {
        logger.error(`sendEmail missing env vars: ${missing.join(", ")}`);
        return ServiceResponse.failure(
          `Missing email configuration: ${missing.join(", ")}`,
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const authClient = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: "https://developers.google.com/oauthplayground",
      });

      authClient.setCredentials({
        refresh_token: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
      });

      const accessTokenResponse = await authClient.getAccessToken();
      // log access token response shape (don't log token or secrets)

      if (!accessTokenResponse || !accessTokenResponse.token) {
        return ServiceResponse.failure("Error getting access token", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
      const accessToken = accessTokenResponse.token;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "ricebikes@gmail.com",
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
          accessToken,
          expires: 1484314697598,
        },
      });

      // verify transporter connectivity/auth before attempting send
      try {
        // transporter.verify can throw with detailed info about auth failure
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await transporter.verify();
        logger.debug("Email transporter successfully verified");
      } catch (verifyError) {
        logger.error({ message: (verifyError as Error).message }, "Email transporter verification failed");
        return ServiceResponse.failure(
          `Error verifying email transporter: ${(verifyError as Error).message}`,
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const name = customer.first_name.charAt(0).toUpperCase() + customer.first_name.slice(1);
      const processedMail = await render(
        RiceBikesEmail({
          username: name,
          transaction_num,
          email: customer.email,
        }),
      );

      mailStatus = await transporter.sendMail({
        from: "ricebikes@gmail.com",
        to: customer.email,
        subject: `Bike Ready for Pickup - ${transaction_num}`,
        html: processedMail,
      });
    } catch (error) {
      // log full error with stack for debugging but avoid printing secrets
      logger.error(
        { message: (error as Error).message, stack: (error as Error).stack },
        "Error authorizing/sending email",
      );
      return ServiceResponse.failure(
        `Error authorizing/sending email: ${(error as Error).message}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    console.log(mailStatus);
    try {
      if (mailStatus.accepted.length === 0) {
        throw new Error(mailStatus.response);
      }
      console.log(`Email sent: ${mailStatus.response}`);
      return ServiceResponse.success<Customer>("Email sent", customer);
    } catch (error) {
      console.log(error);
      return ServiceResponse.failure(`Error sending email ${error}`, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async sendNewBikeEmail(
    customer: Customer,
    transaction_num: number,
    bike_make?: string | null,
    bike_model?: string | null,
  ): Promise<ServiceResponse<Customer | null>> {
    console.log(
      "Required credentials",
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
    );
    let mailStatus: SentMessageInfo;
    try {
      // quick validation: ensure required env vars exist (log presence, not values)
      const missing = [] as string[];
      if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
      if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
      if (!process.env.GOOGLE_CLIENT_REFRESH_TOKEN) missing.push("GOOGLE_CLIENT_REFRESH_TOKEN");
      if (missing.length > 0) {
        logger.error(`sendNewBikeEmail missing env vars: ${missing.join(", ")}`);
        return ServiceResponse.failure(
          `Missing email configuration: ${missing.join(", ")}`,
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const authClient = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: "https://developers.google.com/oauthplayground",
      });

      authClient.setCredentials({
        refresh_token: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
      });

      const accessTokenResponse = await authClient.getAccessToken();
      if (!accessTokenResponse || !accessTokenResponse.token) {
        return ServiceResponse.failure("Error getting access token", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
      const accessToken = accessTokenResponse.token;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "ricebikes@gmail.com",
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
          accessToken,
          expires: 1484314697598,
        },
      });

      // verify transporter connectivity/auth before attempting send
      try {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await transporter.verify();
        logger.debug("Email transporter successfully verified (new bike)");
      } catch (verifyError) {
        logger.error({ message: (verifyError as Error).message }, "Email transporter verification failed (new bike)");
        return ServiceResponse.failure(
          `Error verifying email transporter: ${(verifyError as Error).message}`,
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const name = customer.first_name.charAt(0).toUpperCase() + customer.first_name.slice(1);
      const processedMail = await render(
        RiceBikesNewBikeEmail({
          username: name,
          transaction_num,
          bike_make: bike_make ?? undefined,
          bike_model: bike_model ?? undefined,
        }),
      );

      mailStatus = await transporter.sendMail({
        from: "ricebikes@gmail.com",
        to: customer.email,
        subject: `Your New Bike is Ready - ${transaction_num}`,
        html: processedMail,
      });
    } catch (error) {
      // log full error with stack for debugging but avoid printing secrets
      logger.error(
        { message: (error as Error).message, stack: (error as Error).stack },
        "Error authorizing/sending new bike email",
      );
      return ServiceResponse.failure(
        `Error authorizing/sending email: ${(error as Error).message}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    console.log(mailStatus);
    try {
      if (mailStatus.accepted.length === 0) {
        throw new Error(mailStatus.response);
      }
      console.log(`Email sent: ${mailStatus.response}`);
      return ServiceResponse.success<Customer>("Email sent", customer);
    } catch (error) {
      console.log(error);
      return ServiceResponse.failure(`Error sending email ${error}`, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async sendBackups(): Promise<ServiceResponse<null>> {
    console.log(
      "Required credentials",
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
    );
    let mailStatus: SentMessageInfo;
    try {
      const authClient = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: "https://developers.google.com/oauthplayground",
      });

      authClient.setCredentials({
        refresh_token: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
      });

      const accessTokenResponse = await authClient.getAccessToken();
      if (!accessTokenResponse.token) {
        return ServiceResponse.failure("Error getting access token", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
      const accessToken = accessTokenResponse.token;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "ricebikes@gmail.com",
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
          accessToken,
          expires: 1484314697598,
        },
      });
      mailStatus = await transporter.sendMail({
        from: "ricebikes@gmail.com",
        to: "ricebikes@gmail.com",
        subject: `Backup - ${new Date().toLocaleDateString()}`,
        text: "Backup of Rice Bikes database",
        attachments: [
          {
            path: `../../ricebikes_${new Date().toLocaleDateString()}.sql.gz`,
          },
        ],
      });
    } catch (error) {
      console.log("Error authorizing/sending email", error);
      return ServiceResponse.failure("Error authorizing/sending email", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    console.log(mailStatus);
    try {
      if (mailStatus.accepted.length === 0) {
        throw new Error(mailStatus.response);
      }
      console.log(`Email sent: ${mailStatus.response}`);
      return ServiceResponse.success<null>("Email sent", null);
    } catch (error) {
      console.log(error);
      return ServiceResponse.failure(`Error sending email ${error}`, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const customersService = new CustomersService();
