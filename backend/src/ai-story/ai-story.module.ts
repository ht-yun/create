import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { StoriesModule } from "../stories/stories.module.js";
import { AiStoryController } from "./ai-story.controller.js";
import { GuidedTemplateStoryProvider, OpenAiCompatibleStoryProvider } from "./ai-story.provider.js";
import { AiStoryService } from "./ai-story.service.js";
import { AccountSettingsModule } from "../account-settings/account-settings.module.js";

@Module({ imports: [AuthModule, StoriesModule, AccountSettingsModule], controllers: [AiStoryController], providers: [AiStoryService, OpenAiCompatibleStoryProvider, GuidedTemplateStoryProvider] })
export class AiStoryModule {}
