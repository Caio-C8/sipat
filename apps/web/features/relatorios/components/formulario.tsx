"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  TipoEventoRelatorioSchema,
  type CatalogoOpcaoRelatorio,
  type CatalogoRelatoriosResponse,
  type TipoRelatorio,
} from "@repo/contracts";
import { FileSearch, Search } from "lucide-react";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { rotulo, rotuloOpcao, valor } from "../apresentacao";
import { SeletorRelatorio } from "./seletor";

type Seletor = {
  nome: string;
  label: string;
  catalogo: CatalogoOpcaoRelatorio;
  obrigatorio?: boolean;
};

const patrimonio: Seletor = {
  nome: "patrimonioId",
  label: "Patrimônio",
  catalogo: "patrimonios",
};
const comissao: Seletor = {
  nome: "comissaoId",
  label: "Comissão",
  catalogo: "comissoes",
};
const seletores: Record<TipoRelatorio, Seletor[]> = {
  patrimonios: [
    patrimonio,
    { nome: "setorId", label: "Setor atual", catalogo: "setores" },
    {
      nome: "responsavelId",
      label: "Responsável atual",
      catalogo: "responsaveis",
    },
    { nome: "naturezaId", label: "Natureza", catalogo: "naturezas" },
    { nome: "especieId", label: "Espécie", catalogo: "especies" },
  ],
  "ficha-bem": [{ ...patrimonio, obrigatorio: true }],
  movimentacoes: [
    patrimonio,
    { nome: "setorOrigemId", label: "Setor de origem", catalogo: "setores" },
    {
      nome: "setorDestinoId",
      label: "Setor de destino",
      catalogo: "setores",
    },
    comissao,
  ],
  manutencoes: [
    patrimonio,
    {
      nome: "fornecedorId",
      label: "Fornecedor do item",
      catalogo: "fornecedores",
    },
  ],
  depreciacoes: [patrimonio, comissao],
  "pendencias-depreciacao": [patrimonio],
  reavaliacoes: [patrimonio, comissao],
  inventarios: [
    {
      nome: "inventarioId",
      label: "Inventário",
      catalogo: "inventarios",
      obrigatorio: true,
    },
    patrimonio,
    {
      nome: "setorEsperadoId",
      label: "Setor esperado",
      catalogo: "setores",
    },
    {
      nome: "setorEncontradoId",
      label: "Setor encontrado",
      catalogo: "setores",
    },
  ],
  emprestimos: [patrimonio],
  baixas: [patrimonio, comissao],
};

const escolhas: Record<TipoRelatorio, Record<string, string[]>> = {
  patrimonios: {
    status: ["ATIVO", "BAIXADO", "EMPRESTADO", "EM_MANUTENCAO"],
    tipoNumero: ["OFICIAL", "SEM_NUMERO_OFICIAL"],
    ordenacao: ["NUMERO", "TOMBAMENTO"],
  },
  "ficha-bem": { evento: [...TipoEventoRelatorioSchema.options] },
  movimentacoes: { origem: ["COMUM", "CORRECAO_INVENTARIO"] },
  manutencoes: {
    base: ["ENVIO", "RETORNO"],
    tipo: ["PREVENTIVA", "CORRETIVA"],
    situacao: ["PENDENTE", "RETORNADO"],
  },
  depreciacoes: {},
  "pendencias-depreciacao": {},
  reavaliacoes: { base: ["REGISTRO", "REFERENCIA"] },
  inventarios: {
    verificacao: ["VERIFICADO", "PENDENTE"],
    situacao: ["CORRETO", "DIVERGENCIA", "NAO_LOCALIZADO"],
    correcao: ["CORRIGIDO", "PENDENTE"],
    correcaoPosterior: ["CORRIGIDO", "PENDENTE"],
  },
  emprestimos: {
    base: ["SAIDA", "PREVISAO", "DEVOLUCAO"],
    situacao: ["PENDENTE", "DEVOLVIDO"],
    emAtraso: ["true", "false"],
  },
  baixas: {
    tipo: [
      "ALIENACAO",
      "INUTILIZACAO",
      "SINISTRO",
      "FURTO",
      "EXTRAVIO",
      "TRANSFERENCIA",
      "RECLASSIFICACAO",
      "ABANDONO",
      "ERRO_REGISTRO",
      "OUTRO",
    ],
  },
};

function textoOrientacao(tipo: TipoRelatorio) {
  if (tipo === "patrimonios")
    return "Cadastro e valores atuais, incluindo bens baixados. Tombamento não reconstrói posição em data passada.";
  if (tipo === "inventarios")
    return "Escolha o inventário. Conferência incompleta não significa ausência de inconsistências.";
  if (tipo === "pendencias-depreciacao")
    return "Exibe somente obrigações ainda não processadas. A competência é opcional.";
  return "Quando não há cópia histórica, os nomes exibidos vêm do cadastro atual.";
}

export function FormularioRelatorios({
  catalogo,
  tipoInicial,
  valores,
  diaAtual,
  usuario,
  children,
}: {
  catalogo: CatalogoRelatoriosResponse;
  tipoInicial: TipoRelatorio;
  valores: Record<string, string>;
  diaAtual: string;
  usuario: string;
  children: ReactNode;
}) {
  const tipo = tipoInicial;
  const [q, setQ] = useState(valores);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!erroGeral) return;
    feedbackRef.current?.scrollIntoView({ block: "center" });
    feedbackRef.current?.focus();
  }, [erroGeral]);

  const registrarNome = useCallback(
    (nome: string, rotuloSelecionado: string) =>
      setNomes((atual) =>
        atual[nome] === rotuloSelecionado
          ? atual
          : { ...atual, [nome]: rotuloSelecionado },
      ),
    [],
  );
  const padrao = (nome: string) =>
    nome === "inicio"
      ? `${diaAtual.slice(0, 7)}-01`
      : nome === "fim"
        ? diaAtual
        : nome.startsWith("competencia")
          ? diaAtual.slice(0, 7)
          : nome === "base"
            ? (escolhas[tipo].base?.[0] ?? "")
            : nome === "ordenacao"
              ? "NUMERO"
              : "";
  const mudar = (nome: string, proximoValor: string) => {
    setQ((atual) => ({ ...atual, [nome]: proximoValor }));
    setErros((atual) => {
      if (!atual[nome]) return atual;
      const proximo = { ...atual };
      delete proximo[nome];
      return proximo;
    });
    setErroGeral("");
    setDirty(true);
  };
  const opcionalPeriodo =
    tipo === "patrimonios" || tipo === "ficha-bem" || tipo === "baixas";
  const competenciaOpcional =
    tipo === "depreciacoes" || tipo === "pendencias-depreciacao";
  const camposTemporais = competenciaOpcional
    ? ["competencia"]
    : ["inicio", "fim"];
  const extraTexto =
    tipo === "manutencoes"
      ? ["pedidoId"]
      : tipo === "emprestimos"
        ? ["grupoId", "destinatario"]
        : [];
  const atual = catalogo.dados.tipos.find((item) => item.tipo === tipo)!;

  function enviar(event: FormEvent<HTMLFormElement>) {
    const obrigatoriosAusentes = seletores[tipo].filter(
      (seletor) => seletor.obrigatorio && !q[seletor.nome],
    );
    if (obrigatoriosAusentes.length > 0) {
      event.preventDefault();
      setErros(
        Object.fromEntries(
          obrigatoriosAusentes.map((seletor) => [
            seletor.nome,
            `Selecione ${seletor.label.toLocaleLowerCase("pt-BR")}.`,
          ]),
        ),
      );
      setErroGeral("Revise os campos indicados antes de gerar a prévia.");
      window.setTimeout(() => {
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }
    setSubmitting(true);
  }

  return (
    <>
      {erroGeral ? (
        <Alert
          ref={feedbackRef}
          tabIndex={-1}
          variant="destructive"
          className="scroll-mt-4"
        >
          <AlertTitle>Não foi possível gerar a prévia</AlertTitle>
          <AlertDescription>{erroGeral}</AlertDescription>
        </Alert>
      ) : null}
      <Card asChild className="min-w-0 gap-4">
        <form
          action="/relatorios"
          method="get"
          aria-label="Filtros do relatório"
          onSubmit={enviar}
        >
          <input type="hidden" name="consultar" value="1" />
          <input type="hidden" name="relatorio" value={tipo} />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-4 text-interactive" />
              Filtros do relatório
            </CardTitle>
            <CardDescription>{textoOrientacao(tipo)}</CardDescription>
            {atual.motivo ? (
              <Alert>
                <AlertDescription>{atual.motivo}</AlertDescription>
              </Alert>
            ) : null}
          </CardHeader>
          <CardContent className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <div className="grid min-w-0 gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {tipo !== "inventarios" &&
                  camposTemporais.map((nome) => {
                    const required = !opcionalPeriodo && !competenciaOpcional;
                    return (
                      <TextField
                        key={nome}
                        id={`filtro-${nome}`}
                        name={nome}
                        type={nome.startsWith("competencia") ? "month" : "date"}
                        label={rotulo(nome)}
                        description={
                          competenciaOpcional
                            ? "Opcional"
                            : opcionalPeriodo
                              ? "Opcional; informe as duas datas para filtrar o período."
                              : undefined
                        }
                        required={required}
                        value={
                          q[nome] ??
                          (opcionalPeriodo || competenciaOpcional
                            ? ""
                            : padrao(nome))
                        }
                        onChange={(event) => mudar(nome, event.target.value)}
                      />
                    );
                  })}
                {Object.entries(escolhas[tipo]).map(([nome, opcoes]) => {
                  const required = nome === "base" || nome === "ordenacao";
                  const selecionado = q[nome] ?? padrao(nome);
                  const valorSelect = selecionado || "__todos__";
                  return (
                    <div key={nome} className="min-w-0">
                      <input type="hidden" name={nome} value={selecionado} />
                      <SelectField
                        id={`filtro-${nome}`}
                        label={rotulo(nome)}
                        required={required}
                        value={valorSelect}
                        onValueChange={(proximo) =>
                          mudar(nome, proximo === "__todos__" ? "" : proximo)
                        }
                        options={[
                          ...(required
                            ? []
                            : [{ value: "__todos__", label: "Todos" }]),
                          ...opcoes.map((opcao) => ({
                            value: opcao,
                            label:
                              opcao === "true"
                                ? "Sim"
                                : opcao === "false"
                                  ? "Não"
                                  : rotuloOpcao(opcao),
                          })),
                        ]}
                      />
                    </div>
                  );
                })}
                {extraTexto.map((nome) => (
                  <TextField
                    key={nome}
                    id={`filtro-${nome}`}
                    name={nome}
                    label={rotulo(nome)}
                    description="Opcional"
                    value={q[nome] ?? ""}
                    maxLength={nome.endsWith("Id") ? 36 : 200}
                    onChange={(event) => mudar(nome, event.target.value)}
                  />
                ))}
                {seletores[tipo].map((seletor) => (
                  <SeletorRelatorio
                    key={`${tipo}-${seletor.nome}`}
                    {...seletor}
                    tipo={tipo}
                    valor={q[seletor.nome] ?? ""}
                    onChange={(proximo) => mudar(seletor.nome, proximo)}
                    onLabel={registrarNome}
                    error={erros[seletor.nome]}
                  />
                ))}
              </div>
            </div>
            <Card className="h-fit gap-3 bg-muted/40 p-4 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="text-base">Resumo da seleção</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Relatório</dt>
                    <dd className="font-medium">{atual.titulo}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Emitido por</dt>
                    <dd>{usuario}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Documento</dt>
                    <dd>PDF · conjunto filtrado completo</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Filtros selecionados
                    </dt>
                    <dd className="break-words">
                      {Object.entries(q)
                        .filter(
                          ([chave, dado]) =>
                            ![
                              "relatorio",
                              "consultar",
                              "pagina",
                              "limite",
                              "busca",
                            ].includes(chave) && dado,
                        )
                        .map(
                          ([chave, dado]) =>
                            `${rotulo(chave)}: ${nomes[chave] ?? valor(dado)}`,
                        )
                        .join(" · ") || "Sem filtros opcionais"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm lg:col-span-2">
              <h2 className="font-semibold">Informações incluídas</h2>
              <p className="mt-1 text-muted-foreground">
                Identificação do relatório, filtros aplicados, data de emissão,
                registros, totais disponíveis e avisos.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto lg:col-span-2 lg:justify-self-end"
              disabled={submitting || !atual.disponivel}
            >
              <FileSearch aria-hidden="true" />
              {submitting ? "Gerando prévia…" : "Gerar prévia"}
            </Button>
          </CardContent>
        </form>
      </Card>
      {dirty ? (
        <Alert>
          <AlertTitle>Filtros alterados</AlertTitle>
          <AlertDescription>
            Gere uma nova prévia antes de abrir ou baixar o PDF.
          </AlertDescription>
        </Alert>
      ) : (
        children
      )}
    </>
  );
}
