import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedRequest } from "./auth.types.js";
import { AuthService } from "./auth.service.js";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.userFromToken(request.cookies?.[this.auth.sessionCookieName]);
    if (!user) throw new UnauthorizedException("请先登录");
    request.user = user;
    return true;
  }
}
