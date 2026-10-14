import { NextResponse } from "next/server";
import type { HealthResponse } from "@repo/contracts";
import { publicAppConfig } from "@/lib/config/public-app-config";

export function GET() {
  const response: HealthResponse = {
    status: "ok",
    service: "web",
    environment: publicAppConfig.environment,
    version: process.env.APP_VERSION ?? "0.1.0",
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
