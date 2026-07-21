import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { StoriesController } from "./stories.controller.js";
import { StoriesService } from "./stories.service.js";
import { StoryPackageService } from "./story-package.service.js";
import { ImageVariantService } from "./image-variant.service.js";

@Module({ imports: [AuthModule], controllers: [StoriesController], providers: [StoriesService, StoryPackageService, ImageVariantService], exports: [StoriesService, StoryPackageService, ImageVariantService] })
export class StoriesModule {}
