"use client";
import { useEffect, useState } from "react";
import type { CatalogoOpcaoRelatorio, TipoRelatorio } from "@repo/contracts";
import { rotulo, valor } from "../apresentacao";
import { useOpcoesRelatorio } from "../api/hooks";
import { Badge } from "@/components/ui/badge";

const catalogos: Record<string, CatalogoOpcaoRelatorio> = {
  patrimonioId: "patrimonios",
  setorId: "setores",
  setorOrigemId: "setores",
  setorDestinoId: "setores",
  setorEsperadoId: "setores",
  setorEncontradoId: "setores",
  responsavelId: "responsaveis",
  naturezaId: "naturezas",
  especieId: "especies",
  comissaoId: "comissoes",
  fornecedorId: "fornecedores",
  inventarioId: "inventarios",
};

function Filtro({
  tipo,
  nome,
  dado,
}: {
  tipo: TipoRelatorio;
  nome: string;
  dado: string;
}) {
  const catalogo = catalogos[nome];
  const carregar = useOpcoesRelatorio(catalogo ?? "patrimonios", tipo);
  const [descricao, setDescricao] = useState("");
  useEffect(() => {
    if (!catalogo) return;
    let ativo = true;
    void carregar(dado, 1)
      .then((resultado) => {
        if (ativo)
          setDescricao(
            resultado.dados.find((item) => item.id === dado)?.rotulo ??
              "Opção não encontrada",
          );
      })
      .catch(() => {
        if (ativo) setDescricao("Nome indisponível");
      });
    return () => {
      ativo = false;
    };
  }, [carregar, catalogo, dado]);
  return (
    <span>
      {rotulo(nome)}: {catalogo ? descricao || "Carregando nome…" : valor(dado)}
    </span>
  );
}

export function FiltrosAplicados({
  tipo,
  filtros,
}: {
  tipo: TipoRelatorio;
  filtros: Record<string, string>;
}) {
  const lista = Object.entries(filtros).filter(
    ([nome]) => nome !== "pagina" && nome !== "limite",
  );
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <strong className="text-foreground">Filtros aplicados</strong>
      <div className="mt-2 flex flex-wrap gap-2 break-words">
        {lista.length === 0
          ? "Todos os registros"
          : lista.map(([nome, dado]) => (
              <Badge key={nome} variant="outline" className="h-auto py-1">
                <Filtro tipo={tipo} nome={nome} dado={dado} />
              </Badge>
            ))}
      </div>
    </div>
  );
}
