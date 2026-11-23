"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CatalogoOpcaoRelatorio,
  OpcoesRelatorioResponse,
  TipoRelatorio,
} from "@repo/contracts";
import { ComboboxField } from "@/components/shared/form-fields";
import { useOpcoesRelatorio } from "../api/hooks";
import { mensagemRelatorio } from "../apresentacao";

function SeletorFiltroRelatorio({
  nome,
  label,
  catalogo,
  tipo,
  valor,
  onChange,
}: {
  nome: string;
  label: string;
  catalogo: CatalogoOpcaoRelatorio;
  tipo: TipoRelatorio;
  valor: string;
  onChange: (valor: string) => void;
}) {
  const carregar = useOpcoesRelatorio(catalogo, tipo);
  const [busca, setBusca] = useState("");
  const [resposta, setResposta] = useState<OpcoesRelatorioResponse | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  const [rotuloSelecionado, setRotuloSelecionado] = useState("");
  const requisicaoAtual = useRef(0);

  useEffect(() => {
    if (!valor) return;
    let ativo = true;
    void carregar(valor, 1)
      .then((resultado) => {
        if (!ativo) return;
        setRotuloSelecionado(
          resultado.dados.find((item) => item.id === valor)?.rotulo ??
            "Opção selecionada",
        );
      })
      .catch(() => {
        if (ativo) setRotuloSelecionado("Opção selecionada");
      });
    return () => {
      ativo = false;
    };
  }, [carregar, valor]);

  useEffect(() => {
    const id = ++requisicaoAtual.current;
    const temporizador = window.setTimeout(() => {
      setPending(true);
      setErro("");
      void carregar(busca.trim(), 1)
        .then((resultado) => {
          if (id === requisicaoAtual.current) setResposta(resultado);
        })
        .catch((e: unknown) => {
          if (id === requisicaoAtual.current) setErro(mensagemRelatorio(e));
        })
        .finally(() => {
          if (id === requisicaoAtual.current) setPending(false);
        });
    }, 250);
    return () => window.clearTimeout(temporizador);
  }, [busca, carregar]);

  return (
    <ComboboxField
      id={`filtro-${nome}`}
      name={nome}
      label={label}
      value={valor}
      onValueChange={onChange}
      onSearchChange={setBusca}
      options={[
        { value: "", label: "Todos" },
        ...(valor && !resposta?.dados.some((item) => item.id === valor)
          ? [
              {
                value: valor,
                label: rotuloSelecionado || "Carregando opção selecionada…",
              },
            ]
          : []),
        ...(resposta?.dados.map((item) => ({
          value: item.id,
          label: item.rotulo,
        })) ?? []),
      ]}
      loading={pending}
      placeholder="Todos"
      searchPlaceholder={`Buscar ${label.toLocaleLowerCase("pt-BR")}…`}
      emptyText="Nenhum registro encontrado."
      error={erro || undefined}
    />
  );
}

export { SeletorFiltroRelatorio };
