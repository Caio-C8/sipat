"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ClipboardCheck,
  FileText,
  Laptop,
  MapPin,
  Tag,
  TrendingDown,
} from "lucide-react";
import {
  CriarPatrimonioBodySchema,
  type CriarPatrimonioBodyData,
  type CriarPatrimonioResponse,
} from "@repo/contracts";
import { isApiError } from "@/lib/api/core/api-error";
import {
  decidirAposFalha,
  isConflitoIdempotencia,
  type DecisaoIdempotencia,
} from "@/lib/api/core/idempotencia";
import { usePatrimonioPendente } from "../api/use-patrimonio-pendente";
import {
  useCriarPatrimonio,
  useEspeciesPatrimonio,
  useProcessosCompraPatrimonio,
  useSetoresPatrimonio,
} from "../api/hooks";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-3 px-4 py-4 text-[#17253d] min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]";
const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-3 min-[1500px]:px-[19px] min-[1500px]:py-4";
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dfe7f1] bg-white px-3 text-xs text-[#19355d] outline-none focus-visible:ring-2 focus-visible:ring-[#2860eb] disabled:cursor-not-allowed disabled:opacity-70";
const bloqueado = `${campo} bg-[#f1f5f9] text-[#62748e]`;
const TIPOS_INCORPORACAO = [
  ["AQUISICAO", "Aquisição"],
  ["DOACAO", "Doação"],
  ["TRANSFERENCIA", "Transferência"],
  ["CESSAO", "Cessão"],
  ["COMODATO", "Comodato"],
  ["PERMUTA", "Permuta"],
  ["PRODUCAO_INTERNA", "Produção interna"],
  ["OUTROS", "Outros"],
] as const;
function Rotulo({
  children,
  obrigatorio = false,
}: {
  children: ReactNode;
  obrigatorio?: boolean;
}) {
  return (
    <span className="text-[11px] text-[#29456d]">
      {children}
      {obrigatorio ? " *" : ""}
    </span>
  );
}

function Secao({
  titulo,
  Icone,
  children,
  detalhe,
}: {
  titulo: string;
  Icone: typeof Tag;
  children: ReactNode;
  detalhe?: string;
}) {
  return (
    <section className={cartao}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <span className="rounded-md bg-[#eff5ff] p-2 text-[#2860eb]">
            <Icone className="size-4" />
          </span>
          {titulo}
        </h2>
        {detalhe && <small className="text-[#62748e]">{detalhe}</small>}
      </div>
      {children}
    </section>
  );
}

function converterDecimal(valor: string) {
  const normalizado = valor.trim();
  return normalizado.includes(",")
    ? normalizado.replace(/\./g, "").replace(",", ".")
    : normalizado;
}

function numeroDecimal(valor: string) {
  const numero = Number(converterDecimal(valor));
  return Number.isFinite(numero) ? numero : 0;
}

function formatarMoeda(valor: string | number) {
  const numero = typeof valor === "number" ? valor : Number(valor);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numero) ? numero : 0);
}

function hojeLocal() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function CadastroPatrimonio({ usuarioId }: { usuarioId: string }) {
  const especies = useEspeciesPatrimonio();
  const setores = useSetoresPatrimonio();
  const processos = useProcessosCompraPatrimonio();
  const criacao = useCriarPatrimonio();
  const persistencia = usePatrimonioPendente(usuarioId);
  const [descricao, setDescricao] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [especieId, setEspecieId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [semNumeroOficial, setSemNumeroOficial] = useState(false);
  const [tipo, setTipo] = useState<(typeof TIPOS_INCORPORACAO)[number][0]>(
    "AQUISICAO",
  );
  const [processoCompraId, setProcessoCompraId] = useState("");
  const [dataTombamento, setDataTombamento] = useState(hojeLocal);
  const [valor, setValor] = useState("");
  const [vidaUtil, setVidaUtil] = useState("60");
  const [residual, setResidual] = useState("");
  const [residualEmPercentual, setResidualEmPercentual] = useState(false);
  const [inicioDepreciacao, setInicioDepreciacao] = useState(hojeLocal);
  const [manterDados, setManterDados] = useState(false);
  const [pedidoPendente, setPedidoPendente] =
    useState<CriarPatrimonioBodyData | null>(persistencia.pedido);
  const [erro, setErro] = useState<unknown>(null);
  const [decisao, setDecisao] = useState<DecisaoIdempotencia | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [resultado, setResultado] =
    useState<CriarPatrimonioResponse["dados"] | null>(null);
  const painelErro = useRef<HTMLDivElement>(null);
  const envioEmCurso = useRef(false);

  useEffect(() => {
    void especies.carregar();
    void setores.carregar();
    void processos.carregar();
  }, [especies.carregar, setores.carregar, processos.carregar]);

  useEffect(() => {
    const pedido = persistencia.pedido;
    if (!pedido || pedidoPendente) return;
    setDescricao(pedido.descricao);
    setMarca(pedido.marca ?? "");
    setModelo(pedido.modelo ?? "");
    setSerie(pedido.numeroSerie ?? "");
    setEspecieId(pedido.especieId);
    setSetorId(pedido.setorAtualId);
    setSemNumeroOficial(pedido.semNumeroOficial);
    setTipo(pedido.tipoIncorporacao);
    setProcessoCompraId(pedido.processoCompraId ?? "");
    setDataTombamento(pedido.dataTombamento);
    setValor(pedido.valorIncorporacao.replace(".", ","));
    setVidaUtil(String(pedido.parametrosDepreciacao.vidaUtilInicialMeses));
    setResidualEmPercentual(
      pedido.parametrosDepreciacao.percentualResidual !== undefined,
    );
    setResidual(
      (pedido.parametrosDepreciacao.percentualResidual ??
        pedido.parametrosDepreciacao.valorResidual).replace(".", ","),
    );
    setInicioDepreciacao(pedido.parametrosDepreciacao.dataInicio);
    setPedidoPendente(pedido);
  }, [persistencia.pedido, pedidoPendente]);

  useEffect(() => {
    if (erro || Object.keys(errosCampos).length) painelErro.current?.focus();
  }, [erro, errosCampos]);

  const listaEspecies = especies.dados ?? [];
  const listaSetores = setores.dados ?? [];
  const listaProcessos = processos.dados ?? [];
  const especie = listaEspecies.find((item) => item.id === especieId);
  const setor = listaSetores.find((item) => item.id === setorId);
  const processoCompra = listaProcessos.find(
    (item) => item.id === processoCompraId,
  );
  const valorNumerico = numeroDecimal(valor);
  const valorResidualNumerico = residualEmPercentual
    ? (valorNumerico * numeroDecimal(residual)) / 100
    : numeroDecimal(residual);
  const vidaUtilNumerica = Number(vidaUtil);
  const estimativaMensal =
    valorNumerico > valorResidualNumerico && vidaUtilNumerica > 0
      ? (valorNumerico - valorResidualNumerico) / vidaUtilNumerica
      : null;
  const nomeResumo = descricao.split(",")[0]?.trim() || "Bem sem descrição";
  const carregandoObrigatorios = especies.loading || setores.loading;
  const erroObrigatorios = especies.erro !== null || setores.erro !== null;
  const erroProcessos = processos.erro !== null;
  const formularioBloqueado = criacao.pending || pedidoPendente !== null;

  function limparFormulario() {
    setDescricao("");
    setMarca("");
    setModelo("");
    setSerie("");
    setEspecieId("");
    setSetorId("");
    setSemNumeroOficial(false);
    setTipo("AQUISICAO");
    setProcessoCompraId("");
    setDataTombamento(hojeLocal());
    setValor("");
    setVidaUtil("60");
    setResidual("");
    setResidualEmPercentual(false);
    setInicioDepreciacao(hojeLocal());
    setErrosCampos({});
    setErro(null);
    setDecisao(null);
  }

  async function confirmar(pedido: CriarPatrimonioBodyData) {
    if (envioEmCurso.current) return;
    envioEmCurso.current = true;
    setPedidoPendente(pedido);
    persistencia.salvar(pedido);
    setErro(null);
    setDecisao(null);
    try {
      const resposta = await criacao.confirmar(pedido);
      if (!resposta) return;
      setResultado(resposta.dados);
      setPedidoPendente(null);
      persistencia.salvar(null);
      if (manterDados) {
        setDescricao("");
        setMarca("");
        setModelo("");
        setSerie("");
        setValor("");
        setResidual("");
      }
    } catch (erroCriacao) {
      const proximaDecisao = decidirAposFalha(erroCriacao);
      setErro(erroCriacao);
      setDecisao(proximaDecisao);
      if (proximaDecisao.manterChave) {
        setPedidoPendente(pedido);
        persistencia.salvar(pedido);
      } else {
        setPedidoPendente(null);
        persistencia.salvar(null);
      }
    } finally {
      envioEmCurso.current = false;
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrosCampos({});
    setErro(null);
    if (pedidoPendente) {
      void confirmar(pedidoPendente);
      return;
    }

    const validacao = CriarPatrimonioBodySchema.safeParse({
      chaveIdempotencia: crypto.randomUUID(),
      semNumeroOficial,
      dataTombamento,
      tipoIncorporacao: tipo,
      descricao,
      marca: marca.trim() || undefined,
      modelo: modelo.trim() || undefined,
      numeroSerie: serie.trim() || undefined,
      valorIncorporacao: converterDecimal(valor),
      especieId,
      setorAtualId: setorId,
      processoCompraId:
        tipo === "AQUISICAO" && processoCompraId
          ? processoCompraId
          : undefined,
      parametrosDepreciacao: {
        metodo: "LINEAR",
        vidaUtilInicialMeses: Number(vidaUtil),
        percentualResidual: residualEmPercentual
          ? converterDecimal(residual)
          : undefined,
        valorResidual: valorResidualNumerico.toFixed(2),
        valorBaseInicial: converterDecimal(valor),
        dataInicio: inicioDepreciacao,
      },
    });

    if (!validacao.success) {
      setErrosCampos(
        Object.fromEntries(
          validacao.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      return;
    }
    if (valorResidualNumerico >= valorNumerico) {
      setErrosCampos({
        "parametrosDepreciacao.valorResidual":
          "O valor residual deve ser menor que o valor de incorporação.",
      });
      return;
    }
    void confirmar(validacao.data);
  }

  if (resultado && !manterDados) {
    return (
      <main className={pagina}>
        <section className={`${cartao} grid gap-3`}>
          <Check aria-hidden="true" className="text-green-700" />
          <h1 className="text-xl font-bold">Patrimônio cadastrado</h1>
          <p role="status">
            {resultado.descricao} foi cadastrado com o número patrimonial{" "}
            <strong>{resultado.numeroPatrimonio}</strong>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/patrimonios"
              className="rounded-md bg-[#19355d] px-4 py-2 text-xs font-semibold text-white"
            >
              Consultar patrimônio
            </Link>
            <button
              type="button"
              className="rounded-md border border-[#dfe7f1] px-4 py-2 text-xs font-semibold"
              onClick={() => {
                setResultado(null);
                limparFormulario();
              }}
            >
              Cadastrar outro bem
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold leading-tight text-[#111d34] min-[1500px]:text-[27px]">
            Cadastrar patrimônio
          </h1>
          <p className="mt-1 text-xs text-[#62748e]">
            Identifique o bem e informe sua classificação, origem e localização.
          </p>
        </div>
        <span className="text-[11px] text-[#62748e]">* Campos obrigatórios</span>
      </header>

      {resultado ? (
        <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          Patrimônio {resultado.numeroPatrimonio} cadastrado. Os dados mantidos estão prontos para o próximo bem.
        </p>
      ) : null}

      {erroObrigatorios ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          Não foi possível carregar as espécies ou setores necessários.
          <div className="mt-2 flex gap-3">
                {especies.erro ? <button type="button" className="underline" onClick={() => void especies.carregar()}>Tentar espécies novamente</button> : null}
                {setores.erro ? <button type="button" className="underline" onClick={() => void setores.carregar()}>Tentar setores novamente</button> : null}
          </div>
        </div>
      ) : null}

      {erro || Object.keys(errosCampos).length || pedidoPendente ? (
        <div ref={painelErro} tabIndex={-1} className="grid gap-2 outline-offset-4">
          {erro && decisao && isConflitoIdempotencia(erro) ? (
            <section
              role={decisao.tipo === "ja_processada" ? "status" : "alert"}
              className="grid gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
            >
              <p>{isApiError(erro) ? erro.message : "A confirmação anterior ainda não tem resultado conhecido."}</p>
              {decisao.tipo === "ja_processada" ? <Link href="/patrimonios" className="underline">Consultar patrimônio</Link> : null}
              {decisao.manterChave ? (
                <button
                  type="button"
                  className="w-fit rounded-md border border-amber-500 px-3 py-2 font-semibold disabled:opacity-60"
                  disabled={criacao.pending}
                  onClick={() => pedidoPendente && void confirmar(pedidoPendente)}
                >
                  {criacao.pending ? "Enviando…" : "Tentar novamente com os mesmos dados"}
                </button>
              ) : null}
            </section>
          ) : null}
          {erro && (!decisao || !isConflitoIdempotencia(erro)) ? (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {isApiError(erro) ? erro.message : "Não foi possível cadastrar o patrimônio."}
              {isApiError(erro) && erro.erros.length ? (
                <ul className="mt-2 list-disc pl-5">
                  {erro.erros.map((item, indice) => <li key={`${item.campo}-${indice}`}>{item.mensagem}</li>)}
                </ul>
              ) : null}
              {decisao?.manterChave ? (
                <button
                  type="button"
                  className="mt-3 w-fit rounded-md border border-red-500 px-3 py-2 font-semibold disabled:opacity-60"
                  disabled={criacao.pending}
                  onClick={() => pedidoPendente && void confirmar(pedidoPendente)}
                >
                  Tentar novamente com os mesmos dados
                </button>
              ) : null}
            </div>
          ) : null}
          {pedidoPendente && !erro ? (
            <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              Há um cadastro anterior sem confirmação. Os campos estão bloqueados para preservar o mesmo pedido; tente novamente manualmente.
            </p>
          ) : null}
          {Object.entries(errosCampos).map(([nome, mensagem]) => <p key={nome} className="text-xs text-red-700">{mensagem}</p>)}
        </div>
      ) : null}

      <form onSubmit={enviar}>
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(270px,315px)]">
          <fieldset disabled={formularioBloqueado} className="grid min-w-0 gap-3">
            <Secao titulo="Identificação do bem" Icone={Tag}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
                <label className="block">
                  <Rotulo obrigatorio>Descrição do bem</Rotulo>
                  <input className={campo} value={descricao} required maxLength={1000} onChange={(e) => setDescricao(e.target.value)} />
                </label>
                <div>
                  <label className="flex items-center gap-2 text-[11px] text-[#29456d]">
                    <input type="checkbox" checked={semNumeroOficial} onChange={(e) => setSemNumeroOficial(e.target.checked)} />
                    Bem sem número oficial (S/P)
                  </label>
                  <label className="mt-1 block">
                    <Rotulo>Número patrimonial</Rotulo>
                    <input className={bloqueado} value={semNumeroOficial ? "Sem número oficial" : "Gerado ao cadastrar"} readOnly />
                  </label>
                  <p className="mt-1 text-[10px] text-[#62748e]">Identificação atribuída pelo sistema.</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label><Rotulo>Marca</Rotulo><input className={campo} value={marca} maxLength={100} onChange={(e) => setMarca(e.target.value)} /></label>
                <label><Rotulo>Modelo</Rotulo><input className={campo} value={modelo} maxLength={100} onChange={(e) => setModelo(e.target.value)} /></label>
                <label><Rotulo>Número de série</Rotulo><input className={campo} value={serie} maxLength={100} onChange={(e) => setSerie(e.target.value)} /></label>
              </div>
            </Secao>

            <Secao titulo="Classificação e localização" Icone={MapPin}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label>
                  <Rotulo obrigatorio>Espécie</Rotulo>
                  <select className={campo} required value={especieId} onChange={(e) => setEspecieId(e.target.value)}>
                    <option value="">{especies.loading ? "Carregando…" : "Selecione uma espécie"}</option>
                    {listaEspecies.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </label>
                <label>
                  <Rotulo>Natureza da espécie</Rotulo>
                  <input className={bloqueado} value={especie?.natureza.nome ?? "Definida pela espécie selecionada"} readOnly />
                  <small className="text-[10px] text-[#62748e]">Atualizada conforme a espécie escolhida.</small>
                </label>
                <label>
                  <Rotulo obrigatorio>Setor de destino</Rotulo>
                  <select className={campo} required value={setorId} onChange={(e) => setSetorId(e.target.value)}>
                    <option value="">{setores.loading ? "Carregando…" : "Selecione um setor"}</option>
                    {listaSetores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </label>
                <label>
                  <Rotulo>Responsável do setor</Rotulo>
                  <input className={bloqueado} value={setor?.responsavel.nome ?? "Vinculado ao setor de destino"} readOnly />
                  <small className="text-[10px] text-[#62748e]">Atualizado conforme o setor escolhido.</small>
                </label>
              </div>
            </Secao>

            <Secao titulo="Aquisição e tombamento" Icone={FileText} detalhe="Valores em reais (R$)">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[140px_1fr_145px_145px]">
                <label>
                  <Rotulo obrigatorio>Tipo de tombamento</Rotulo>
                  <select className={campo} value={tipo} onChange={(e) => { setTipo(e.target.value as typeof tipo); setProcessoCompraId(""); }}>
                    {TIPOS_INCORPORACAO.map(([valorTipo, nome]) => <option key={valorTipo} value={valorTipo}>{nome}</option>)}
                  </select>
                </label>
                {tipo === "AQUISICAO" ? (
                  <label>
                    <Rotulo>Aquisição / processo de compra</Rotulo>
                    <select className={campo} value={processoCompraId} onChange={(e) => setProcessoCompraId(e.target.value)}>
                      <option value="">Sem processo vinculado</option>
                      {listaProcessos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {[item.numeroProcesso, item.anoProcesso].filter(Boolean).join("/") || "Processo sem número"}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : <div className="text-[11px] text-[#62748e]">Processo de compra não se aplica a este tipo.</div>}
                <label><Rotulo obrigatorio>Data de tombamento</Rotulo><input className={campo} type="date" required value={dataTombamento} onChange={(e) => setDataTombamento(e.target.value)} /></label>
                <label><Rotulo obrigatorio>Valor de incorporação (R$)</Rotulo><input aria-label="Valor de incorporação (R$)" className={campo} inputMode="decimal" required value={valor} onChange={(e) => setValor(e.target.value)} /></label>
              </div>
              <p className="mt-3 text-[11px] text-[#62748e]">
                {erroProcessos
                  ? "Processos de compra indisponíveis; o vínculo pode ser informado depois."
                  : processoCompra
                    ? `Processo vinculado com ${processoCompra.quantidadeNotas} nota(s) fiscal(is).`
                    : "A vinculação de processo de compra é opcional."}
              </p>
              {erroProcessos && tipo === "AQUISICAO" ? (
                <button type="button" className="mt-1 text-[11px] text-[#2057d6] underline" onClick={() => void processos.carregar()}>
                  Tentar carregar processos novamente
                </button>
              ) : null}
            </Secao>

            <Secao titulo="Depreciação automática" Icone={TrendingDown}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <label><Rotulo>Método</Rotulo><input className={bloqueado} value="Linear" readOnly /></label>
                <label><Rotulo obrigatorio>Vida útil (meses)</Rotulo><input className={campo} type="number" min="1" max="1200" required value={vidaUtil} onChange={(e) => setVidaUtil(e.target.value)} /></label>
                <label>
                  <span className="flex items-center justify-between gap-1">
                    <Rotulo obrigatorio>Residual</Rotulo>
                    <span className="inline-flex rounded-full bg-[#f1f5f9] p-0.5">
                      <button type="button" aria-pressed={!residualEmPercentual} className={`rounded-full px-2 py-1 text-[10px] ${!residualEmPercentual ? "bg-white text-[#2057d6]" : "text-[#62748e]"}`} onClick={() => setResidualEmPercentual(false)}>R$</button>
                      <button type="button" aria-pressed={residualEmPercentual} className={`rounded-full px-2 py-1 text-[10px] ${residualEmPercentual ? "bg-white text-[#2057d6]" : "text-[#62748e]"}`} onClick={() => setResidualEmPercentual(true)}>%</button>
                    </span>
                  </span>
                  <input aria-label="Valor residual" className={campo} inputMode="decimal" required value={residual} onChange={(e) => setResidual(e.target.value)} />
                </label>
                <label><Rotulo obrigatorio>Início da depreciação</Rotulo><input className={campo} type="date" required value={inicioDepreciacao} onChange={(e) => setInicioDepreciacao(e.target.value)} /></label>
                <div>
                  <Rotulo>Estimativa mensal</Rotulo>
                  <p className="mt-2 text-base font-bold text-[#19355d]">{estimativaMensal === null ? "Informe os valores" : formatarMoeda(estimativaMensal)}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-[#62748e]">Estimativa linear calculada com os valores informados.</p>
            </Secao>
          </fieldset>

          <aside className="grid content-start gap-3">
            <section className={cartao}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Resumo do cadastro</h2>
                <span className="rounded-full bg-[#fff8e8] px-2 py-1 text-[10px] text-[#a65b0c]">Em preenchimento</span>
              </div>
              <div className="mt-4 flex items-center gap-3 border-b border-[#dfe7f1] pb-4">
                <Laptop aria-hidden="true" className="size-6 text-[#2860eb]" />
                <div className="min-w-0">
                  <strong className="break-words text-sm">{nomeResumo}</strong>
                  <p className="text-[11px] text-[#62748e]">{[marca, modelo].filter(Boolean).join(" · ") || "Marca e modelo não informados"}</p>
                </div>
              </div>
              <p className="mt-4 text-[10px] uppercase text-[#62748e]">Número patrimonial</p>
              <p className="text-base font-bold">{semNumeroOficial ? "Sem número oficial (S/P)" : "Gerado ao cadastrar"}</p>
              <p className="text-[11px] text-[#62748e]">Identificação atribuída pelo sistema.</p>
              <p className="mt-4 text-[11px] text-[#62748e]">Espécie e natureza</p>
              <p className="text-sm font-bold">{especie ? `${especie.nome} · ${especie.natureza.nome}` : "Não selecionada"}</p>
              <p className="mt-3 text-[11px] text-[#62748e]">Setor de destino</p>
              <p className="text-sm font-bold">{setor?.nome ?? "Não selecionado"}</p>
              <div className="mt-4 rounded-lg bg-[#eef5ff] p-4">
                <p className="text-[11px]">Valor de incorporação</p>
                <p className="break-words text-2xl font-bold text-[#19355d]">{formatarMoeda(valorNumerico)}</p>
                <p className="text-right text-[10px] text-[#62748e]">por bem</p>
              </div>
            </section>
            <section className={cartao}>
              <h2 className="flex items-center gap-2 text-sm font-bold"><FileText aria-hidden="true" className="size-4 text-[#2860eb]" />Documentos da aquisição</h2>
              <p className="mt-3 text-xs font-bold">
                {processoCompra
                  ? `Processo ${[processoCompra.numeroProcesso, processoCompra.anoProcesso].filter(Boolean).join("/") || "sem número"}`
                  : "Nenhum processo selecionado"}
              </p>
              <p className="mt-2 text-[11px] text-[#62748e]">
                {processoCompra
                  ? `${processoCompra.quantidadeNotas} nota(s) fiscal(is) vinculada(s)`
                  : erroProcessos
                    ? "Não foi possível carregar os documentos do processo."
                    : "Selecione um processo para ver os documentos vinculados."}
              </p>
              <p className="mt-3 border-t border-[#dfe7f1] pt-3 text-[11px]">
                Valor total da aquisição{" "}
                <strong className="float-right">{processoCompra?.valorTotal ? formatarMoeda(processoCompra.valorTotal) : "Não informado"}</strong>
              </p>
            </section>
            <section className="rounded-lg border border-[#d9e8ff] bg-[#eef5ff] p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold"><ClipboardCheck aria-hidden="true" className="size-4 text-[#2860eb]" />Confira antes de cadastrar</h2>
              <p className="mt-3 text-[11px] text-[#62748e]">Revise a identificação, o setor e os valores. A API validará os vínculos e os dados contábeis antes de registrar o bem.</p>
            </section>
          </aside>
        </div>

        <footer className={`${cartao} mt-3 flex flex-wrap items-center gap-3`}>
          <Link href="/patrimonios" className="rounded-md border border-[#dfe7f1] px-4 py-2 text-xs font-semibold">Cancelar</Link>
          <label className="mr-auto flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={manterDados} disabled={formularioBloqueado} onChange={(e) => setManterDados(e.target.checked)} />
            Manter dados para cadastrar outro bem
          </label>
          <button type="submit" className="rounded-md bg-[#19355d] px-5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={criacao.pending || carregandoObrigatorios || Boolean(erroObrigatorios)}>
            {criacao.pending ? "Cadastrando…" : pedidoPendente ? "Tentar novamente" : "Cadastrar patrimônio"}
          </button>
        </footer>
      </form>
    </main>
  );
}