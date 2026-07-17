import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
