import { TipoRelatorioSchema } from "@repo/contracts";
import { Redirect, useLocalSearchParams } from "expo-router";
import { RelatorioFormScreen } from "../../../features/relatorios/relatorio-form-screen";

export function generateStaticParams() {
  return TipoRelatorioSchema.options.map((tipo) => ({ tipo }));
}

export default function RelatorioTipoRoute() {
  const params = useLocalSearchParams<{ tipo?: string | string[] }>();
  const tipo = TipoRelatorioSchema.safeParse(
    Array.isArray(params.tipo) ? params.tipo[0] : params.tipo,
  );
  if (!tipo.success) return <Redirect href="/relatorios" />;
  return <RelatorioFormScreen tipo={tipo.data} />;
}
