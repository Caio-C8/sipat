"use client";

import { useReportWebVitals } from "next/web-vitals";
import {
  normalizarWebVital,
  type WebVitalMetric,
} from "@/lib/observability/web-vitals";
import { publicAppConfig } from "@/lib/config/public-app-config";

function reportarWebVital(metric: WebVitalMetric) {
  if (publicAppConfig.environment === "production") {
    return;
  }

  console.info(
    "[web-vital]",
    normalizarWebVital(metric, window.location.pathname),
  );
}

export function WebVitalsReporter() {
  useReportWebVitals(reportarWebVital);

  return null;
}
