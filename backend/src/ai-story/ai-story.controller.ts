import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { SessionGuard } from "../auth/session.guard.js";
import { AiStoryService } from "./ai-story.service.js";

@ApiTags("ai-story")
@Controller("ai/story-sessions")
@UseGuards(SessionGuard)
export class AiStoryController {
  constructor(@Inject(AiStoryService) private readonly sessions: AiStoryService) {}

  @Post() start(@Body() body: unknown, @Req() request: AuthenticatedRequest) { return this.sessions.start(body, request.user); }
  @Get(":id") get(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return this.sessions.get(id, request.user); }
  @Post(":id/messages") answer(@Param("id") id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) { return this.sessions.answer(id, body, request.user); }
  @Post(":id/outline") outline(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return this.sessions.generateOutline(id, request.user); }
  @Post(":id/generate") generate(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return this.sessions.generateGraph(id, request.user); }
  @Post(":id/apply") apply(@Param("id") id: string, @Req() request: AuthenticatedRequest) { return this.sessions.apply(id, request.user); }
}
