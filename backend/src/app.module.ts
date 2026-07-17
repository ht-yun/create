import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { FeaturesController } from "./features.controller.js";
import { HealthController } from "./health.controller.js";
import { SeedService } from "./seed.service.js";
import { StoriesModule } from "./stories/stories.module.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, StoriesModule],
  controllers: [HealthController, FeaturesController],
  providers: [SeedService],
})
export class AppModule {}
