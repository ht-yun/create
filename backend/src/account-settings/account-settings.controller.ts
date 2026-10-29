import { Body, Controller, Delete, Get, Inject, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SessionGuard } from "../auth/session.guard.js";
import { AccountAiSettingsService } from "./account-ai-settings.service.js";

@ApiTags("account-settings")
@Controller("account/ai-settings")
@UseGuards(SessionGuard)
export class AccountSettingsController {
  constructor(@Inject(AccountAiSettingsService) private readonly settings: AccountAiSettingsService) {}

  @Get() get(@Req() request: AuthenticatedRequest) { return this.settings.getPublic(request.user.id); }
  @Put() save(@Body() body: unknown, @Req() request: AuthenticatedRequest) { return this.settings.save(request.user.id, body); }
  @Post("test") test(@Req() request: AuthenticatedRequest) { return this.settings.test(request.user.id); }
  @Delete() remove(@Req() request: AuthenticatedRequest) { return this.settings.remove(request.user.id); }
}
