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
  campoEmprestimo,
  dataExibicao,
  hojeSaoPaulo,
  identificacaoEmprestimo,
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
          {erro.erros.map((item, i) => (
            <li key={i}>
              {item.campo}: {item.mensagem}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {etapa === "selecionar"
              ? "Selecionar bens"
              : etapa === "revisao"
                ? "Revisar empréstimo"
                : etapa === "resultado"
                  ? "Empréstimo registrado"
                  : "Novo empréstimo"}
          </h1>
          <p className="mt-1 text-sm text-[#526580]">
            {etapa === "selecionar"
              ? "A consulta apresenta bens ativos elegíveis. O servidor confirma a elegibilidade ao registrar."
              : etapa === "revisao"
                ? "Confira os dados antes de registrar. A revisão não reserva os bens."
                : "Informe o destinatário, o período e os bens do empréstimo."}
          </p>
        </div>
        <Link
          className="inline-flex rounded-md border border-[#dce5f0] px-4 py-2 text-sm font-semibold"
          href="/emprestimos"
        >
          Voltar à consulta
        </Link>
      </header>
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
              <label className="min-w-48 flex-1 text-sm">
                Patrimônio ou descrição
                <input
                  className={campoEmprestimo}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Número ou descrição"
                />
              </label>
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
                <div
                  className="mt-4 overflow-x-auto"
                  role="region"
                  aria-label="Bens elegíveis"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-[#f7f9fc] text-xs uppercase text-[#526580]">
                      <tr>
                        <th className="p-3" scope="col">
                          Selecionar
                        </th>
                        <th className="p-3" scope="col">
                          Patrimônio / descrição
                        </th>
                        <th className="p-3" scope="col">
                          Setor
                        </th>
                        <th className="p-3" scope="col">
                          Situação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bens.dados.dados.map((bem) => {
                        const escolhido = selecionados.some(
                          (item) => item.id === bem.id,
                        );
                        return (
                          <tr
                            key={bem.id}
                            className="border-b border-[#e4eaf2] last:border-0"
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                aria-label={`Selecionar ${bem.numeroPatrimonio}`}
                                checked={escolhido}
                                disabled={
                                  criacao.pending ||
                                  (selecionados.length >=
                                    LIMITE_ITENS_EMPRESTIMO &&
                                    !escolhido)
                                }
                                onChange={() => alternar(bem)}
                              />
                            </td>
                            <td className="p-3">
                              <strong>{bem.numeroPatrimonio}</strong>
                              <p className="text-[#526580]">{bem.descricao}</p>
                            </td>
                            <td className="p-3">{bem.setor.nome}</td>
                            <td className="p-3">
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                Ativo · elegível
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                <button
                  type="button"
                  className="underline disabled:opacity-50"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((n) => n - 1)}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="underline disabled:opacity-50"
                  disabled={pagina >= bens.dados.meta.ultimaPagina}
                  onClick={() => setPagina((n) => n + 1)}
                >
                  Próxima
                </button>
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
                <label className="text-sm">
                  Destinatário
                  <input
                    className={campoEmprestimo}
                    required
                    maxLength={200}
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                    placeholder="Pessoa ou instituição"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    Data do empréstimo
                    <input
                      className={campoEmprestimo}
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
                  </label>
                  <label className="text-sm">
                    Previsão de devolução
                    <input
                      className={campoEmprestimo}
                      type="date"
                      required
                      min={dataEmprestimo}
                      value={dataPrevistaDevolucao}
                      onChange={(e) => setDataPrevistaDevolucao(e.target.value)}
                    />
                  </label>
                </div>
                <label className="text-sm">
                  Finalidade
                  <input
                    className={campoEmprestimo}
                    required
                    maxLength={2000}
                    value={finalidade}
                    onChange={(e) => setFinalidade(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Observação (opcional)
                  <textarea
                    className={campoEmprestimo}
                    maxLength={2000}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                </label>
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
              <dl className="mt-6 text-sm">
                <dt className="text-[#526580]">Registrado por</dt>
                <dd className="mt-1 font-semibold">{usuario.nome}</dd>
                <dd className="mt-1 text-[#526580]">Diretor de Patrimônio</dd>
              </dl>
              <p className="mt-5 text-xs text-[#526580]">
                A autoria definitiva é registrada pelo servidor com a sessão
                autenticada.
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
              <div
                className="mt-4 overflow-x-auto"
                role="region"
                aria-label="Bens selecionados"
                tabIndex={0}
              >
                <table className="w-full min-w-[570px] text-left text-sm">
                  <thead className="bg-[#f7f9fc] text-xs uppercase text-[#526580]">
                    <tr>
                      <th className="p-3" scope="col">
                        Patrimônio
                      </th>
                      <th className="p-3" scope="col">
                        Descrição
                      </th>
                      <th className="p-3" scope="col">
                        Setor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selecionados.map((bem) => (
                      <tr key={bem.id} className="border-b border-[#e4eaf2]">
                        <td className="p-3 font-semibold">
                          {bem.numeroPatrimonio}
                        </td>
                        <td className="p-3">{bem.descricao}</td>
                        <td className="p-3">{bem.setor.nome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#526580]">
                Nenhum bem selecionado. Use “Alterar seleção” para escolher bens
                elegíveis.
              </p>
            )}
          </section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <fieldset className="grid gap-2 text-sm">
              <legend className="font-semibold">Forma de registro</legend>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="modoAgrupamento"
                  checked={modo === "EM_GRUPO"}
                  onChange={() => setModo("EM_GRUPO")}
                />
                <span>
                  Em grupo{" "}
                  <small className="block text-[#526580]">
                    Todos os bens no mesmo empréstimo.
                  </small>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="modoAgrupamento"
                  checked={modo === "SEPARADAMENTE"}
                  onChange={() => setModo("SEPARADAMENTE")}
                />
                <span>
                  Separadamente{" "}
                  <small className="block text-[#526580]">
                    Um registro para cada bem.
                  </small>
                </span>
              </label>
            </fieldset>
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
            Os bens e a comissão serão validados novamente pelo servidor na
            confirmação.
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
                  {identificacaoEmprestimo(item.id)} ·{" "}
                  {item.destinatario ?? "Não informado"} · {item.total} bem(ns)
                </Link>
                <span className="sr-only">
                  Identificador completo: {item.id}
                </span>
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
