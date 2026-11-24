import type { Metadata } from "next";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { AlterarSenhaForm } from "@/features/minha-conta/components/alterar-senha-form";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { nomesPerfis } from "@/lib/navigation/system-navigation";

export const metadata: Metadata = {
  title: "Alterar senha",
  description: "Atualize sua senha de acesso ao SIPAT.",
};

export default async function AlterarSenhaPage() {
  const identidade = await exigirIdentidadeAtual();

  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-5 sm:px-6 sm:py-6 min-[1500px]:gap-6 min-[1500px]:px-8">
      <PageHeader
        title="Alterar senha"
        description="Crie uma nova senha para acessar sua conta no computador e no celular."
      />

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <Card asChild className="min-w-0">
          <section aria-labelledby="senha-acesso-titulo">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-interactive">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </div>
              <CardTitle id="senha-acesso-titulo" className="text-lg">
                Senha de acesso
              </CardTitle>
              <CardDescription>
                Informe sua senha atual e escolha uma nova combinação segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlterarSenhaForm />
            </CardContent>
          </section>
        </Card>

        <aside className="grid min-w-0 gap-5">
          <Alert className="border-brand-gold/50 bg-brand-gold-light/15">
            <ShieldCheck aria-hidden="true" />
            <AlertTitle>Você precisará entrar novamente</AlertTitle>
            <AlertDescription className="text-foreground">
              Ao salvar a nova senha, seu acesso será encerrado em todos os
              dispositivos para proteger a conta.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <KeyRound aria-hidden="true" className="size-4" />
              </div>
              <CardTitle className="text-base">Sua conta</CardTitle>
              <CardDescription className="break-words">
                {identidade.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <span className="text-muted-foreground">Perfil</span>
                <strong className="text-right font-medium">
                  {nomesPerfis[identidade.perfil]}
                </strong>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Use uma senha exclusiva, que você não utiliza em outros
                serviços.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
