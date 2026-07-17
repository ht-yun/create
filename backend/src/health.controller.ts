import { Controller, Get, Inject } from "@nestjs/common";
import { DatabaseService } from "./database/database.service.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Get()
  async health() {
    try {
      const databaseTime = await this.database.ping();
      return { status: "ok", service: "storyloom-api", database: "connected", databaseTime };
    } catch {
      return { status: "degraded", service: "storyloom-api", database: "unavailable" };
    }
  }
}
