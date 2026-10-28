import { PatrimonioParamsSchema } from "@repo/contracts";
import { useLocalSearchParams } from "expo-router";
import { PatrimonioDetailScreen } from "../../../features/patrimonios/patrimonio-detail-screen";

export default function PatrimonioDetailRoute() {
  const params = useLocalSearchParams<{ patrimonioId?: string | string[] }>();
  const rawId = Array.isArray(params.patrimonioId)
    ? params.patrimonioId[0]
    : params.patrimonioId;
  const parsed = PatrimonioParamsSchema.safeParse({ patrimonioId: rawId });

  return (
    <PatrimonioDetailScreen
      patrimonioId={parsed.success ? parsed.data.patrimonioId : (rawId ?? "")}
      validId={parsed.success}
    />
  );
}
