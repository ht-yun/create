import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";

@ApiTags("admin")
@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("overview")
  overview() {
    return this.admin.overview();
  }

  @Get("users")
  users(@Query("search") search?: string) {
    return this.admin.users(search);
  }

  @Get("stories")
  stories(@Query("status") status?: string) {
    return this.admin.stories(status);
  }

  @Get("posts")
  posts() {
    return this.admin.posts();
  }
}
