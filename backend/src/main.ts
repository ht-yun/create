import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { HttpErrorFilter } from "./common/http-error.filter.js";
import { DatabaseService } from "./database/database.service.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.enableCors({
    origin: config.get("WEB_ORIGIN", "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  app.useGlobalFilters(new HttpErrorFilter());

  const swagger = new DocumentBuilder()
    .setTitle("Storyloom API")
    .setDescription("互动叙事平台账号、作品、权限与媒体边界 API")
    .setVersion("0.1.0")
    .addCookieAuth(config.get("SESSION_COOKIE_NAME", "storyloom_session"))
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));

  await app.get(DatabaseService).migrate();
  const port = Number(config.get("PORT", "4000"));
  await app.listen(port, "0.0.0.0");
  console.info(`Storyloom API: http://localhost:${port}/api`);
}

void bootstrap();
