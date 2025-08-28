import type { Request, RequestHandler, Response } from "express";
import { FeatureFlagsService } from "./featureFlagsService";

const service = new FeatureFlagsService();

class FeatureFlagsController {
  public getAllFlags: RequestHandler = async (_req: Request, res: Response) => {
    const flags = await service.getAllFlags();
    res.json(flags);
  };

  public createFlag: RequestHandler = async (req: Request, res: Response) => {
    const { flagName } = req.params;
    const { value, description, status, reason, details, user } = req.body;
    const updated_by = user?.username || "unknown";
    try {
      const flag = await service.createFlag(flagName, value, description, status, updated_by, reason, details);
      res.status(201).json(flag);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  public updateFlag: RequestHandler = async (req: Request, res: Response) => {
    const { flagName } = req.params;
    const { value, reason, details, user } = req.body;
    const updated_by = user.username || "unknown";
    try {
      const updated = await service.updateFlag(flagName, value, updated_by, reason, details);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  };

  public getAuditLog: RequestHandler = async (_req: Request, res: Response) => {
    const audits = await service.getAuditLog();
    res.json(audits);
  };
}

export const featureFlagsController = new FeatureFlagsController();
