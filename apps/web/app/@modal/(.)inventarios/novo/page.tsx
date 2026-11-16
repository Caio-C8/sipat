import { AccessDenied } from "@/components/shared/access-denied";
import { InventarioRouteModal } from "@/features/inventarios/components/inventario-route-modal";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export default async function NovoInventarioModalPage() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") return <AccessDenied />;
  return <InventarioRouteModal />;
}
