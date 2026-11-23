import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { pagina } from "./cadastro-ui";

export function CadastroFormPage({
  title,
  description,
  listHref,
  children,
}: {
  title: string;
  description: string;
  listHref: string;
  children: ReactNode;
}) {
  return (
    <main className={pagina}>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href={listHref}>Voltar à consulta</Link>
          </Button>
        }
      />
      {children}
    </main>
  );
}
