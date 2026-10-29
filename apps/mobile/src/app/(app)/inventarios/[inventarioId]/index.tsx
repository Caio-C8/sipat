import { InventarioParamsSchema } from "@repo/contracts";
import { useLocalSearchParams } from "expo-router";
import { InventarioSetoresScreen } from "../../../../features/inventarios/inventario-setores-screen";

export default function InventarioSetoresRoute() {
  const params = useLocalSearchParams<{ inventarioId?: string | string[] }>();
  const rawId = Array.isArray(params.inventarioId)
    ? params.inventarioId[0]
    : params.inventarioId;
  const parsed = InventarioParamsSchema.safeParse({ inventarioId: rawId });

  return (
    <InventarioSetoresScreen
      inventarioId={parsed.success ? parsed.data.inventarioId : (rawId ?? "")}
      validId={parsed.success}
    />
  );
}
