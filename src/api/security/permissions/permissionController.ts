import type { Request, RequestHandler, Response } from "express";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { rolesService } from "./permissionService";

class PermissionsController {
  public getPermissions: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await rolesService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getPermission: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const serviceResponse = await rolesService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };
  public createPermission: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await rolesService.createPermission(req.body);
    return handleServiceResponse(serviceResponse, res);
  };
  public updatePermission: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const serviceResponse = await rolesService.updatePermission(id, req.body);
    return handleServiceResponse(serviceResponse, res);
  };
  public deletePermission: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const serviceResponse = await rolesService.deletePermission(id);
    return handleServiceResponse(serviceResponse, res);
  };
  public findPermissionByRole: RequestHandler = async (req: Request, res: Response) => {
    const id: string = req.params.id;
    const serviceResponse = await rolesService.findByRoleId(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const roleController = new PermissionsController();
