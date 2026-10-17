import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@repo/contracts";
import { AppService } from "./app.service";
import { Publica } from "./modules/auth/decorators/publica.decorator";

@Controller("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Publica()
  health(): HealthResponse {
    return this.appService.health();
  }
}
