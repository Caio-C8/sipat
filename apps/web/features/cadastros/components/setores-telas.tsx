import Link from "next/link";
import type { SetorDetalhe } from "@repo/contracts";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";
import { pagina } from "./cadastro-ui";
import { DetalheSetorPrincipal } from "./cadastros-principais-telas";

export function DetalheSetor({
  setor,
  admin,
  children,
}: {
  setor: SetorDetalhe;
  admin: boolean;
  children: ReactNode;
}) {
  const routes = administrativeRoutes.setores;
  return (
    <main className={pagina}>
      <PageHeader
        title={setor.nome}
        description="Consulte os dados do setor e os bens atualmente vinculados."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="lg">
              <Link href={routes.list}>Voltar aos setores</Link>
            </Button>
            {admin ? (
              <Button asChild size="lg">
                <Link href={routes.edit(setor.id)}>Editar setor</Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <DetalheSetorPrincipal registro={setor} />
      {children}
    </main>
  );
}
