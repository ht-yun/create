import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { diskStorage } from "multer";
import type { MulterFile } from "multer";
import { mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { AuthService } from "../auth/auth.service.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SessionGuard } from "../auth/session.guard.js";
import { StoriesService } from "./stories.service.js";
import { StoryPackageService } from "./story-package.service.js";
import { ImageVariantService } from "./image-variant.service.js";

const storyImportInterceptor = FileInterceptor("file", {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const directory = join(process.cwd(), ".data", "story-imports");
      mkdirSync(directory, { recursive: true });
      callback(null, directory);
    },
    filename: (_request, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

@ApiTags("stories")
@Controller("stories")
export class StoriesController {
  constructor(@Inject(StoriesService) private readonly stories: StoriesService, @Inject(StoryPackageService) private readonly packages: StoryPackageService, @Inject(ImageVariantService) private readonly imageVariants: ImageVariantService, @Inject(AuthService) private readonly auth: AuthService) {}

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

  @Post("import/validate")
  @UseGuards(SessionGuard)
  @UseInterceptors(storyImportInterceptor)
  async validateImport(@UploadedFile() file: MulterFile | undefined) {
    if (!file) return { valid: false, errors: [{ path: "file", code: "MISSING_FILE", message: "请选择剧情文件" }], warnings: [] };
    try { return await this.packages.validate(file); } finally { if (file.path) await rm(file.path, { force: true }).catch(() => undefined); }
  }

  @Post("import")
  @UseGuards(SessionGuard)
  @UseInterceptors(storyImportInterceptor)
  async importStory(@UploadedFile() file: MulterFile | undefined, @Req() request: AuthenticatedRequest) {
    if (!file) return { valid: false, errors: [{ path: "file", code: "MISSING_FILE", message: "请选择剧情文件" }], warnings: [] };
    try { return await this.packages.importStory(file, request.user); } finally { if (file.path) await rm(file.path, { force: true }).catch(() => undefined); }
  }

  @Get("export/:id")
  @UseGuards(SessionGuard)
  async exportStory(@Param("id") id: string, @Query("format") format: string, @Req() request: AuthenticatedRequest, @Res() response: Response) {
    const story = await this.stories.getById(id, request.user);
    const exported = await this.packages.exportStory(story, format === "storypack" ? "storypack" : "json");
    response.setHeader("Content-Type", exported.mime);
    response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(exported.filename)}`);
    response.send(exported.data);
  }

  @Get("assets/:id")
  async asset(@Param("id") id: string, @Res() response: Response) {
    const asset = await this.packages.readAsset(id);
    response.type(asset.mime).send(asset.data);
  }

  @Get("assets/:id/playback")
  async playbackAsset(@Param("id") id: string, @Res() response: Response) {
    try {
      const asset = await this.imageVariants.readPlayback(id);
      response.type(asset.mime).send(asset.data);
    } catch {
      const asset = await this.packages.readAsset(id);
      response.type(asset.mime).send(asset.data);
    }
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
