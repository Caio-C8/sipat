"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CatalogoOpcaoRelatorio,
  OpcoesRelatorioResponse,
  TipoRelatorio,
} from "@repo/contracts";
import { ComboboxField } from "@/components/shared/form-fields";
import { useOpcoesRelatorio } from "../api/hooks";
import { mensagemRelatorio } from "../apresentacao";

export function SeletorRelatorio({
  nome,
  label,
  catalogo,
  tipo,
  valor,
  onChange,
  onLabel,
  obrigatorio = false,
  error,
}: {
  nome: string;
  label: string;
  catalogo: CatalogoOpcaoRelatorio;
  tipo: TipoRelatorio;
  valor: string;
  onChange: (v: string) => void;
  onLabel?: (nome: string, rotulo: string) => void;
  obrigatorio?: boolean;
  error?: string;
}) {
  const carregar = useOpcoesRelatorio(catalogo, tipo);
  const [busca, setBusca] = useState("");
  const [resposta, setResposta] = useState<OpcoesRelatorioResponse | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [erroConsulta, setErroConsulta] = useState("");
  const [rotuloSelecionado, setRotuloSelecionado] = useState("");
  const requisicaoAtual = useRef(0);

  useEffect(() => {
    if (!valor) return;
    let ativo = true;
    const controller = new AbortController();
    void carregar(valor, 1, controller.signal)
      .then((resultado) => {
        if (!ativo) return;
        const rotulo =
          resultado.dados.find((item) => item.id === valor)?.rotulo ??
          "Opção não encontrada";
        setRotuloSelecionado(rotulo);
        onLabel?.(nome, rotulo);
      })
      .catch(() => {
        if (ativo) setRotuloSelecionado("Nome indisponível");
      });
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [carregar, nome, onLabel, valor]);

  useEffect(() => {
    const id = ++requisicaoAtual.current;
    const controller = new AbortController();
    const temporizador = window.setTimeout(() => {
      setPending(true);
      setErroConsulta("");
      void carregar(busca.trim(), 1, controller.signal)
        .then((resultado) => {
          if (id === requisicaoAtual.current) setResposta(resultado);
        })
        .catch((erro: unknown) => {
          if (id === requisicaoAtual.current && !controller.signal.aborted)
            setErroConsulta(mensagemRelatorio(erro));
        })
        .finally(() => {
          if (id === requisicaoAtual.current) setPending(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(temporizador);
      controller.abort();
    };
  }, [busca, carregar]);

  const opcoes = useMemo(() => {
    const atuais =
      resposta?.dados.map((item) => ({ value: item.id, label: item.rotulo })) ??
      [];
    const selecionada =
      valor && !atuais.some((item) => item.value === valor)
        ? [
            {
              value: valor,
              label: rotuloSelecionado || "Carregando opção selecionada…",
            },
          ]
        : [];
    return [
      ...(obrigatorio ? [] : [{ value: "", label: "Todos" }]),
      ...selecionada,
      ...atuais,
    ];
  }, [obrigatorio, resposta, rotuloSelecionado, valor]);

  return (
    <div className="grid min-w-0 gap-2">
      <ComboboxField
        id={`filtro-${nome}`}
        name={nome}
        label={label}
        description={obrigatorio ? undefined : "Filtro opcional"}
        required={obrigatorio}
        error={error || erroConsulta || undefined}
        value={valor}
        onValueChange={(proximo) => {
          onChange(proximo);
          const rotulo = opcoes.find((item) => item.value === proximo)?.label;
          if (rotulo) onLabel?.(nome, rotulo);
        }}
        onSearchChange={(proximaBusca) => {
          setBusca(proximaBusca);
        }}
        options={opcoes}
        loading={pending}
        placeholder={obrigatorio ? `Selecione ${label.toLowerCase()}` : "Todos"}
        searchPlaceholder={`Buscar ${label.toLocaleLowerCase("pt-BR")}…`}
        emptyText="Nenhum registro encontrado."
      />
    </div>
  );
}
