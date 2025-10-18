import type { Request, RequestHandler, Response } from "express";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { serviceLogger as logger } from "@/common/utils/logger";
import { rolesService } from "./roleService";

class RoleController {
  public getRoles: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await rolesService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getRole: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await rolesService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };
  public createRole: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await rolesService.createRole(req.body);
    return handleServiceResponse(serviceResponse, res);
  };
  public updateRole: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await rolesService.updateRole(id, req.body);
    return handleServiceResponse(serviceResponse, res);
  };
  public deleteRole: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await rolesService.deleteRole(id);
    return handleServiceResponse(serviceResponse, res);
  };
  public attachPermissionToRole: RequestHandler = async (req: Request, res: Response) => {
    logger.info("attaching permission to role", req.body);
    const { role_id, permission_id } = req.body;
    const serviceResponse = await rolesService.attachPermissionToRole(role_id, permission_id);
    return handleServiceResponse(serviceResponse, res);
  };

  public detachPermissionFromRole: RequestHandler = async (req: Request, res: Response) => {
    const { role_id, permission_id } = req.body;
    const serviceResponse = await rolesService.detachPermissionFromRole(role_id, permission_id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const roleController = new RoleController();
