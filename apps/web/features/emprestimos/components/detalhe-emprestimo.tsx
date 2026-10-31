"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RegistrarDevolucaoEmprestimoBodySchema,
  type EmprestimoDetalhe,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/core/api-error";
import { useDevolverEmprestimo } from "../api/hooks";
import {
  campoEmprestimo,
  dataExibicao,
  hojeSaoPaulo,
  mensagemEmprestimo,
  painelEmprestimo,
} from "../apresentacao";
import { SeletorComissaoEmprestimo } from "./seletor-comissao";

export function DetalheEmprestimo({
  inicial,
  podeDevolver,
}: {
  inicial: EmprestimoDetalhe;
  podeDevolver: boolean;
}) {
  const router = useRouter();
  const [detalhe, setDetalhe] = useState(inicial);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [dataDevolucao, setDataDevolucao] = useState(hojeSaoPaulo);
  const [comissaoId, setComissaoId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState("");
  const chaveAnterior = useRef<{ corpo: string; chave: string } | null>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const devolucao = useDevolverEmprestimo(detalhe.id);

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
    const semChave = {
      emprestimoIds: selecionados,
      dataDevolucao,
      comissaoId,
      ...(observacao.trim() ? { observacao } : {}),
    };
    const corpo = JSON.stringify(semChave);
    if (chaveAnterior.current?.corpo !== corpo)
      chaveAnterior.current = { corpo, chave: crypto.randomUUID() };
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
        setAviso(`${resposta.dados.devolvidos.length} bem(ns) recebido(s).`);
        chaveAnterior.current = null;
        router.refresh();
        requestAnimationFrame(() => avisoRef.current?.focus());
      }
    } catch (e) {
      setErro(e);
      requestAnimationFrame(() => avisoRef.current?.focus());
    }
  }
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header>
        <Link className="text-sm underline" href="/emprestimos">
          Voltar aos empréstimos
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Detalhes do empréstimo</h1>
        <p className="mt-2 break-all text-xs text-[#526580]">
          Identificador: {detalhe.id}
        </p>
      </header>
      <section className={painelEmprestimo} aria-labelledby="dados-saida-title">
        <h2 id="dados-saida-title" className="font-bold">
          Saída
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt>Destinatário</dt>
            <dd className="font-semibold">
              {detalhe.destinatario ?? "Não informado"}
            </dd>
          </div>
          <div>
            <dt>Finalidade</dt>
            <dd className="font-semibold">
              {detalhe.finalidade ?? "Não informado"}
            </dd>
          </div>
          <div>
            <dt>Data da saída</dt>
            <dd>{dataExibicao(detalhe.dataEmprestimo)}</dd>
          </div>
          <div>
            <dt>Previsão de devolução</dt>
            <dd>{dataExibicao(detalhe.dataPrevistaDevolucao)}</dd>
          </div>
          <div>
            <dt>Comissão</dt>
            <dd>{detalhe.comissao.nome}</dd>
          </div>
          <div>
            <dt>Registrado por</dt>
            <dd>
              {detalhe.registradoPor.nome} em{" "}
              {new Date(detalhe.createdAt).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
            </dd>
          </div>
          <div>
            <dt>Modo</dt>
            <dd>
              {detalhe.modoAgrupamento === "EM_GRUPO"
                ? "Em grupo"
                : detalhe.modoAgrupamento === "SEPARADAMENTE"
                  ? "Separadamente"
                  : "Não informado"}
            </dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              {detalhe.situacao === "CONCLUIDO"
                ? "Concluído"
                : detalhe.emAtraso
                  ? "Em atraso"
                  : "Em andamento"}{" "}
              · {detalhe.pendentes} de {detalhe.total} pendente(s)
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt>Observação</dt>
            <dd>{detalhe.observacao ?? "Não informada"}</dd>
          </div>
        </dl>
      </section>
      <section className={painelEmprestimo} aria-labelledby="bens-title">
        <h2 id="bens-title" className="font-bold">
          Bens e histórico
        </h2>
        <ul className="mt-3 divide-y divide-[#e4eaf2]">
          {detalhe.itens.map((item) => (
            <li key={item.id} className="py-4">
              <strong>
                {item.patrimonio.numeroPatrimonio} · {item.patrimonio.descricao}
              </strong>
              <p className="text-sm">
                Setor de vínculo: {item.setorVinculo?.nome ?? "Não informado"}
              </p>
              <p className="text-sm">
                {item.pendente ? "Pendente de devolução" : "Devolvido"}
              </p>
              {item.devolucao && (
                <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <div>
                    <dt>Data da devolução</dt>
                    <dd>
                      {dataExibicao(item.devolucao.dataDevolucao)}
                      {item.devolucao.aposPrevisao ? " · Após a previsão" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Comissão do retorno</dt>
                    <dd>{item.devolucao.comissao.nome}</dd>
                  </div>
                  <div>
                    <dt>Recebido por</dt>
                    <dd>
                      {item.devolucao.registradoPor?.nome ?? "Não informado"}
                    </dd>
                  </div>
                  <div>
                    <dt>Registrado em</dt>
                    <dd>
                      {new Date(item.devolucao.createdAt).toLocaleString(
                        "pt-BR",
                        { timeZone: "America/Sao_Paulo" },
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Observação</dt>
                    <dd>{item.devolucao.observacao ?? "Não informada"}</dd>
                  </div>
                </dl>
              )}
            </li>
          ))}
        </ul>
      </section>
      {podeDevolver && detalhe.pendentes > 0 && (
        <form
          className={painelEmprestimo}
          onSubmit={(e) => {
            void confirmar(e);
          }}
        >
          <fieldset disabled={devolucao.pending} className="grid gap-4">
            <legend className="mb-3 font-bold">Registrar devolução</legend>
            <p className="text-sm">
              Selecione apenas os bens efetivamente recebidos.
            </p>
            <div className="grid gap-2">
              {detalhe.itens
                .filter((item) => item.pendente)
                .map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2 rounded-md border border-[#e4eaf2] p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selecionados.includes(item.id)}
                      onChange={() => alternar(item.id)}
                    />
                    <span>
                      {item.patrimonio.numeroPatrimonio} ·{" "}
                      {item.patrimonio.descricao}
                    </span>
                  </label>
                ))}
            </div>
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
            <label className="text-sm">
              Observação (opcional)
              <textarea
                className={campoEmprestimo}
                maxLength={2000}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </label>
            <Button
              type="submit"
              disabled={
                devolucao.pending || selecionados.length === 0 || !comissaoId
              }
            >
              {devolucao.pending
                ? "Registrando..."
                : `Registrar devolução de ${selecionados.length} bem(ns)`}
            </Button>
          </fieldset>
        </form>
      )}
      {(Boolean(aviso) || erro !== null) && (
        <div
          ref={avisoRef}
          tabIndex={-1}
          role={erro ? "alert" : "status"}
          className={`rounded-md p-4 ${erro ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"}`}
        >
          <p>{erro ? mensagemEmprestimo(erro) : aviso}</p>
          {isApiError(erro) && erro.erros.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {erro.erros.map((item, i) => (
                <li key={i}>
                  {item.campo}: {item.mensagem}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
