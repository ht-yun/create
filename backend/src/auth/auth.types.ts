import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: "user" | "admin";
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
