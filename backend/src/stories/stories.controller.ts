import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SessionGuard } from "../auth/session.guard.js";
import { StoriesService } from "./stories.service.js";

@ApiTags("stories")
@Controller("stories")
export class StoriesController {
  constructor(@Inject(StoriesService) private readonly stories: StoriesService, @Inject(AuthService) private readonly auth: AuthService) {}

  @Get()
  list(@Query("search") search = "", @Query("sort") sort = "popular") {
    const safeSort = ["popular", "latest", "score"].includes(sort) ? sort as "popular" | "latest" | "score" : "popular";
    return this.stories.listPublic(search, safeSort);
  }

  @Get("mine")
  @UseGuards(SessionGuard)
  mine(@Req() request: AuthenticatedRequest) {
    return this.stories.listMine(request.user);
  }

  @Get("favorites")
  @UseGuards(SessionGuard)
  favorites(@Req() request: AuthenticatedRequest) {
    return this.stories.listFavorites(request.user);
  }

  @Post()
  @UseGuards(SessionGuard)
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.stories.create(body, request.user);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  update(@Param("id") id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.stories.update(id, body, request.user);
  }

  @Post(":slug/favorite")
  @UseGuards(SessionGuard)
  favorite(@Param("slug") slug: string, @Req() request: AuthenticatedRequest) {
    return this.stories.toggleFavorite(slug, request.user);
  }

  @Get(":slug")
  async detail(@Param("slug") slug: string, @Req() request: Request) {
    const viewer = await this.auth.userFromToken(request.cookies?.[this.auth.sessionCookieName]);
    return this.stories.getBySlug(slug, viewer);
  }
}
