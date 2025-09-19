import type { Request, RequestHandler, Response } from "express";

import type { CreateBikeInput, UpdateBikeInput } from "@/api/bikes/bikesModel";
import { bikesService } from "@/api/bikes/bikesService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { logger } from "@/server";
class BikeController {
  public getBikes: RequestHandler = async (req: Request, res: Response) => {
    // Extract query filters
    const filters = {
      bike_type: req.query.bike_type as string,
      condition: req.query.condition as "New" | "Refurbished" | "Used",
      is_available: req.query.is_available ? req.query.is_available === "true" : undefined,
      min_size: req.query.min_size ? Number(req.query.min_size) : undefined,
      max_size: req.query.max_size ? Number(req.query.max_size) : undefined,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined));

    const serviceResponse = await bikesService.findAll(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined);
    return handleServiceResponse(serviceResponse, res);
  };

  public getAvailableBikes: RequestHandler = async (req: Request, res: Response) => {
    // Extract query filters
    const filters = {
      bike_type: req.query.bike_type as string,
      condition: req.query.condition as "New" | "Refurbished" | "Used",
      min_size: req.query.min_size ? Number(req.query.min_size) : undefined,
      max_size: req.query.max_size ? Number(req.query.max_size) : undefined,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined));

    const serviceResponse = await bikesService.findAvailableForSale(
      Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
    );
    return handleServiceResponse(serviceResponse, res);
  };

  public getBike: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await bikesService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createBike: RequestHandler = async (req: Request, res: Response) => {
    const bikeData: CreateBikeInput = {
      make: req.body.make,
      model: req.body.model,
      description: req.body.description || null,
      bike_type: req.body.bike_type || null,
      size_cm: req.body.size_cm || null,
      condition: req.body.condition || "Used",
      price: req.body.price || null,
      is_available: req.body.is_available ?? true,
      weight_kg: req.body.weight_kg || null,
      reservation_customer_id: req.body.reservation_customer_id || null,
      deposit_amount: req.body.deposit_amount || null,
    };

    const serviceResponse = await bikesService.createBike(bikeData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateBike: RequestHandler = async (req: Request, res: Response) => {
    const bike_id = req.params.id as string;
    const updateData: UpdateBikeInput = {};
    logger.info("Request Body: ", req.body);
    // Only include fields that are present in the request body
    if (req.body.make !== undefined) updateData.make = req.body.make;
    if (req.body.model !== undefined) updateData.model = req.body.model;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.bike_type !== undefined) updateData.bike_type = req.body.bike_type;
    if (req.body.size_cm !== undefined) updateData.size_cm = req.body.size_cm;
    if (req.body.condition !== undefined) updateData.condition = req.body.condition;
    if (req.body.price !== undefined) updateData.price = req.body.price;
    if (req.body.is_available !== undefined) updateData.is_available = req.body.is_available;
    if (req.body.weight_kg !== undefined) updateData.weight_kg = req.body.weight_kg;
    if (req.body.reservation_customer_id !== undefined)
      updateData.reservation_customer_id = req.body.reservation_customer_id;
    if (req.body.deposit_amount !== undefined) updateData.deposit_amount = req.body.deposit_amount;
    logger.info("Update Data: ", updateData);
    const serviceResponse = await bikesService.updateBike(bike_id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteBike: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await bikesService.deleteBike(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public reserveBike: RequestHandler = async (req: Request, res: Response) => {
    const bike_id = req.params.id as string;
    const { customer_id, deposit_amount } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required for reservation",
        statusCode: 400,
      });
    }

    const serviceResponse = await bikesService.reserveBike(bike_id, customer_id, deposit_amount);
    return handleServiceResponse(serviceResponse, res);
  };

  public unreserveBike: RequestHandler = async (req: Request, res: Response) => {
    const bike_id = req.params.id as string;
    const serviceResponse = await bikesService.unreserveBike(bike_id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const bikeController = new BikeController();
