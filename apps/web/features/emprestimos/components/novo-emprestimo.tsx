"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CriarEmprestimoBodySchema,
  LIMITE_ITENS_EMPRESTIMO,
  type CriarEmprestimoResponse,
  type ListarOpcoesComissoesEmprestimoResponse,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { TextareaField, TextField } from "@/components/shared/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { AlertaIdempotencia } from "@/components/alerta-idempotencia";
import { isApiError } from "@/lib/api/core/api-error";
import {
  decidirAposFalha,
  isConflitoIdempotencia,
  obterTentativaIdempotente,
  tentativaAposFalha,
  type DecisaoIdempotencia,
  type TentativaIdempotente,
} from "@/lib/api/core/idempotencia";
import { useCriarEmprestimo, usePatrimoniosEmprestimo } from "../api/hooks";
import {
  botaoPrimarioEmprestimo,
  dataExibicao,
  detalhesErroEmprestimo,
  hojeSaoPaulo,
  mensagemEmprestimo,
  painelEmprestimo,
} from "../apresentacao";
import { SeletorComissaoEmprestimo } from "./seletor-comissao";

type Bem = {
  id: string;
  numeroPatrimonio: string;
  descricao: string;
  setor: { id: string; nome: string };
};
type Comissao = ListarOpcoesComissoesEmprestimoResponse["dados"][number];
type Etapa = "cadastro" | "selecionar" | "revisao" | "resultado";

export function NovoEmprestimo({
  usuario,
}: {
  usuario: { nome: string; perfil: string };
}) {
  const bens = usePatrimoniosEmprestimo();
  const criacao = useCriarEmprestimo();
  const [etapa, setEtapa] = useState<Etapa>("cadastro");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [selecionados, setSelecionados] = useState<Bem[]>([]);
  const [modo, setModo] = useState<"EM_GRUPO" | "SEPARADAMENTE">("EM_GRUPO");
  const [destinatario, setDestinatario] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEmprestimo, setDataEmprestimo] = useState(hojeSaoPaulo);
  const [dataPrevistaDevolucao, setDataPrevistaDevolucao] =
    useState(hojeSaoPaulo);
  const [comissaoId, setComissaoId] = useState("");
  const [comissao, setComissao] = useState<Comissao | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState("");
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const [resultado, setResultado] = useState<CriarEmprestimoResponse | null>(
    null,
  );
  const chaveAnterior = useRef<TentativaIdempotente | null>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const carregarBens = bens.carregar;

  useEffect(() => {
    if (etapa === "selecionar")
      void carregarBens({
        pagina: String(pagina),
        limite: "20",
        ...(buscaAplicada ? { busca: buscaAplicada } : {}),
      });
  }, [carregarBens, pagina, buscaAplicada, etapa]);

  function alternar(bem: Bem) {
    setSelecionados((atuais) =>
      atuais.some((item) => item.id === bem.id)
        ? atuais.filter((item) => item.id !== bem.id)
        : atuais.length < LIMITE_ITENS_EMPRESTIMO
          ? [...atuais, bem]
          : atuais,
    );
  }
  const semChave = () => ({
    modoAgrupamento: modo,
    patrimonioIds: selecionados.map((bem) => bem.id),
    destinatario,
    finalidade,
    ...(observacao.trim() ? { observacao } : {}),
    dataEmprestimo,
    dataPrevistaDevolucao,
    comissaoId,
  });
  function revisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setAviso("");
    setDecisaoIdempotencia(null);
    // A chave abaixo serve apenas à validação local; não é guardada nem enviada.
    const validacao = CriarEmprestimoBodySchema.safeParse({
      ...semChave(),
      chaveIdempotencia: "00000000-0000-4000-8000-000000000000",
    });
    if (!validacao.success) {
      setAviso(
        validacao.error.issues[0]?.message ??
          "Confira os campos do formulário.",
      );
      requestAnimationFrame(() => avisoRef.current?.focus());
      return;
    }
    setEtapa("revisao");
  }
  async function confirmar() {
    setErro(null);
    setAviso("");
    setDecisaoIdempotencia(null);
    const dados = semChave();
    const corpo = JSON.stringify(dados);
    chaveAnterior.current = obterTentativaIdempotente(
      chaveAnterior.current,
      corpo,
    );
    const validacao = CriarEmprestimoBodySchema.safeParse({
      ...dados,
      chaveIdempotencia: chaveAnterior.current!.chave,
    });
    if (!validacao.success) {
      setAviso(
        validacao.error.issues[0]?.message ??
          "Confira os campos do formulário.",
      );
      requestAnimationFrame(() => avisoRef.current?.focus());
      return;
    }
    try {
      const resposta = await criacao.confirmar(validacao.data);
      if (resposta) {
        setResultado(resposta);
        setEtapa("resultado");
        setAviso("Empréstimo registrado com sucesso.");
        chaveAnterior.current = null;
        setDecisaoIdempotencia(null);
        requestAnimationFrame(() => avisoRef.current?.focus());
      }
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(isConflitoIdempotencia(e) ? decisao : null);
      chaveAnterior.current = tentativaAposFalha(chaveAnterior.current, e);
      if (decisao.atualizarConsultas)
        void carregarBens({
          pagina: String(pagina),
          limite: "20",
          ...(buscaAplicada ? { busca: buscaAplicada } : {}),
        });
      requestAnimationFrame(() => avisoRef.current?.focus());
    }
  }
  const alerta = (Boolean(aviso) || erro !== null) && (
    <div
      ref={avisoRef}
      tabIndex={-1}
      role={decisaoIdempotencia ? undefined : erro ? "alert" : "status"}
      className={
        decisaoIdempotencia
          ? "outline-none"
          : `rounded-md p-4 ${erro ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"}`
      }
    >
      {erro && decisaoIdempotencia ? (
        <AlertaIdempotencia
          erro={erro}
          decisao={decisaoIdempotencia}
          destino={{ href: "/emprestimos", rotulo: "Consultar empréstimos" }}
        />
      ) : (
        <p>{erro ? mensagemEmprestimo(erro) : aviso}</p>
      )}
      {isApiError(erro) &&
        [
          "PATRIMONIO_NAO_ATIVO",
          "CONFLITO_CONCORRENTE_EMPRESTIMO",
          "EMPRESTIMO_IMPEDIDO",
        ].includes(erro.codigo) && (
          <p className="mt-2">
            Revise os bens selecionados antes de confirmar novamente. A seleção
            foi preservada.
          </p>
        )}
      {isApiError(erro) && !decisaoIdempotencia && erro.erros.length > 0 && (
        <ul className="mt-2 list-inside list-disc">
          {detalhesErroEmprestimo(erro, selecionados).map((detalhe, i) => (
            <li key={i}>{detalhe}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <PageHeader
        title={
          etapa === "selecionar"
            ? "Selecionar bens"
            : etapa === "revisao"
              ? "Revisar empréstimo"
              : etapa === "resultado"
                ? "Empréstimo registrado"
                : "Novo empréstimo"
        }
        description={
          etapa === "selecionar"
            ? "A consulta apresenta bens ativos elegíveis. A disponibilidade será conferida novamente ao registrar."
            : etapa === "revisao"
              ? "Confira os dados antes de registrar. A revisão não reserva os bens."
              : "Informe o destinatário, o período e os bens do empréstimo."
        }
        actions={
          <Link
            className="inline-flex rounded-md border border-[#dce5f0] px-4 py-2 text-sm font-semibold"
            href="/emprestimos"
          >
            Voltar à consulta
          </Link>
        }
      />
      {etapa === "selecionar" && (
        <>
          <form
            className={painelEmprestimo}
            onSubmit={(evento) => {
              evento.preventDefault();
              setPagina(1);
              setBuscaAplicada(busca.trim());
            }}
          >
            <div className="flex flex-wrap items-end gap-3">
              <TextField
                id="busca-patrimonio-emprestimo"
                label="Patrimônio ou descrição"
                fieldClassName="min-w-48 flex-1"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Número ou descrição"
              />
              <Button type="submit" className={botaoPrimarioEmprestimo}>
                Pesquisar
              </Button>
            </div>
          </form>
          <section
            className={painelEmprestimo}
            aria-labelledby="resultado-bens-title"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h2 id="resultado-bens-title" className="font-bold">
                Resultado da pesquisa
              </h2>
              <p className="text-sm font-semibold text-blue-700">
                {selecionados.length} de {LIMITE_ITENS_EMPRESTIMO} bens
                selecionados
              </p>
            </div>
            {bens.loading && (
              <p role="status" className="mt-4">
                Carregando bens...
              </p>
            )}
            {bens.erro !== null && (
              <p role="alert" className="mt-4 text-red-800">
                {mensagemEmprestimo(bens.erro)}
              </p>
            )}
            {bens.dados &&
              !bens.loading &&
              (bens.dados.dados.length ? (
                <Table
                  className="min-w-[620px]"
                  containerClassName="mt-4"
                  containerProps={{
                    role: "region",
                    "aria-label": "Bens elegíveis",
                    tabIndex: 0,
                  }}
                >
                  <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                    <TableRow>
                      <TableHead className="p-3" scope="col">
                        Selecionar
                      </TableHead>
                      <TableHead className="p-3" scope="col">
                        Patrimônio / descrição
                      </TableHead>
                      <TableHead className="p-3" scope="col">
                        Setor
                      </TableHead>
                      <TableHead className="p-3" scope="col">
                        Situação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bens.dados.dados.map((bem) => {
                      const escolhido = selecionados.some(
                        (item) => item.id === bem.id,
                      );
                      return (
                        <TableRow key={bem.id}>
                          <TableCell className="p-3">
                            <Checkbox
                              aria-label={`Selecionar ${bem.numeroPatrimonio}`}
                              checked={escolhido}
                              disabled={
                                criacao.pending ||
                                (selecionados.length >=
                                  LIMITE_ITENS_EMPRESTIMO &&
                                  !escolhido)
                              }
                              onCheckedChange={() => alternar(bem)}
                            />
                          </TableCell>
                          <TableCell className="p-3 whitespace-normal">
                            <strong>{bem.numeroPatrimonio}</strong>
                            <p className="text-muted-foreground">
                              {bem.descricao}
                            </p>
                          </TableCell>
                          <TableCell className="p-3">
                            {bem.setor.nome}
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="secondary">Ativo · elegível</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="mt-4">Nenhum bem elegível encontrado.</p>
              ))}
            {bens.dados && (
              <nav
                className="mt-4 flex flex-wrap gap-4 text-sm"
                aria-label="Paginação dos bens"
              >
                <span>
                  Página {bens.dados.meta.pagina} de{" "}
                  {bens.dados.meta.ultimaPagina}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((n) => n - 1)}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagina >= bens.dados.meta.ultimaPagina}
                  onClick={() => setPagina((n) => n + 1)}
                >
                  Próxima
                </Button>
              </nav>
            )}
          </section>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEtapa("cadastro")}
            >
              Voltar ao cadastro
            </Button>
            <Button
              type="button"
              className={botaoPrimarioEmprestimo}
              onClick={() => setEtapa("cadastro")}
            >
              Confirmar seleção ({selecionados.length})
            </Button>
          </div>
        </>
      )}
      {etapa === "cadastro" && (
        <form onSubmit={revisar} className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <section className={painelEmprestimo}>
              <h2 className="mb-4 font-bold">Destino e período</h2>
              <div className="grid gap-4">
                <TextField
                  id="destinatario-emprestimo"
                  label="Destinatário"
                  required
                  maxLength={200}
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  placeholder="Pessoa ou instituição"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="data-emprestimo"
                    label="Data do empréstimo"
                    type="date"
                    required
                    max={hojeSaoPaulo()}
                    value={dataEmprestimo}
                    onChange={(e) => {
                      setDataEmprestimo(e.target.value);
                      setComissaoId("");
                      setComissao(null);
                    }}
                  />
                  <TextField
                    id="data-prevista-devolucao"
                    label="Previsão de devolução"
                    type="date"
                    required
                    min={dataEmprestimo}
                    value={dataPrevistaDevolucao}
                    onChange={(e) => setDataPrevistaDevolucao(e.target.value)}
                  />
                </div>
                <TextField
                  id="finalidade-emprestimo"
                  label="Finalidade"
                  required
                  maxLength={2000}
                  value={finalidade}
                  onChange={(e) => setFinalidade(e.target.value)}
                />
                <TextareaField
                  id="observacao-emprestimo"
                  label="Observação (opcional)"
                  maxLength={2000}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </section>
            <section className={painelEmprestimo}>
              <h2 className="mb-4 font-bold">Comissão e registro</h2>
              <SeletorComissaoEmprestimo
                dataReferencia={dataEmprestimo}
                rotulo="Comissão vigente na data do empréstimo"
                value={comissaoId}
                onChange={setComissaoId}
                onSelecionar={setComissao}
                selecionada={comissao}
              />
              <fieldset className="mt-5 grid gap-2 border-t border-border pt-5 text-sm">
                <legend className="font-semibold">Forma de registro</legend>
                <RadioGroup
                  value={modo}
                  onValueChange={(value) =>
                    setModo(value as "EM_GRUPO" | "SEPARADAMENTE")
                  }
                >
                  <label className="flex items-start gap-2">
                    <RadioGroupItem value="EM_GRUPO" />
                    <span>
                      Em grupo
                      <small className="block text-muted-foreground">
                        Todos os bens no mesmo empréstimo.
                      </small>
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <RadioGroupItem value="SEPARADAMENTE" />
                    <span>
                      Separadamente
                      <small className="block text-muted-foreground">
                        Um registro para cada bem.
                      </small>
                    </span>
                  </label>
                </RadioGroup>
              </fieldset>
              <dl className="mt-6 text-sm">
                <dt className="text-[#526580]">Registrado por</dt>
                <dd className="mt-1 font-semibold">{usuario.nome}</dd>
                <dd className="mt-1 text-[#526580]">Diretor de Patrimônio</dd>
              </dl>
              <p className="mt-5 text-xs text-[#526580]">
                A autoria será vinculada à pessoa autenticada no momento da
                confirmação.
              </p>
            </section>
          </div>
          <section className={painelEmprestimo}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">
                Bens do empréstimo · {selecionados.length}
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapa("selecionar")}
              >
                Alterar seleção
              </Button>
            </div>
            {selecionados.length ? (
              <Table
                className="min-w-[570px]"
                containerClassName="mt-4"
                containerProps={{
                  role: "region",
                  "aria-label": "Bens selecionados",
                  tabIndex: 0,
                }}
              >
                <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                  <TableRow>
                    <TableHead className="p-3" scope="col">
                      Patrimônio
                    </TableHead>
                    <TableHead className="p-3" scope="col">
                      Descrição
                    </TableHead>
                    <TableHead className="p-3" scope="col">
                      Setor
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selecionados.map((bem) => (
                    <TableRow key={bem.id}>
                      <TableCell className="p-3 font-semibold">
                        {bem.numeroPatrimonio}
                      </TableCell>
                      <TableCell className="p-3 whitespace-normal">
                        {bem.descricao}
                      </TableCell>
                      <TableCell className="p-3">{bem.setor.nome}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="mt-4 text-sm text-[#526580]">
                Nenhum bem selecionado. Use “Alterar seleção” para escolher bens
                elegíveis.
              </p>
            )}
          </section>
          <div className="flex justify-end">
            <Button
              type="submit"
              className={botaoPrimarioEmprestimo}
              disabled={selecionados.length === 0 || !comissaoId}
            >
              Revisar empréstimo
            </Button>
          </div>
        </form>
      )}
      {etapa === "revisao" && (
        <>
          <section className={painelEmprestimo}>
            <h2 className="font-bold">Dados da saída</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-[#526580]">Destinatário</dt>
                <dd className="font-semibold">{destinatario}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Data do empréstimo</dt>
                <dd>{dataExibicao(dataEmprestimo)}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Previsão</dt>
                <dd>{dataExibicao(dataPrevistaDevolucao)}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Finalidade</dt>
                <dd>{finalidade}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Comissão</dt>
                <dd>{comissao?.nome ?? "Comissão selecionada"}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Forma de registro</dt>
                <dd>{modo === "EM_GRUPO" ? "Em grupo" : "Separadamente"}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Observação</dt>
                <dd>{observacao || "Não informada"}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Registrado por</dt>
                <dd>{usuario.nome}</dd>
              </div>
            </dl>
          </section>
          <section className={painelEmprestimo}>
            <h2 className="font-bold">
              Bens selecionados · {selecionados.length}
            </h2>
            <ul className="mt-3 divide-y divide-[#e4eaf2] text-sm">
              {selecionados.map((bem) => (
                <li key={bem.id} className="py-3">
                  <strong>{bem.numeroPatrimonio}</strong> · {bem.descricao}
                  <span className="block text-[#526580]">{bem.setor.nome}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-sm text-[#526580]">
            Os bens e a comissão serão conferidos novamente na confirmação.
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={criacao.pending}
              onClick={() => setEtapa("cadastro")}
            >
              Corrigir dados
            </Button>
            <Button
              type="button"
              className={botaoPrimarioEmprestimo}
              disabled={
                criacao.pending || decisaoIdempotencia?.tipo === "ja_processada"
              }
              onClick={() => void confirmar()}
            >
              {criacao.pending ? "Registrando..." : "Confirmar empréstimo"}
            </Button>
          </div>
        </>
      )}
      {etapa === "resultado" && resultado && (
        <section
          className={painelEmprestimo}
          aria-label="Resultado do registro"
        >
          <h2 className="font-bold">Empréstimos registrados</h2>
          <ul className="mt-4 space-y-3">
            {(Array.isArray(resultado.dados)
              ? resultado.dados
              : [resultado.dados]
            ).map((item) => (
              <li key={item.id}>
                <Link
                  className="font-semibold text-blue-700 underline"
                  href={`/emprestimos/${item.id}`}
                >
                  Empréstimo para: {item.destinatario ?? "Não informado"} ·{" "}
                  {item.total} bem(ns)
                </Link>
              </li>
            ))}
          </ul>
          <Link className="mt-5 inline-block underline" href="/emprestimos">
            Consultar empréstimos
          </Link>
        </section>
      )}
      {alerta}
    </main>
  );
}
