"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RegistrarDevolucaoEmprestimoBodySchema,
  type EmprestimoDetalhe,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { TextareaField, TextField } from "@/components/shared/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
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
import { paraDataHoraLocalSaoPaulo } from "@/lib/format/data-hora-sao-paulo";
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
  dataExibicao,
  hojeSaoPaulo,
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
    const diaEmprestimo = paraDataHoraLocalSaoPaulo(
      detalhe.dataEmprestimo,
    ).slice(0, 10);
    const corpo = JSON.stringify(semChave);
    chaveAnterior.current = obterTentativaIdempotente(
      chaveAnterior.current,
      corpo,
    );
    const validacao = RegistrarDevolucaoEmprestimoBodySchema.superRefine(
      (dados, contexto) => {
        if (dados.dataDevolucao < diaEmprestimo)
          contexto.addIssue({
            code: "custom",
            path: ["dataDevolucao"],
            message:
              "A data da devolução não pode anteceder a data do empréstimo.",
          });
        if (dados.dataDevolucao > hojeSaoPaulo())
          contexto.addIssue({
            code: "custom",
            path: ["dataDevolucao"],
            message: "A data da devolução não pode ser futura.",
          });
      },
    ).safeParse({
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
      <PageHeader
        title={
          exibirDevolucao
            ? "Registrar devolução"
            : `Empréstimo para: ${detalhe.destinatario ?? "Não informado"}`
        }
        description={
          exibirDevolucao
            ? "Confira os bens recebidos e registre a devolução."
            : undefined
        }
        actions={
          <Link
            className="inline-flex rounded-md border border-[#dce5f0] px-4 py-2 text-sm font-semibold"
            href={retorno}
          >
            Voltar à consulta
          </Link>
        }
      />
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
            <Table
              className="min-w-[780px]"
              containerClassName="mt-4"
              containerProps={{
                role: "region",
                "aria-label": "Bens do empréstimo",
                tabIndex: 0,
              }}
            >
              <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                <TableRow>
                  {[
                    "Patrimônio / descrição",
                    "Setor de vínculo",
                    "Neste empréstimo",
                    "Devolução",
                    "Ação",
                  ].map((titulo) => (
                    <TableHead key={titulo} scope="col" className="p-3">
                      {titulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalhe.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="p-3 whitespace-normal">
                      <strong>{item.patrimonio.numeroPatrimonio}</strong>
                      <p className="text-[#526580]">
                        {item.patrimonio.descricao}
                      </p>
                    </TableCell>
                    <TableCell className="p-3">
                      {item.setorVinculo?.nome ?? "Não informado"}
                    </TableCell>
                    <TableCell className="p-3">
                      {item.pendente ? "Pendente de devolução" : "Devolvido"}
                    </TableCell>
                    <TableCell className="p-3">
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
                    </TableCell>
                    <TableCell className="p-3">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/patrimonios/${item.patrimonio.id}`}>
                          Ver bem
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <form
          className="grid gap-5"
          noValidate
          onSubmit={(e) => void confirmar(e)}
        >
          <fieldset
            disabled={
              devolucao.pending || decisaoIdempotencia?.tipo === "ja_processada"
            }
            className="grid gap-5"
          >
            <section className={painelEmprestimo}>
              <h2 className="font-bold">Dados da devolução</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <TextField
                  id="data-devolucao-emprestimo"
                  label="Data da devolução"
                  type="date"
                  required
                  value={dataDevolucao}
                  onChange={(e) => {
                    setDataDevolucao(e.target.value);
                    setComissaoId("");
                  }}
                />
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
                Empréstimo para: {detalhe.destinatario ?? "Não informado"} ·{" "}
                {detalhe.pendentes} de {detalhe.total} bens pendentes
              </p>
            </section>
            <section className={painelEmprestimo}>
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="font-bold">Bens recebidos</h2>
                <p className="text-sm font-semibold text-blue-700">
                  {selecionados.length} selecionado(s)
                </p>
              </div>
              <Table
                className="min-w-[620px]"
                containerClassName="mt-4"
                containerProps={{
                  role: "region",
                  "aria-label": "Bens pendentes de recebimento",
                  tabIndex: 0,
                }}
              >
                <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                  <TableRow>
                    <TableHead className="p-3" scope="col">
                      Receber
                    </TableHead>
                    <TableHead className="p-3" scope="col">
                      Patrimônio / descrição
                    </TableHead>
                    <TableHead className="p-3" scope="col">
                      Setor de vínculo
                    </TableHead>
                    <TableHead className="p-3" scope="col">
                      Situação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-3">
                        <Checkbox
                          aria-label={`Receber ${item.patrimonio.numeroPatrimonio}`}
                          checked={selecionados.includes(item.id)}
                          onCheckedChange={() => alternar(item.id)}
                        />
                      </TableCell>
                      <TableCell className="p-3 whitespace-normal">
                        <strong>{item.patrimonio.numeroPatrimonio}</strong>
                        <p className="text-[#526580]">
                          {item.patrimonio.descricao}
                        </p>
                      </TableCell>
                      <TableCell className="p-3">
                        {item.setorVinculo?.nome ?? "Não informado"}
                      </TableCell>
                      <TableCell className="p-3">Pendente</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
            <TextareaField
              id="observacao-devolucao-emprestimo"
              label="Observação da devolução (opcional)"
              maxLength={2000}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
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
