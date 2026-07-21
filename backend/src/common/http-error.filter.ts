import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = error instanceof HttpException ? error.getResponse() : null;
    if (payload && typeof payload === "object" && "valid" in payload) {
      response.status(status).json(payload);
      return;
    }
    const message = typeof payload === "string"
      ? payload
      : payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : "服务器暂时无法完成请求";

    if (!(error instanceof HttpException)) console.error(error);
    response.status(status).json({ error: { status, message } });
  }
}
