import { ItemInventarioParamsSchema } from "@repo/contracts";
import { useLocalSearchParams } from "expo-router";
import { CorrecaoScreen } from "../../../../../../features/inventarios/correcao/correcao-screen";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CorrecaoRoute() {
  const params = useLocalSearchParams<{
    inventarioId?: string | string[];
    itemInventarioId?: string | string[];
  }>();
  const inventarioId = first(params.inventarioId) ?? "";
  const itemInventarioId = first(params.itemInventarioId) ?? "";
  const parsed = ItemInventarioParamsSchema.safeParse({
    inventarioId,
    itemInventarioId,
  });

  return (
    <CorrecaoScreen
      inventarioId={parsed.success ? parsed.data.inventarioId : inventarioId}
      itemInventarioId={
        parsed.success ? parsed.data.itemInventarioId : itemInventarioId
      }
      validIds={parsed.success}
    />
  );
}
