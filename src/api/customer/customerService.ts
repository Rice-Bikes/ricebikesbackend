import { StatusCodes } from "http-status-codes";

import type { Customer } from "@/api/customer/customerModel";
import { CustomersRepository } from "@/api/customer/customerRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

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
}

export const customersService = new CustomersService();
