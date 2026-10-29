import { SetorInventarioParamsSchema } from "@repo/contracts";
import { useLocalSearchParams } from "expo-router";
import { SetorInventarioScreen } from "../../../../../features/inventarios/setor-inventario-screen";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SetorInventarioRoute() {
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
    <SetorInventarioScreen
      inventarioId={parsed.success ? parsed.data.inventarioId : inventarioId}
      setorInventarioId={
        parsed.success ? parsed.data.setorInventarioId : setorInventarioId
      }
      validIds={parsed.success}
    />
  );
}
