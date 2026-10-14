import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnvironment, HealthResponse } from "@repo/contracts";
import type { EnvironmentVariables } from "./environment";

@Injectable()
export class AppService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  health(): HealthResponse {
    return {
      status: "ok",
      service: this.config.getOrThrow("APP_NAME", { infer: true }),
      environment: this.config.getOrThrow("APP_ENV", {
        infer: true,
      }) as AppEnvironment,
      version: this.config.getOrThrow("APP_VERSION", { infer: true }),
      timestamp: new Date().toISOString(),
    };
  }
}
