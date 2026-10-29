import { Controller, Get, Inject, Post, ServiceUnavailableException, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "./auth/session.guard.js";

@ApiTags("capabilities")
@Controller()
export class FeaturesController {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  @Get("capabilities")
  capabilities() {
    return {
      emailAuth: true,
      mediaUpload: this.config.get("STORAGE_PROVIDER", "disabled") !== "disabled",
      aiStoryCreation: { enabled: true, provider: this.config.get("STORY_AI_API_KEY") ? "configured" : "guided-template" },
      aiImport: { enabled: false, acceptedSources: ["novel", "comic"], apiVersion: "v1-reserved" },
    };
  }

  @Post("media/upload-intents")
  @UseGuards(SessionGuard)
  createUploadIntent() {
    if (this.config.get("STORAGE_PROVIDER", "disabled") === "disabled") {
      throw new ServiceUnavailableException("对象存储尚未配置；上传接口已预留");
    }
    return { status: "pending-provider" };
  }

  @Post("ai-imports")
  @UseGuards(SessionGuard)
  createAiImport() {
    throw new ServiceUnavailableException("AI 小说/漫画导入功能尚未启用；接口版本已预留为 v1");
  }
}
