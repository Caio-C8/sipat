import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nomesPerfis } from "@/lib/navigation/system-navigation";

function obterIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("");
}

function Dado({
  rotulo,
  children,
}: Readonly<{
  rotulo: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-w-0 gap-1 rounded-lg bg-muted/60 p-4">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="m-0 break-words font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}

export function MinhaConta({
  identidade,
}: Readonly<{
  identidade: IdentidadeAutenticada;
}>) {
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-5 sm:px-6 sm:py-6 min-[1500px]:gap-6 min-[1500px]:px-8">
      <PageHeader
        title="Minha conta"
        description="Consulte seus dados de acesso e mantenha sua conta protegida."
      />

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <Card asChild className="min-w-0">
          <section aria-labelledby="dados-conta-titulo">
            <CardHeader className="sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-4">
              <div
                aria-hidden="true"
                className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground sm:row-span-3"
              >
                {obterIniciais(identidade.nome)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle id="dados-conta-titulo" className="text-lg">
                  {identidade.nome}
                </CardTitle>
                <Badge variant="secondary">
                  <ShieldCheck aria-hidden="true" data-icon="inline-start" />
                  Conta ativa
                </Badge>
              </div>
              <CardDescription className="break-words">
                {identidade.email}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                <Dado rotulo="Nome completo">
                  <span className="inline-flex items-center gap-2">
                    <UserRound
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                    {identidade.nome}
                  </span>
                </Dado>
                <Dado rotulo="Perfil">{nomesPerfis[identidade.perfil]}</Dado>
                <Dado rotulo="E-mail de acesso">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Mail
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="break-all">{identidade.email}</span>
                  </span>
                </Dado>
                <Dado rotulo="Situação">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    Ativa
                  </span>
                </Dado>
              </dl>
            </CardContent>
          </section>
        </Card>

        <Card asChild>
          <section aria-labelledby="seguranca-conta-titulo">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-interactive">
                <KeyRound aria-hidden="true" className="size-5" />
              </div>
              <CardTitle id="seguranca-conta-titulo" className="text-lg">
                Segurança da conta
              </CardTitle>
              <CardDescription>
                A mesma senha é usada no computador e no celular.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Alert className="border-brand-gold/50 bg-brand-gold-light/15">
                <ShieldCheck aria-hidden="true" />
                <AlertTitle>Troca segura de senha</AlertTitle>
                <AlertDescription className="text-foreground">
                  Ao alterar a senha, você precisará entrar novamente em todos
                  os dispositivos.
                </AlertDescription>
              </Alert>

              <Button asChild size="lg" className="w-full sm:w-fit lg:w-full">
                <Link href="/minha-conta/alterar-senha">
                  Alterar senha
                  <ArrowRight aria-hidden="true" data-icon="inline-end" />
                </Link>
              </Button>

              <p className="text-sm leading-6 text-muted-foreground">
                Não lembra sua senha?{" "}
                <Link
                  href="/esqueci-senha"
                  className="font-medium text-interactive underline underline-offset-4 hover:text-primary"
                >
                  Inicie a recuperação de acesso.
                </Link>
              </p>
            </CardContent>
          </section>
        </Card>
      </div>
    </main>
  );
}
