"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import type {
  ListarPatrimoniosResponse,
  PatrimonioResumo,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ComboboxField } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { browserPatrimonioOperations } from "@/features/patrimonios/api/browser-patrimonio-operations";
import { BaixaFormulario } from "./baixa-formulario";

export function NovaBaixa({
  resposta,
}: {
  resposta: ListarPatrimoniosResponse;
}) {
  const router = useRouter();
  const [lista, setLista] = useState(resposta);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<PatrimonioResumo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState("");
  const requisicaoAtual = useRef(0);

  useEffect(() => {
    const id = ++requisicaoAtual.current;
    const temporizador = window.setTimeout(() => {
      setCarregando(true);
      setErroConsulta("");
      void browserPatrimonioOperations
        .listar(
          {
            status: "ATIVO",
            pagina: "1",
            limite: "50",
            ...(busca.trim() ? { busca: busca.trim() } : {}),
          },
          {},
        )
        .then((resultado) => {
          if (id === requisicaoAtual.current) setLista(resultado);
        })
        .catch(() => {
          if (id === requisicaoAtual.current)
            setErroConsulta(
              "Não foi possível consultar os patrimônios ativos.",
            );
        })
        .finally(() => {
          if (id === requisicaoAtual.current) setCarregando(false);
        });
    }, 250);
    return () => window.clearTimeout(temporizador);
  }, [busca]);

  const opcoes = [
    ...(selecionado && !lista.dados.some((item) => item.id === selecionado.id)
      ? [selecionado]
      : []),
    ...lista.dados,
  ].map((patrimonio) => ({
    value: patrimonio.id,
    label: `${patrimonio.numeroPatrimonio} · ${patrimonio.descricao}`,
  }));

  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-5 p-4 text-foreground sm:p-7">
      <PageHeader
        title="Registrar baixa"
        description="Selecione um patrimônio ativo e preencha os dados da baixa unitária."
        actions={
          <Button asChild variant="outline">
            <Link href="/baixas">
              <ArrowLeft aria-hidden="true" /> Voltar à consulta
            </Link>
          </Button>
        }
      />

      <Card className="border-interactive/35 bg-interactive/5 p-4 shadow-none sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <PackageSearch
            aria-hidden="true"
            className="mt-0.5 size-5 text-interactive"
          />
          <div>
            <h2 className="font-bold">Bem que será baixado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A baixa é individual. Pesquise pelo número ou pela descrição do
              patrimônio.
            </p>
          </div>
        </div>
        <ComboboxField
          id="patrimonio-baixa"
          label="Patrimônio para baixa"
          required
          value={selecionado?.id ?? ""}
          onValueChange={(id) =>
            setSelecionado(
              id === selecionado?.id
                ? selecionado
                : (lista.dados.find((item) => item.id === id) ?? null),
            )
          }
          onSearchChange={setBusca}
          options={opcoes}
          loading={carregando}
          placeholder="Selecione um patrimônio ativo"
          searchPlaceholder="Buscar número ou descrição…"
          emptyText="Nenhum patrimônio ativo encontrado."
          error={erroConsulta || undefined}
        />
      </Card>

      {selecionado ? (
        <BaixaFormulario
          key={selecionado.id}
          patrimonio={selecionado}
          onCancelar={() => setSelecionado(null)}
          onSuccess={() => {
            toast.success("Patrimônio baixado com sucesso.");
            router.replace("/baixas");
          }}
        />
      ) : (
        <Card className="p-6 text-center text-sm text-muted-foreground shadow-none">
          Selecione o patrimônio acima para preencher os dados e confirmar a
          baixa.
        </Card>
      )}
    </main>
  );
}
