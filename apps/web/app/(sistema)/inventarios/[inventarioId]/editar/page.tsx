import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InventarioParamsSchema } from "@repo/contracts";
import { AccessDenied } from "@/components/shared/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { serverInventarioOperations } from "@/features/inventarios/api/server-inventario-operations";
import { InventarioForm } from "@/features/inventarios/components/inventario-form";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Editar inventário" };

export default async function EditarInventarioPage({
  params,
}: {
  params: Promise<{ inventarioId: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") return <AccessDenied />;
  const validacao = InventarioParamsSchema.safeParse(await params);
  if (!validacao.success) notFound();
  const resposta = await serverInventarioOperations.consultar(
    validacao.data.inventarioId,
    {
      cookie: (await headers()).get("cookie") ?? "",
    },
  );
  const inventario = resposta.dados;
  return (
    <main className="grid gap-5 p-4 sm:p-7">
      <Link
        className="text-sm font-medium text-muted-foreground hover:underline"
        href={`/inventarios/${inventario.id}`}
      >
        ← Voltar ao inventário
      </Link>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Editar inventário</CardTitle>
          <CardDescription>
            Atualize os dados antes do início da conferência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventario.status === "PENDENTE" ? (
            <InventarioForm inventario={inventario} />
          ) : (
            <Alert>
              <AlertTitle>Edição indisponível</AlertTitle>
              <AlertDescription>
                Este inventário já foi iniciado e agora deve permanecer somente
                leitura.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
