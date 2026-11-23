import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pagina, Paginacao } from "./cadastro-ui";

export type CadastroListMeta = {
  total: number;
  pagina: number;
  ultimaPagina: number;
};

export function SituacaoCadastroBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "secondary" : "outline"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}

export function CadastroRowActions({
  detailHref,
  editHref,
}: {
  detailHref: string;
  editHref?: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={detailHref}>Consultar</Link>
      </Button>
      {editHref ? (
        <Button asChild size="sm">
          <Link href={editHref}>
            <Pencil data-icon="inline-start" />
            Editar
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export function CadastroListShell({
  title,
  description,
  listTitle,
  createHref,
  createLabel,
  admin,
  filters,
  children,
  meta,
  pageHref,
}: {
  title: string;
  description: string;
  listTitle: string;
  createHref: string;
  createLabel: string;
  admin: boolean;
  filters: ReactNode;
  children: ReactNode;
  meta: CadastroListMeta;
  pageHref: (page: number) => string;
}) {
  return (
    <main className={pagina}>
      <PageHeader
        title={title}
        description={description}
        actions={
          admin ? (
            <Button asChild size="lg">
              <Link href={createHref}>
                <Plus data-icon="inline-start" />
                {createLabel}
              </Link>
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent>{filters}</CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>{listTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4">
          <div className="min-w-0 overflow-x-auto">{children}</div>
          <Paginacao meta={meta} href={pageHref} />
        </CardContent>
      </Card>
    </main>
  );
}

export function cadastroPageHref(
  base: string,
  page: number,
  busca?: string,
  statusName = "ativo",
  status?: string,
) {
  return `${base}?${new URLSearchParams({
    pagina: String(page),
    ...(busca ? { busca } : {}),
    ...(status ? { [statusName]: status } : {}),
  })}`;
}
