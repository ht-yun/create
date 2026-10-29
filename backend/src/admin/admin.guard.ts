import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { AuthService } from "../auth/auth.service.js";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.userFromToken(request.cookies?.[this.auth.sessionCookieName]);
    if (!user) throw new UnauthorizedException("请先登录管理员账号");
    if (user.role !== "admin") throw new ForbiddenException("当前账号没有管理员权限");
    request.user = user;
    return true;
  }
}
