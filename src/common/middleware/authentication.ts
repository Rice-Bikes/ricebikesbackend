import type { NextFunction, Request, Response } from "express";

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  // Assumes req.user is set by previous authentication middleware
  const { user } = req.body;
  if (user?.isAdmin) {
    return next();
  }
  return res.status(403).json({ error: "Admin access required" });
}
