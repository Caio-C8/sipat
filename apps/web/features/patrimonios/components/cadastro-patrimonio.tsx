"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
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
  compareDecimal,
  divideDecimalByInteger,
  formatBrl,
  multiplyDecimal,
  subtractDecimal,
} from "@/lib/format/decimal";
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
  usePreviaNumeracaoPatrimonio,
} from "../api/hooks";
import {
  ComboboxField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/shared/form-fields";
import { IntegerInput, MoneyInput } from "@/components/shared/numeric-inputs";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-3 px-4 py-4 text-foreground min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]";
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
    <Card
      asChild
      className="min-w-0 gap-3 px-3.5 py-3 min-[1500px]:px-[19px] min-[1500px]:py-4"
    >
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <span className="rounded-md bg-accent p-2 text-interactive">
              <Icone className="size-4" />
            </span>
            {titulo}
          </h2>
          {detalhe && (
            <small className="text-muted-foreground">{detalhe}</small>
          )}
        </div>
        {children}
      </section>
    </Card>
  );
}

function InformacaoDerivada({
  titulo,
  valor,
  ajuda,
}: {
  titulo: string;
  valor: string;
  ajuda: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-semibold text-brand-deep">{valor}</p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
        {ajuda}
      </p>
    </div>
  );
}

function converterDecimal(valor: string) {
  const normalizado = valor.trim();
  return normalizado.includes(",")
    ? normalizado.replace(/\./g, "").replace(",", ".")
    : normalizado;
}

function decimalMonetarioOuZero(valor: string) {
  const normalizado = converterDecimal(valor);
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalizado)) return "0.00";
  if (normalizado.endsWith(".")) return `${normalizado}00`;
  const [inteiro, fracao = ""] = normalizado.split(".");
  return `${inteiro}.${fracao.padEnd(2, "0")}`;
}

function hojeLocal() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function CadastroPatrimonio({ usuarioId }: { usuarioId: string }) {
  const {
    dados: especiesDados,
    erro: erroEspecies,
    loading: carregandoEspecies,
    carregar: carregarEspecies,
  } = useEspeciesPatrimonio();
  const {
    dados: setoresDados,
    erro: erroSetores,
    loading: carregandoSetores,
    carregar: carregarSetores,
  } = useSetoresPatrimonio();
  const {
    dados: processosDados,
    erro: erroProcessos,
    carregar: carregarProcessos,
  } = useProcessosCompraPatrimonio();
  const criacao = useCriarPatrimonio();
  const {
    dados: dadosPreviaNumeracao,
    loading: carregandoPreviaNumeracao,
    carregar: carregarPreviaNumeracao,
  } = usePreviaNumeracaoPatrimonio();
  const persistencia = usePatrimonioPendente(usuarioId);
  const [descricao, setDescricao] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [especieId, setEspecieId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [semNumeroOficial, setSemNumeroOficial] = useState(false);
  const [tipo, setTipo] =
    useState<(typeof TIPOS_INCORPORACAO)[number][0]>("AQUISICAO");
  const [processoCompraId, setProcessoCompraId] = useState("");
  const [dataTombamento, setDataTombamento] = useState(hojeLocal);
  const [valor, setValor] = useState("");
  const [depreciavel, setDepreciavel] = useState(false);
  const [vidaUtil, setVidaUtil] = useState("");
  const [residual, setResidual] = useState("");
  const [residualEmPercentual, setResidualEmPercentual] = useState(false);
  const [manterDados, setManterDados] = useState(false);
  const [pedidoPendente, setPedidoPendente] =
    useState<CriarPatrimonioBodyData | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [decisao, setDecisao] = useState<DecisaoIdempotencia | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<
    CriarPatrimonioResponse["dados"] | null
  >(null);
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const painelErro = useRef<HTMLDivElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const envioEmCurso = useRef(false);

  useEffect(() => {
    void carregarEspecies();
    void carregarSetores();
    void carregarProcessos();
    void carregarPreviaNumeracao();
  }, [
    carregarEspecies,
    carregarSetores,
    carregarProcessos,
    carregarPreviaNumeracao,
  ]);

  useEffect(() => {
    if (Object.keys(errosCampos).length) {
      formulario.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
      return;
    }
    if (erro) painelErro.current?.focus();
  }, [erro, errosCampos]);

  const pedidoAtual = pedidoPendente ?? persistencia.pedido;
  const descricaoAtual = pedidoAtual?.descricao ?? descricao;
  const marcaAtual = pedidoAtual?.marca ?? marca;
  const modeloAtual = pedidoAtual?.modelo ?? modelo;
  const serieAtual = pedidoAtual?.numeroSerie ?? serie;
  const especieIdAtual = pedidoAtual?.especieId ?? especieId;
  const setorIdAtual = pedidoAtual?.setorAtualId ?? setorId;
  const semNumeroOficialAtual =
    pedidoAtual?.semNumeroOficial ?? semNumeroOficial;
  const tipoAtual = pedidoAtual?.tipoIncorporacao ?? tipo;
  const processoCompraIdAtual =
    pedidoAtual?.processoCompraId ?? processoCompraId;
  const dataTombamentoAtual = pedidoAtual?.dataTombamento ?? dataTombamento;
  const valorAtual = pedidoAtual ? pedidoAtual.valorIncorporacao : valor;
  const depreciavelAtual = pedidoAtual?.depreciavel ?? depreciavel;
  const parametrosAtuais = pedidoAtual?.depreciavel
    ? pedidoAtual.parametrosDepreciacao
    : undefined;
  const vidaUtilAtual = parametrosAtuais
    ? String(parametrosAtuais.vidaUtilInicialMeses)
    : vidaUtil;
  const residualEmPercentualAtual = parametrosAtuais
    ? parametrosAtuais.percentualResidual !== undefined
    : residualEmPercentual;
  const residualAtual = parametrosAtuais
    ? (parametrosAtuais.percentualResidual ?? parametrosAtuais.valorResidual)
    : residual;
  const listaEspecies = especiesDados ?? [];
  const listaSetores = setoresDados ?? [];
  const listaProcessos = processosDados ?? [];
  const especie = listaEspecies.find((item) => item.id === especieIdAtual);
  const setor = listaSetores.find((item) => item.id === setorIdAtual);
  const processoCompra = listaProcessos.find(
    (item) => item.id === processoCompraIdAtual,
  );
  const valorDecimal = decimalMonetarioOuZero(valorAtual);
  const residualDecimal = decimalMonetarioOuZero(residualAtual);
  const valorResidualDecimal = residualEmPercentualAtual
    ? divideDecimalByInteger(
        multiplyDecimal(valorDecimal, residualDecimal, 4),
        "100",
        2,
      )
    : residualDecimal;
  const vidaUtilValida = /^[1-9]\d*$/.test(vidaUtilAtual);
  const estimativaMensal =
    depreciavelAtual &&
    compareDecimal(valorDecimal, valorResidualDecimal) > 0 &&
    vidaUtilValida
      ? divideDecimalByInteger(
          subtractDecimal(valorDecimal, valorResidualDecimal, 2),
          vidaUtilAtual,
          7,
        )
      : null;
  const nomeResumo =
    descricaoAtual.split(",")[0]?.trim() || "Bem sem descrição";
  const carregandoObrigatorios = carregandoEspecies || carregandoSetores;
  const numeroPrevisto = semNumeroOficialAtual
    ? dadosPreviaNumeracao?.numeroSemOficial
    : dadosPreviaNumeracao?.numeroOficial;
  const formularioAlterado = Boolean(
    descricao ||
    marca ||
    modelo ||
    serie ||
    especieId ||
    setorId ||
    semNumeroOficial ||
    tipo !== "AQUISICAO" ||
    processoCompraId ||
    dataTombamento !== hojeLocal() ||
    valor ||
    depreciavel ||
    vidaUtil ||
    residual ||
    residualEmPercentual,
  );
  const erroObrigatorios = erroEspecies !== null || erroSetores !== null;
  const formularioBloqueado = criacao.pending || pedidoAtual !== null;

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
    setDepreciavel(false);
    setVidaUtil("");
    setResidual("");
    setResidualEmPercentual(false);
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
      toast.success("Patrimônio cadastrado.");
      setPedidoPendente(null);
      persistencia.salvar(null);
      if (manterDados) {
        setDescricao("");
        setMarca("");
        setModelo("");
        setSerie("");
        setValor("");
        setDepreciavel(false);
        setVidaUtil("");
        setResidual("");
        void carregarPreviaNumeracao();
      }
    } catch (erroCriacao) {
      const proximaDecisao = decidirAposFalha(erroCriacao);
      setErro(erroCriacao);
      if (isApiError(erroCriacao) && erroCriacao.erros.length) {
        setErrosCampos(
          Object.fromEntries(
            erroCriacao.erros.map((item) => [item.campo, item.mensagem]),
          ),
        );
      }
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
    if (pedidoAtual) {
      void confirmar(pedidoAtual);
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
        tipo === "AQUISICAO" && processoCompraId ? processoCompraId : undefined,
      depreciavel,
      ...(depreciavel
        ? {
            parametrosDepreciacao: {
              metodo: "LINEAR",
              vidaUtilInicialMeses: Number(vidaUtil),
              percentualResidual: residualEmPercentual
                ? converterDecimal(residual)
                : undefined,
              valorResidual: valorResidualDecimal,
              valorBaseInicial: converterDecimal(valor),
            },
          }
        : {}),
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
    if (
      depreciavel &&
      compareDecimal(valorResidualDecimal, valorDecimal) >= 0
    ) {
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
        <PageHeader
          title="Patrimônio cadastrado"
          description="O bem foi incluído com sucesso no patrimônio da Câmara."
        />
        <Card asChild className="grid gap-3">
          <section>
            <Check aria-hidden="true" className="text-green-700" />
            <p role="status">
              {resultado.descricao} foi cadastrado com o número patrimonial{" "}
              <strong>{resultado.numeroPatrimonio}</strong>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/patrimonios">Consultar patrimônio</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResultado(null);
                  limparFormulario();
                }}
              >
                Cadastrar outro bem
              </Button>
            </div>
          </section>
        </Card>
      </main>
    );
  }

  return (
    <main className={pagina}>
      <PageHeader
        title="Cadastrar patrimônio"
        description="Identifique o bem e informe sua classificação, origem e localização. Campos obrigatórios estão identificados com asterisco."
      />

      {resultado ? (
        <Alert>
          <AlertTitle>Dados preservados para o próximo cadastro</AlertTitle>
          <AlertDescription>
            O patrimônio {resultado.numeroPatrimonio} foi cadastrado. Revise os
            dados mantidos antes de registrar o próximo bem.
          </AlertDescription>
        </Alert>
      ) : null}

      {erroObrigatorios ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível preparar o cadastro</AlertTitle>
          <AlertDescription>
            Carregue novamente as espécies ou os setores necessários.
            <div className="mt-2 flex gap-3">
              {erroEspecies ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void carregarEspecies()}
                >
                  Tentar espécies novamente
                </Button>
              ) : null}
              {erroSetores ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void carregarSetores()}
                >
                  Tentar setores novamente
                </Button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {erro || Object.keys(errosCampos).length || pedidoAtual ? (
        <div
          ref={painelErro}
          tabIndex={-1}
          className="grid gap-2 outline-offset-4"
        >
          {erro && decisao && isConflitoIdempotencia(erro) ? (
            <Alert>
              <AlertTitle>Confirme o resultado antes de continuar</AlertTitle>
              <AlertDescription className="grid gap-3">
                <p>
                  {isApiError(erro)
                    ? erro.message
                    : "A confirmação anterior ainda não tem resultado conhecido."}
                </p>
                {decisao.tipo === "ja_processada" ? (
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link href="/patrimonios">Consultar patrimônio</Link>
                  </Button>
                ) : null}
                {decisao.manterChave ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    disabled={criacao.pending}
                    onClick={() => pedidoAtual && void confirmar(pedidoAtual)}
                  >
                    {criacao.pending
                      ? "Enviando…"
                      : "Tentar novamente com os mesmos dados"}
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
          {erro && (!decisao || !isConflitoIdempotencia(erro)) ? (
            <Alert variant="destructive">
              <AlertTitle>Revise o cadastro</AlertTitle>
              <AlertDescription>
                {isApiError(erro)
                  ? erro.message
                  : "Não foi possível cadastrar o patrimônio."}
                {isApiError(erro) && erro.erros.length ? (
                  <ul className="mt-2 list-disc pl-5">
                    {erro.erros.map((item, indice) => (
                      <li key={`${item.campo}-${indice}`}>{item.mensagem}</li>
                    ))}
                  </ul>
                ) : null}
                {decisao?.manterChave ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-fit"
                    disabled={criacao.pending}
                    onClick={() => pedidoAtual && void confirmar(pedidoAtual)}
                  >
                    Tentar novamente com os mesmos dados
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
          {pedidoAtual && !erro ? (
            <Alert>
              <AlertTitle>Cadastro anterior aguardando confirmação</AlertTitle>
              <AlertDescription>
                Os campos estão bloqueados para preservar os mesmos dados. Tente
                novamente quando estiver pronto.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}

      <form ref={formulario} onSubmit={enviar} noValidate>
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(270px,315px)]">
          <fieldset
            disabled={formularioBloqueado}
            className="grid min-w-0 gap-3"
          >
            <Secao titulo="Identificação do bem" Icone={Tag}>
              <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <TextareaField
                  id="descricao"
                  label="Descrição do bem"
                  value={descricaoAtual}
                  required
                  maxLength={1000}
                  rows={3}
                  error={errosCampos.descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
                <Card className="gap-2 bg-accent p-3 shadow-none">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Próximo número previsto
                  </p>
                  <p className="mt-1 text-xl font-bold text-brand-deep">
                    {carregandoPreviaNumeracao
                      ? "Consultando…"
                      : (numeroPrevisto ?? "Indisponível")}
                  </p>
                  <Label className="mt-3 flex items-center gap-2 text-xs font-medium">
                    <Checkbox
                      checked={semNumeroOficialAtual}
                      onCheckedChange={(checked) =>
                        setSemNumeroOficial(checked === true)
                      }
                    />
                    Gerar identificação não oficial (S/P)
                  </Label>
                  <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                    {semNumeroOficialAtual
                      ? "O número não oficial é atribuído na confirmação, pode mudar por concorrência e não será convertido automaticamente em oficial."
                      : "O número oficial é atribuído na confirmação e pode mudar por concorrência."}
                  </p>
                </Card>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <TextField
                  id="marca"
                  label="Marca"
                  value={marcaAtual}
                  maxLength={100}
                  error={errosCampos.marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
                <TextField
                  id="modelo"
                  label="Modelo"
                  value={modeloAtual}
                  maxLength={100}
                  error={errosCampos.modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
                <TextField
                  id="numeroSerie"
                  label="Número de série"
                  value={serieAtual}
                  maxLength={100}
                  error={errosCampos.numeroSerie}
                  onChange={(e) => setSerie(e.target.value)}
                />
              </div>
            </Secao>

            <Secao titulo="Classificação e localização" Icone={MapPin}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid content-start gap-3 rounded-lg border border-border p-3">
                  <ComboboxField
                    id="especieId"
                    label="Espécie"
                    required
                    value={especieIdAtual}
                    onValueChange={setEspecieId}
                    options={listaEspecies.map((item) => ({
                      value: item.id,
                      label: item.nome,
                    }))}
                    loading={carregandoEspecies}
                    disabled={formularioBloqueado}
                    error={errosCampos.especieId}
                    searchPlaceholder="Buscar espécie…"
                  />
                  <InformacaoDerivada
                    titulo="Natureza determinada pela espécie"
                    valor={especie?.natureza.nome ?? "Selecione uma espécie"}
                    ajuda="Este dado é vinculado ao cadastro da espécie e não pode ser alterado aqui."
                  />
                </div>
                <div className="grid content-start gap-3 rounded-lg border border-border p-3">
                  <ComboboxField
                    id="setorAtualId"
                    label="Setor de destino"
                    required
                    value={setorIdAtual}
                    onValueChange={setSetorId}
                    options={listaSetores.map((item) => ({
                      value: item.id,
                      label: item.nome,
                    }))}
                    loading={carregandoSetores}
                    disabled={formularioBloqueado}
                    error={errosCampos.setorAtualId}
                    searchPlaceholder="Buscar setor…"
                  />
                  <InformacaoDerivada
                    titulo="Responsável determinado pelo setor"
                    valor={setor?.responsavel.nome ?? "Selecione um setor"}
                    ajuda="O responsável acompanha o setor escolhido e não pode ser alterado neste cadastro."
                  />
                </div>
              </div>
            </Secao>

            <Secao titulo="Aquisição e tombamento" Icone={FileText}>
              <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  id="tipoIncorporacao"
                  label="Tipo de tombamento"
                  required
                  value={tipoAtual}
                  onValueChange={(value) => {
                    setTipo(value as typeof tipo);
                    setProcessoCompraId("");
                  }}
                  options={TIPOS_INCORPORACAO.map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  error={errosCampos.tipoIncorporacao}
                />
                {tipoAtual === "AQUISICAO" ? (
                  <ComboboxField
                    id="processoCompraId"
                    label="Aquisição / processo de compra"
                    value={processoCompraIdAtual}
                    onValueChange={setProcessoCompraId}
                    options={listaProcessos.map((item) => ({
                      value: item.id,
                      label:
                        [item.numeroProcesso, item.anoProcesso]
                          .filter(Boolean)
                          .join("/") || "Processo sem número",
                    }))}
                    disabled={formularioBloqueado}
                    placeholder="Sem processo vinculado"
                    searchPlaceholder="Buscar processo…"
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted p-3 text-xs text-muted-foreground">
                    Processo de compra não se aplica a este tipo.
                  </div>
                )}
                <TextField
                  id="dataTombamento"
                  label="Data de tombamento"
                  type="date"
                  required
                  value={dataTombamentoAtual}
                  error={errosCampos.dataTombamento}
                  onChange={(e) => setDataTombamento(e.target.value)}
                />
                <Field data-invalid={Boolean(errosCampos.valorIncorporacao)}>
                  <FieldLabel htmlFor="valorIncorporacao">
                    Valor de incorporação (R$) *
                  </FieldLabel>
                  <MoneyInput
                    id="valorIncorporacao"
                    required
                    value={valorAtual}
                    onValueChange={setValor}
                    aria-invalid={
                      Boolean(errosCampos.valorIncorporacao) || undefined
                    }
                  />
                  {errosCampos.valorIncorporacao ? (
                    <FieldError>{errosCampos.valorIncorporacao}</FieldError>
                  ) : null}
                </Field>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {erroProcessos
                  ? "Processos de compra indisponíveis; o vínculo pode ser informado depois."
                  : processoCompra
                    ? `Processo vinculado com ${processoCompra.quantidadeNotas} nota(s) fiscal(is).`
                    : "A vinculação de processo de compra é opcional."}
              </p>
              {erroProcessos && tipoAtual === "AQUISICAO" ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 px-0 text-[11px]"
                  onClick={() => void carregarProcessos()}
                >
                  Tentar carregar processos novamente
                </Button>
              ) : null}
            </Secao>

            <Secao titulo="Depreciação automática" Icone={TrendingDown}>
              <Label className="flex items-start gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  className="mt-0.5"
                  checked={depreciavelAtual}
                  onCheckedChange={(checked) => {
                    setDepreciavel(checked === true);
                    setVidaUtil("");
                    setResidual("");
                    setResidualEmPercentual(false);
                  }}
                />
                <span>
                  <strong className="block text-xs">
                    Este bem é depreciável
                  </strong>
                  <small className="text-muted-foreground">
                    Quando marcada, a vida útil e o residual são obrigatórios. A
                    depreciação começa após a confirmação de disponibilidade
                    para uso.
                  </small>
                </span>
              </Label>
              {depreciavelAtual ? (
                <>
                  <div className="mt-4 grid items-start gap-4 lg:grid-cols-[180px_180px_minmax(0,1fr)_220px]">
                    <InformacaoDerivada
                      titulo="Método de depreciação"
                      valor="Linear"
                      ajuda="Método institucional aplicado automaticamente."
                    />
                    <Field
                      data-invalid={Boolean(
                        errosCampos[
                          "parametrosDepreciacao.vidaUtilInicialMeses"
                        ],
                      )}
                    >
                      <FieldLabel htmlFor="vidaUtil">
                        Vida útil (meses) *
                      </FieldLabel>
                      <IntegerInput
                        id="vidaUtil"
                        required
                        value={vidaUtilAtual}
                        onValueChange={setVidaUtil}
                        aria-invalid={
                          Boolean(
                            errosCampos[
                              "parametrosDepreciacao.vidaUtilInicialMeses"
                            ],
                          ) || undefined
                        }
                      />
                      {errosCampos[
                        "parametrosDepreciacao.vidaUtilInicialMeses"
                      ] ? (
                        <FieldError>
                          {
                            errosCampos[
                              "parametrosDepreciacao.vidaUtilInicialMeses"
                            ]
                          }
                        </FieldError>
                      ) : null}
                    </Field>
                    <div className="grid gap-2">
                      <Label>Como informar o residual *</Label>
                      <RadioGroup
                        className="grid grid-cols-2 gap-2"
                        value={
                          residualEmPercentualAtual ? "percentual" : "valor"
                        }
                        onValueChange={(value) => {
                          setResidual("");
                          setResidualEmPercentual(value === "percentual");
                        }}
                      >
                        <Label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 has-data-checked:border-primary has-data-checked:bg-accent">
                          <RadioGroupItem value="valor" />
                          <span>
                            <strong className="block text-xs">
                              Valor em reais
                            </strong>
                            <span className="text-[10px] text-muted-foreground">
                              Informar em R$
                            </span>
                          </span>
                        </Label>
                        <Label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 has-data-checked:border-primary has-data-checked:bg-accent">
                          <RadioGroupItem value="percentual" />
                          <span>
                            <strong className="block text-xs">
                              Percentual
                            </strong>
                            <span className="text-[10px] text-muted-foreground">
                              Informar em %
                            </span>
                          </span>
                        </Label>
                      </RadioGroup>
                      <Field
                        data-invalid={Boolean(
                          errosCampos["parametrosDepreciacao.valorResidual"] ||
                          errosCampos[
                            "parametrosDepreciacao.percentualResidual"
                          ],
                        )}
                      >
                        <FieldLabel htmlFor="valorResidual">
                          {residualEmPercentualAtual
                            ? "Percentual residual (%) *"
                            : "Valor residual (R$) *"}
                        </FieldLabel>
                        {residualEmPercentualAtual ? (
                          <Input
                            id="valorResidual"
                            inputMode="decimal"
                            required
                            value={residualAtual}
                            placeholder="Ex.: 10"
                            aria-invalid={
                              Boolean(
                                errosCampos[
                                  "parametrosDepreciacao.percentualResidual"
                                ],
                              ) || undefined
                            }
                            onChange={(evento) =>
                              setResidual(
                                evento.target.value
                                  .replace(/[^\d,.]/g, "")
                                  .replace(",", "."),
                              )
                            }
                          />
                        ) : (
                          <MoneyInput
                            id="valorResidual"
                            required
                            value={residualAtual}
                            onValueChange={setResidual}
                            aria-invalid={
                              Boolean(
                                errosCampos[
                                  "parametrosDepreciacao.valorResidual"
                                ],
                              ) || undefined
                            }
                          />
                        )}
                        {errosCampos["parametrosDepreciacao.valorResidual"] ||
                        errosCampos[
                          "parametrosDepreciacao.percentualResidual"
                        ] ? (
                          <FieldError>
                            {errosCampos[
                              "parametrosDepreciacao.valorResidual"
                            ] ??
                              errosCampos[
                                "parametrosDepreciacao.percentualResidual"
                              ]}
                          </FieldError>
                        ) : null}
                      </Field>
                      <p className="text-[10px] text-muted-foreground">
                        Equivalente calculado: {formatBrl(valorResidualDecimal)}
                      </p>
                    </div>
                    <Card className="gap-2 bg-accent p-3 shadow-none">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Estimativa mensal
                      </p>
                      <p className="mt-2 text-base font-bold text-brand-deep">
                        {estimativaMensal === null
                          ? "Informe os valores"
                          : formatBrl(estimativaMensal)}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Cálculo linear informativo.
                      </p>
                    </Card>
                  </div>
                </>
              ) : null}
            </Secao>
          </fieldset>

          <aside className="grid content-start gap-3">
            <Card asChild className="gap-3">
              <section>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold">Resumo do cadastro</h2>
                  <Badge variant="outline">Em preenchimento</Badge>
                </div>
                <div className="mt-4 flex items-center gap-3 border-b border-border pb-4">
                  <Laptop
                    aria-hidden="true"
                    className="size-6 text-interactive"
                  />
                  <div className="min-w-0">
                    <strong className="break-words text-sm">
                      {nomeResumo}
                    </strong>
                    <p className="text-[11px] text-muted-foreground">
                      {[marcaAtual, modeloAtual].filter(Boolean).join(" · ") ||
                        "Marca e modelo não informados"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-[10px] uppercase text-muted-foreground">
                  Número patrimonial
                </p>
                <p className="text-base font-bold">
                  {semNumeroOficialAtual
                    ? (numeroPrevisto ?? "SP-…")
                    : (numeroPrevisto ?? "…")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Prévia não reservada; o número definitivo será confirmado ao
                  cadastrar.
                </p>
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Espécie e natureza
                </p>
                <p className="text-sm font-bold">
                  {especie
                    ? `${especie.nome} · ${especie.natureza.nome}`
                    : "Não selecionada"}
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Setor de destino
                </p>
                <p className="text-sm font-bold">
                  {setor?.nome ?? "Não selecionado"}
                </p>
                <div className="mt-4 rounded-lg bg-accent p-4">
                  <p className="text-[11px]">Valor de incorporação</p>
                  <p className="break-words text-2xl font-bold text-brand-deep">
                    {formatBrl(valorDecimal)}
                  </p>
                  <p className="text-right text-[10px] text-muted-foreground">
                    por bem
                  </p>
                </div>
              </section>
            </Card>
            <Card asChild className="gap-3">
              <section>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <FileText
                    aria-hidden="true"
                    className="size-4 text-interactive"
                  />
                  Documentos da aquisição
                </h2>
                <p className="mt-3 text-xs font-bold">
                  {processoCompra
                    ? `Processo ${[processoCompra.numeroProcesso, processoCompra.anoProcesso].filter(Boolean).join("/") || "sem número"}`
                    : "Nenhum processo selecionado"}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {processoCompra
                    ? `${processoCompra.quantidadeNotas} nota(s) fiscal(is) vinculada(s)`
                    : erroProcessos
                      ? "Não foi possível carregar os documentos do processo."
                      : "Selecione um processo para ver os documentos vinculados."}
                </p>
                <p className="mt-3 border-t border-border pt-3 text-[11px]">
                  Valor total da aquisição{" "}
                  <strong className="float-right">
                    {processoCompra?.valorTotal
                      ? formatBrl(processoCompra.valorTotal)
                      : "Não informado"}
                  </strong>
                </p>
              </section>
            </Card>
            <Alert>
              <ClipboardCheck aria-hidden="true" />
              <AlertTitle>Confira antes de cadastrar</AlertTitle>
              <AlertDescription>
                Revise a identificação, o setor e os valores antes de registrar
                o bem.
              </AlertDescription>
            </Alert>
          </aside>
        </div>

        <Card asChild className="mt-3 flex-row flex-wrap items-center gap-3">
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={formularioBloqueado}
              onClick={() => {
                if (formularioAlterado) setConfirmarLimpeza(true);
                else limparFormulario();
              }}
            >
              Limpar
            </Button>
            <Label className="mr-auto flex items-center gap-2 text-[11px]">
              <Checkbox
                checked={manterDados}
                disabled={formularioBloqueado}
                onCheckedChange={(checked) => setManterDados(checked === true)}
              />
              Manter dados para cadastrar outro bem
            </Label>
            <Button
              type="submit"
              size="lg"
              disabled={
                criacao.pending ||
                carregandoObrigatorios ||
                Boolean(erroObrigatorios)
              }
            >
              {criacao.pending
                ? "Cadastrando…"
                : pedidoAtual
                  ? "Tentar novamente"
                  : "Cadastrar patrimônio"}
            </Button>
          </div>
        </Card>
      </form>
      <Dialog open={confirmarLimpeza} onOpenChange={setConfirmarLimpeza}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar o cadastro?</DialogTitle>
            <DialogDescription>
              As alterações ainda não confirmadas serão descartadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmarLimpeza(false)}
            >
              Continuar preenchendo
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                limparFormulario();
                setConfirmarLimpeza(false);
              }}
            >
              Limpar cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
