import type { Customer } from "@/api/customer/customerModel";
import { CustomersRepository } from "@/api/customer/customerRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { logger } from "@/server";
import { render } from "@react-email/components";
import { OAuth2Client, auth } from "google-auth-library";
import { StatusCodes } from "http-status-codes";
import nodemailer, { type SentMessageInfo } from "nodemailer";
// import { render } from "@react-email/components";
import RiceBikesEmail from "../../../emails/RiceBikesEmail";

// const resend = new Resend(process.env.RESEND_API_KEY);

export class CustomersService {
  private CustomersRepository: CustomersRepository;

  constructor(repository: CustomersRepository = new CustomersRepository()) {
    this.CustomersRepository = repository;
  }

  // Retrieves all customers from the database
  async findAll(): Promise<ServiceResponse<Customer[] | null>> {
    try {
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

  async sendEmail(customer: Customer, transaction_num: number): Promise<ServiceResponse<Customer | null>> {
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

      const name = customer.first_name.charAt(0).toUpperCase() + customer.first_name.slice(1);
      const processedMail = await render(RiceBikesEmail({ username: name, transaction_num, email: customer.email }));

      mailStatus = await transporter.sendMail({
        from: "ricebikes@gmail.com",
        to: customer.email,
        subject: `Bike Ready for Pickup - ${transaction_num}`,
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
}

export const customersService = new CustomersService();
