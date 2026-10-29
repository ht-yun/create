import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AccountAiSettingsService } from "./account-ai-settings.service.js";
import { AccountSettingsController } from "./account-settings.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [AccountSettingsController],
  providers: [AccountAiSettingsService],
  exports: [AccountAiSettingsService],
})
export class AccountSettingsModule {}
