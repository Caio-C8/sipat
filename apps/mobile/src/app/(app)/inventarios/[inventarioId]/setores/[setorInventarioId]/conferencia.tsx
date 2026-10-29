import { SetorInventarioParamsSchema } from "@repo/contracts";
import { useLocalSearchParams } from "expo-router";
import { ConferenciaScreen } from "../../../../../../features/inventarios/conferencia/conferencia-screen";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ConferenciaRoute() {
  const params = useLocalSearchParams<{
    inventarioId?: string | string[];
    setorInventarioId?: string | string[];
  }>();
  const inventarioId = first(params.inventarioId) ?? "";
  const setorInventarioId = first(params.setorInventarioId) ?? "";
  const parsed = SetorInventarioParamsSchema.safeParse({
    inventarioId,
    setorInventarioId,
  });

  return (
    <ConferenciaScreen
      inventarioId={parsed.success ? parsed.data.inventarioId : inventarioId}
      setorInventarioId={
        parsed.success ? parsed.data.setorInventarioId : setorInventarioId
      }
      validIds={parsed.success}
    />
  );
}
