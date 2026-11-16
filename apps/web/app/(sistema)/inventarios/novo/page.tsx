import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/shared/access-denied";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InventarioForm } from "@/features/inventarios/components/inventario-form";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Abrir inventário" };

export default async function NovoInventarioPage() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") return <AccessDenied />;
  return (
    <main className="grid gap-5 p-4 sm:p-7">
      <Link
        className="text-sm font-medium text-muted-foreground hover:underline"
        href="/inventarios"
      >
        ← Todos os inventários
      </Link>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Abrir inventário</CardTitle>
          <CardDescription>
            Identifique o inventário e escolha a comissão responsável.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventarioForm />
        </CardContent>
      </Card>
    </main>
  );
}
