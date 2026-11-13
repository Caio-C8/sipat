"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RegistrarDevolucaoEmprestimoBodySchema,
  type EmprestimoDetalhe,
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
import { useConsultarEmprestimo, useDevolverEmprestimo } from "../api/hooks";
import {
  botaoPrimarioEmprestimo,
  campoEmprestimo,
  dataExibicao,
  hojeSaoPaulo,
  identificacaoEmprestimo,
  mensagemEmprestimo,
  painelEmprestimo,
  situacaoEmprestimo,
} from "../apresentacao";
import { SeletorComissaoEmprestimo } from "./seletor-comissao";

function dataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export function DetalheEmprestimo({
  inicial,
  podeDevolver,
  usuario,
  retorno,
}: {
  inicial: EmprestimoDetalhe;
  podeDevolver: boolean;
  usuario: string;
  retorno: string;
}) {
  const router = useRouter();
  const [detalhe, setDetalhe] = useState(inicial);
  const [exibirDevolucao, setExibirDevolucao] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [dataDevolucao, setDataDevolucao] = useState(hojeSaoPaulo);
  const [comissaoId, setComissaoId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState("");
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const chaveAnterior = useRef<TentativaIdempotente | null>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const devolucao = useDevolverEmprestimo(detalhe.id);
  const consulta = useConsultarEmprestimo(detalhe.id);
  const situacao = situacaoEmprestimo(detalhe);
  const pendentes = detalhe.itens.filter((item) => item.pendente);
  const restantes = pendentes.length - selecionados.length;
  const eventosDevolucao = Array.from(
    new Map(
      detalhe.itens
        .filter((item) => item.devolucao)
        .map((item) => [item.devolucao!.id, item.devolucao!]),
    ).values(),
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function alternar(id: string) {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id],
    );
  }
  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setAviso("");
    setDecisaoIdempotencia(null);
    const semChave = {
      emprestimoIds: selecionados,
      dataDevolucao,
      comissaoId,
      ...(observacao.trim() ? { observacao } : {}),
    };
    const corpo = JSON.stringify(semChave);
    chaveAnterior.current = obterTentativaIdempotente(
      chaveAnterior.current,
      corpo,
    );
    const validacao = RegistrarDevolucaoEmprestimoBodySchema.safeParse({
      ...semChave,
      chaveIdempotencia: chaveAnterior.current!.chave,
    });
    if (!validacao.success) {
      setAviso(validacao.error.issues[0]?.message ?? "Confira os campos.");
      requestAnimationFrame(() => avisoRef.current?.focus());
      return;
    }
    try {
      const resposta = await devolucao.confirmar(validacao.data);
      if (resposta) {
        setDetalhe(resposta.dados.emprestimo);
        setSelecionados([]);
        setObservacao("");
        setExibirDevolucao(false);
        setAviso(`${resposta.dados.devolvidos.length} bem(ns) recebido(s).`);
        chaveAnterior.current = null;
        setDecisaoIdempotencia(null);
        router.refresh();
        requestAnimationFrame(() => avisoRef.current?.focus());
      }
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(isConflitoIdempotencia(e) ? decisao : null);
      chaveAnterior.current = tentativaAposFalha(chaveAnterior.current, e);
      if (decisao.atualizarConsultas) {
        try {
          const atualizado = await consulta.consultar();
          setDetalhe(atualizado);
          setSelecionados((atuais) =>
            atuais.filter((id) =>
              atualizado.itens.some((item) => item.id === id && item.pendente),
            ),
          );
        } catch {
          /* A falha original permanece visível. */
        }
        router.refresh();
      }
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
          destino={{
            href: `/emprestimos/${detalhe.id}`,
            rotulo: "Atualizar detalhes do empréstimo",
          }}
        />
      ) : (
        <p>{erro ? mensagemEmprestimo(erro) : aviso}</p>
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
            {exibirDevolucao
              ? "Registrar devolução"
              : identificacaoEmprestimo(detalhe.id)}
          </h1>
          <p className="mt-1 text-sm text-[#526580]">
            {exibirDevolucao
              ? "Confira os bens recebidos e registre a devolução."
              : `${detalhe.modoAgrupamento === "EM_GRUPO" ? "Em grupo" : detalhe.modoAgrupamento === "SEPARADAMENTE" ? "Separadamente" : "Agrupamento não informado"} · ${detalhe.destinatario ?? "Destinatário não informado"}`}
          </p>
          <p className="mt-1 break-all text-xs text-[#526580]">
            ID completo: {detalhe.id}
          </p>
        </div>
        <Link
          className="inline-flex rounded-md border border-[#dce5f0] px-4 py-2 text-sm font-semibold"
          href={retorno}
        >
          Voltar à consulta
        </Link>
      </header>
      {!exibirDevolucao ? (
        <>
          <section
            className={painelEmprestimo}
            aria-labelledby="dados-saida-title"
          >
            <h2 id="dados-saida-title" className="font-bold">
              Dados da saída
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-[#526580]">Destinatário</dt>
                <dd className="font-semibold">
                  {detalhe.destinatario ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="text-[#526580]">Data do empréstimo</dt>
                <dd>{dataExibicao(detalhe.dataEmprestimo)}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Devolução prevista</dt>
                <dd>{dataExibicao(detalhe.dataPrevistaDevolucao)}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Comissão</dt>
                <dd>{detalhe.comissao.nome}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Finalidade</dt>
                <dd>{detalhe.finalidade ?? "Não informada"}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Situação</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${situacao.classe}`}
                  >
                    {situacao.texto}
                  </span>
                  <span className="ml-2">
                    {detalhe.pendentes} de {detalhe.total} pendente(s)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[#526580]">Agrupamento</dt>
                <dd>
                  {detalhe.modoAgrupamento === "EM_GRUPO"
                    ? "Em grupo"
                    : detalhe.modoAgrupamento === "SEPARADAMENTE"
                      ? "Separadamente"
                      : "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="text-[#526580]">Registrado por</dt>
                <dd>
                  {detalhe.registradoPor.nome} em {dataHora(detalhe.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[#526580]">Observação da saída</dt>
                <dd>{detalhe.observacao ?? "Não informada"}</dd>
              </div>
            </dl>
          </section>
          <section className={painelEmprestimo} aria-labelledby="bens-title">
            <h2 id="bens-title" className="font-bold">
              Bens e devoluções
            </h2>
            <div
              className="mt-4 overflow-x-auto"
              role="region"
              aria-label="Bens do empréstimo"
              tabIndex={0}
            >
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-[#f7f9fc] text-xs uppercase text-[#526580]">
                  <tr>
                    {[
                      "Patrimônio / descrição",
                      "Setor de vínculo",
                      "Neste empréstimo",
                      "Devolução",
                      "Ação",
                    ].map((titulo) => (
                      <th key={titulo} scope="col" className="p-3">
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalhe.itens.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#e4eaf2] last:border-0"
                    >
                      <td className="p-3">
                        <strong>{item.patrimonio.numeroPatrimonio}</strong>
                        <p className="text-[#526580]">
                          {item.patrimonio.descricao}
                        </p>
                      </td>
                      <td className="p-3">
                        {item.setorVinculo?.nome ?? "Não informado"}
                      </td>
                      <td className="p-3">
                        {item.pendente ? "Pendente de devolução" : "Devolvido"}
                      </td>
                      <td className="p-3">
                        {item.devolucao ? (
                          <>
                            <span>
                              {dataExibicao(item.devolucao.dataDevolucao)}
                            </span>
                            {item.devolucao.aposPrevisao && (
                              <span className="block text-amber-900">
                                Após a previsão
                              </span>
                            )}
                            <span className="block text-xs text-[#526580]">
                              Recebido por{" "}
                              {item.devolucao.registradoPor?.nome ??
                                "não informado"}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        <Link
                          className="inline-flex rounded-md border border-[#dce5f0] px-3 py-2 font-semibold hover:bg-slate-50"
                          href={`/patrimonios/${item.patrimonio.id}`}
                        >
                          Ver bem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section
            className={painelEmprestimo}
            aria-labelledby="historico-title"
          >
            <h2 id="historico-title" className="font-bold">
              Histórico do empréstimo
            </h2>
            <ol className="mt-4 space-y-4 border-l-2 border-[#dce5f0] pl-5 text-sm">
              <li>
                <strong>Saída registrada</strong>
                <p>
                  Data da operação: {dataExibicao(detalhe.dataEmprestimo)} ·
                  Registrada em: {dataHora(detalhe.createdAt)}
                </p>
                <p>
                  Por {detalhe.registradoPor.nome} · {detalhe.total} bem(ns)
                </p>
              </li>
              {eventosDevolucao.map((evento) => (
                <li key={evento.id}>
                  <strong>Devolução registrada</strong>
                  <p>
                    Data da operação: {dataExibicao(evento.dataDevolucao)} ·
                    Registrada em: {dataHora(evento.createdAt)}
                  </p>
                  <p>
                    Comissão: {evento.comissao.nome} · Recebido por{" "}
                    {evento.registradoPor?.nome ?? "não informado"}
                  </p>
                  {evento.observacao && <p>Observação: {evento.observacao}</p>}
                </li>
              ))}
            </ol>
            {eventosDevolucao.length === 0 && (
              <p className="mt-3 text-sm text-[#526580]">
                Nenhuma devolução registrada.
              </p>
            )}
          </section>
          {podeDevolver && detalhe.pendentes > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                className={botaoPrimarioEmprestimo}
                onClick={() => setExibirDevolucao(true)}
              >
                Registrar devolução
              </Button>
            </div>
          )}
        </>
      ) : (
        <form className="grid gap-5" onSubmit={(e) => void confirmar(e)}>
          <fieldset
            disabled={
              devolucao.pending || decisaoIdempotencia?.tipo === "ja_processada"
            }
            className="grid gap-5"
          >
            <section className={painelEmprestimo}>
              <h2 className="font-bold">Dados da devolução</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="text-sm">
                  Data da devolução
                  <input
                    className={campoEmprestimo}
                    type="date"
                    required
                    min={detalhe.dataEmprestimo.slice(0, 10)}
                    max={hojeSaoPaulo()}
                    value={dataDevolucao}
                    onChange={(e) => {
                      setDataDevolucao(e.target.value);
                      setComissaoId("");
                    }}
                  />
                </label>
                <SeletorComissaoEmprestimo
                  dataReferencia={dataDevolucao}
                  rotulo="Comissão vigente na devolução"
                  value={comissaoId}
                  onChange={setComissaoId}
                />
                <div className="text-sm">
                  <p className="text-[#526580]">Registrado por</p>
                  <p className="mt-2 font-semibold">{usuario}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#526580]">
                {identificacaoEmprestimo(detalhe.id)} · {detalhe.pendentes} de{" "}
                {detalhe.total} bens pendentes ·{" "}
                {detalhe.destinatario ?? "Destinatário não informado"}
              </p>
            </section>
            <section className={painelEmprestimo}>
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="font-bold">Bens recebidos</h2>
                <p className="text-sm font-semibold text-blue-700">
                  {selecionados.length} selecionado(s)
                </p>
              </div>
              <div
                className="mt-4 overflow-x-auto"
                role="region"
                aria-label="Bens pendentes de recebimento"
                tabIndex={0}
              >
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-[#f7f9fc] text-xs uppercase text-[#526580]">
                    <tr>
                      <th className="p-3" scope="col">
                        Receber
                      </th>
                      <th className="p-3" scope="col">
                        Patrimônio / descrição
                      </th>
                      <th className="p-3" scope="col">
                        Setor de vínculo
                      </th>
                      <th className="p-3" scope="col">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendentes.map((item) => (
                      <tr key={item.id} className="border-b border-[#e4eaf2]">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            aria-label={`Receber ${item.patrimonio.numeroPatrimonio}`}
                            checked={selecionados.includes(item.id)}
                            onChange={() => alternar(item.id)}
                          />
                        </td>
                        <td className="p-3">
                          <strong>{item.patrimonio.numeroPatrimonio}</strong>
                          <p className="text-[#526580]">
                            {item.patrimonio.descricao}
                          </p>
                        </td>
                        <td className="p-3">
                          {item.setorVinculo?.nome ?? "Não informado"}
                        </td>
                        <td className="p-3">Pendente</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <label className="text-sm">
              Observação da devolução (opcional)
              <textarea
                className={campoEmprestimo}
                maxLength={2000}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </label>
            <p role="status" className="text-sm">
              {selecionados.length === 0
                ? "Selecione ao menos um bem recebido."
                : restantes === 0
                  ? "A devolução concluirá este empréstimo."
                  : `Após esta devolução, ${restantes} bem(ns) continuarão pendentes.`}
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={devolucao.pending}
                onClick={() => {
                  setExibirDevolucao(false);
                  setSelecionados([]);
                  setComissaoId("");
                  setErro(null);
                  setAviso("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={botaoPrimarioEmprestimo}
                disabled={
                  devolucao.pending || selecionados.length === 0 || !comissaoId
                }
              >
                {devolucao.pending ? "Registrando..." : "Confirmar devolução"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
      {alerta}
    </main>
  );
}
