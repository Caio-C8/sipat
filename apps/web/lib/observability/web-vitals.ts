import type { useReportWebVitals } from "next/web-vitals";
import { normalizarRotaObservavel } from "./routes";

export type WebVitalMetric = Parameters<
  Parameters<typeof useReportWebVitals>[0]
>[0];

export type WebVitalEvent = Readonly<{
  name: WebVitalMetric["name"];
  value: number;
  rating: WebVitalMetric["rating"];
  navigationType: WebVitalMetric["navigationType"];
  route: string;
}>;

export function normalizarWebVital(
  metric: WebVitalMetric,
  pathname: string,
): WebVitalEvent {
  const casasDecimais = metric.name === "CLS" ? 4 : 2;

  return {
    name: metric.name,
    value: Number(metric.value.toFixed(casasDecimais)),
    rating: metric.rating,
    navigationType: metric.navigationType,
    route: normalizarRotaObservavel(pathname),
  };
}
