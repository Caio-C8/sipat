"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CriarEmprestimoBodySchema,
  type CriarEmprestimoResponse,
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
  campoEmprestimo,
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

export function NovoEmprestimo() {
  const bens = usePatrimoniosEmprestimo();
  const criacao = useCriarEmprestimo();
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
    void carregarBens({
      pagina: String(pagina),
      limite: "20",
      ...(buscaAplicada ? { busca: buscaAplicada } : {}),
    });
  }, [carregarBens, pagina, buscaAplicada]);

  function alternar(bem: Bem) {
    setResultado(null);
    setSelecionados((atuais) =>
      atuais.some((item) => item.id === bem.id)
        ? atuais.filter((item) => item.id !== bem.id)
        : atuais.length < 50
          ? [...atuais, bem]
          : atuais,
    );
  }
  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setAviso("");
    setDecisaoIdempotencia(null);
    const semChave = {
      modoAgrupamento: modo,
      patrimonioIds: selecionados.map((bem) => bem.id),
      destinatario,
      finalidade,
      ...(observacao.trim() ? { observacao } : {}),
      dataEmprestimo,
      dataPrevistaDevolucao,
      comissaoId,
    };
    const corpo = JSON.stringify(semChave);
    chaveAnterior.current = obterTentativaIdempotente(
      chaveAnterior.current,
      corpo,
    );
    const validacao = CriarEmprestimoBodySchema.safeParse({
      ...semChave,
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
        setAviso("Empréstimo registrado com sucesso.");
        setSelecionados([]);
        chaveAnterior.current = null;
        setDecisaoIdempotencia(null);
        void carregarBens({
          pagina: String(pagina),
          limite: "20",
          ...(buscaAplicada ? { busca: buscaAplicada } : {}),
        });
        requestAnimationFrame(() => avisoRef.current?.focus());
      }
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(isConflitoIdempotencia(e) ? decisao : null);
      chaveAnterior.current = tentativaAposFalha(chaveAnterior.current, e);
      if (decisao.atualizarConsultas) {
        void carregarBens({
          pagina: String(pagina),
          limite: "20",
          ...(buscaAplicada ? { busca: buscaAplicada } : {}),
        });
      }
      requestAnimationFrame(() => avisoRef.current?.focus());
    }
  }
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header>
        <Link className="text-sm underline" href="/emprestimos">
          Voltar aos empréstimos
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Novo empréstimo</h1>
        <p className="mt-2 text-sm text-[#526580]">
          Escolha até 50 bens ativos e informe os dados da saída.
        </p>
      </header>
      <section
        className={painelEmprestimo}
        aria-labelledby="selecionar-bens-title"
      >
        <h2 id="selecionar-bens-title" className="font-bold">
          Selecionar bens
        </h2>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            setPagina(1);
            setBuscaAplicada(busca.trim());
          }}
        >
          <label className="min-w-48 flex-1 text-sm">
            Buscar patrimônio
            <input
              className={campoEmprestimo}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Número ou descrição"
            />
          </label>
          <Button className="self-end" type="submit">
            Buscar
          </Button>
        </form>
        {bens.loading && (
          <p role="status" className="mt-3">
            Carregando bens...
          </p>
        )}
        {bens.erro !== null && (
          <p role="alert" className="mt-3 text-red-800">
            {mensagemEmprestimo(bens.erro)}
          </p>
        )}
        {bens.dados && !bens.loading && (
          <>
            {bens.dados.dados.length ? (
              <ul className="mt-3 divide-y divide-[#e4eaf2]">
                {bens.dados.dados.map((bem) => (
                  <li
                    key={bem.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <span>
                      <strong>{bem.numeroPatrimonio}</strong> · {bem.descricao}
                      <small className="block text-[#526580]">
                        {bem.setor.nome}
                      </small>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        criacao.pending ||
                        (selecionados.length >= 50 &&
                          !selecionados.some((item) => item.id === bem.id))
                      }
                      onClick={() => alternar(bem)}
                    >
                      {selecionados.some((item) => item.id === bem.id)
                        ? "Remover"
                        : "Selecionar"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3">Nenhum bem elegível encontrado.</p>
            )}
            <div className="mt-3 flex gap-4 text-sm">
              <span>
                Página {bens.dados.meta.pagina} de{" "}
                {bens.dados.meta.ultimaPagina}
              </span>
              <button
                className="underline disabled:opacity-50"
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((n) => n - 1)}
              >
                Anterior
              </button>
              <button
                className="underline disabled:opacity-50"
                type="button"
                disabled={pagina >= bens.dados.meta.ultimaPagina}
                onClick={() => setPagina((n) => n + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )}
        <p className="mt-4 font-semibold">
          Selecionados: {selecionados.length}
        </p>
        {selecionados.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-sm">
            {selecionados.map((bem) => (
              <li key={bem.id}>
                {bem.numeroPatrimonio} · {bem.descricao}
              </li>
            ))}
          </ul>
        )}
      </section>
      <form
        className={painelEmprestimo}
        onSubmit={(e) => {
          void confirmar(e);
        }}
      >
        <fieldset
          disabled={
            criacao.pending || decisaoIdempotencia?.tipo === "ja_processada"
          }
          className="grid gap-4"
        >
          <legend className="mb-3 font-bold">Dados do empréstimo</legend>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-semibold">
              Como registrar
            </legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="modoAgrupamento"
                checked={modo === "EM_GRUPO"}
                onChange={() => {
                  setModo("EM_GRUPO");
                  setResultado(null);
                }}
              />{" "}
              Em grupo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="modoAgrupamento"
                checked={modo === "SEPARADAMENTE"}
                onChange={() => {
                  setModo("SEPARADAMENTE");
                  setResultado(null);
                }}
              />{" "}
              Separadamente
            </label>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Destinatário externo
              <input
                className={campoEmprestimo}
                required
                maxLength={200}
                value={destinatario}
                onChange={(e) => {
                  setDestinatario(e.target.value);
                  setResultado(null);
                }}
                placeholder="Pessoa ou instituição"
              />
            </label>
            <label className="text-sm">
              Finalidade
              <input
                className={campoEmprestimo}
                required
                maxLength={2000}
                value={finalidade}
                onChange={(e) => {
                  setFinalidade(e.target.value);
                  setResultado(null);
                }}
              />
            </label>
          </div>
          <label className="text-sm">
            Observação (opcional)
            <textarea
              className={campoEmprestimo}
              maxLength={2000}
              value={observacao}
              onChange={(e) => {
                setObservacao(e.target.value);
                setResultado(null);
              }}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Data da saída
              <input
                className={campoEmprestimo}
                type="date"
                required
                max={hojeSaoPaulo()}
                value={dataEmprestimo}
                onChange={(e) => {
                  setDataEmprestimo(e.target.value);
                  setComissaoId("");
                  setResultado(null);
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
                onChange={(e) => {
                  setDataPrevistaDevolucao(e.target.value);
                  setResultado(null);
                }}
              />
            </label>
          </div>
          <SeletorComissaoEmprestimo
            dataReferencia={dataEmprestimo}
            rotulo="Comissão vigente na saída"
            value={comissaoId}
            onChange={(id) => {
              setComissaoId(id);
              setResultado(null);
            }}
          />
          <Button
            type="submit"
            disabled={
              criacao.pending || selecionados.length === 0 || !comissaoId
            }
          >
            {criacao.pending ? "Registrando..." : "Registrar saída"}
          </Button>
        </fieldset>
      </form>
      {(Boolean(aviso) || erro !== null) && (
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
                href: "/emprestimos",
                rotulo: "Consultar empréstimos",
              }}
            />
          ) : (
            <p>{erro ? mensagemEmprestimo(erro) : aviso}</p>
          )}
          {isApiError(erro) &&
            !decisaoIdempotencia &&
            erro.erros.length > 0 && (
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
      {resultado && (
        <section
          className={painelEmprestimo}
          aria-label="Resultado do registro"
        >
          <h2 className="font-bold">Empréstimos registrados</h2>
          <ul className="mt-2 list-inside list-disc">
            {(Array.isArray(resultado.dados)
              ? resultado.dados
              : [resultado.dados]
            ).map((item) => (
              <li key={item.id}>
                <Link className="underline" href={`/emprestimos/${item.id}`}>
                  {item.destinatario ?? "Não informado"} · {item.total} bem(ns)
                  · {item.id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
