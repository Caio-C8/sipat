import { isApiError } from "@/lib/api/core/api-error";
export function mensagemRelatorio(e: unknown): string {
  if (typeof e === "string") return e;
  if (isApiError(e)) {
    if (e.status === 401) return "Sessão expirada. Entre novamente.";
    if (e.status === 403)
      return "Você não possui permissão para consultar este relatório.";
    if (e.status === 400 || e.codigo === "VALIDACAO_ENTRADA_INVALIDA")
      return "Os filtros não foram aceitos. Limpe ou revise os valores informados e consulte novamente.";
    if (e.status !== null && e.status >= 500)
      return "O serviço de relatórios está temporariamente indisponível. Tente novamente em instantes.";
    if (e.categoria === "rede" || e.categoria === "timeout")
      return "Não foi possível acessar o serviço de relatórios. Verifique a conexão e tente novamente.";
    return e.message;
  }
  return "Não foi possível carregar os registros. Tente novamente; se o problema continuar, atualize a página.";
}
export function rotulo(campo: string): string {
  const nomes: Record<string, string> = {
    id: "Identificador",
    patrimonioId: "Patrimônio",
    numeroPatrimonio: "Número patrimonial atual",
    descricao: "Descrição atual",
    inicio: "Início",
    fim: "Fim",
    competencia: "Competência",
    primeiraCompetencia: "Primeira competência",
    ultimaCompetenciaProcessada: "Última competência processada",
    competenciaEsperada: "Competência esperada",
    competenciaMaisAntiga: "Competência mais antiga",
    quantidadePendencias: "Quantidade de pendências",
    quantidadeCompetencias: "Quantidade de competências",
    bensDistintos: "Bens distintos",
    valorResidual: "Valor residual (R$)",
    quotaPrevista: "Quota prevista (R$)",
    valorIncorporacao: "Incorporação (R$)",
    valorBrutoAtual: "Bruto atual (R$)",
    depreciacaoAcumuladaAtual: "Acumulado atual (R$)",
    valorLiquidoAtual: "Líquido atual (R$)",
    valorOrcamento: "Orçamento vigente (R$)",
    valorRealizado: "Realizado (R$)",
    valorDepreciado: "Quota (R$)",
    valorContabilAnterior: "Líquido anterior (R$)",
    valorContabilNovo: "Líquido posterior (R$)",
    valorReavaliado: "Valor reavaliado (R$)",
    valorResidualNovo: "Novo residual (R$)",
    valorLiquidoAnterior: "Líquido anterior (R$)",
    dataReavaliacao: "Data da reavaliação",
    dataTransferencia: "Data da movimentação",
    dataEnvio: "Envio",
    dataBaixa: "Data da baixa",
    dataSaida: "Saída",
    previsao: "Previsão de devolução",
    setorOrigem: "Setor de origem",
    setorDestino: "Setor de destino",
    setorEsperado: "Setor esperado",
    verificacao: "Conferência",
    fornecedor: "Fornecedor",
    pedidoId: "Pedido",
    motivo: "Motivo",
    destinatario: "Destinatário",
    situacao: "Situação",
    tipo: "Tipo",
    tipoNumeroPatrimonial: "Tipo de número patrimonial",
    dataTombamento: "Data de tombamento",
    status: "Situação",
    quantidade: "Quantidade de registros",
    quotas: "Quotas do período (R$)",
    brutoAtual: "Total bruto atual (R$)",
    acumuladoAtual: "Total acumulado atual (R$)",
    liquidoAtual: "Total líquido atual (R$)",
    incorporacao: "Total de incorporação (R$)",
    orcamentoConhecido: "Orçamento conhecido (R$)",
    realizadoConhecido: "Realizado conhecido (R$)",
    semContabilidade: "Bens sem contabilidade",
    correcao: "Correção original",
    correcaoPosterior: "Correção posterior",
    statusNaVerificacao: "Status na verificação",
    setorAtual: "Setor atual",
    responsavelAtual: "Responsável atual",
    salaAtual: "Sala atual",
    ordenacao: "Ordenação",
    tipoNumero: "Tipo de número",
    registroEm: "Registrado em",
    precisao: "Detalhamento da data",
    ocorrencia: "Ocorrência",
    atributos: "Detalhes do evento",
    numeroSnapshot: "Número registrado no evento",
    descricaoSnapshot: "Descrição registrada no evento",
    comissaoSnapshot: "Comissão registrada no evento",
    autorSnapshot: "Responsável pelo evento",
    parametroAnteriorId: "Parâmetro anterior",
  };
  return (
    nomes[campo] ??
    campo
      .replace(/Id$/, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (x) => x.toUpperCase())
  );
}

const formatadorDataHoraRelatorio = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "medium",
});

function formatarInstanteRelatorio(valor: string): string | null {
  const partes =
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}(?::?\d{2})?)?$/.exec(
      valor,
    );
  if (!partes) return null;
  let fuso = partes[4] ?? "Z";
  if (/^[+-]\d{2}$/.test(fuso)) fuso += ":00";
  else if (/^[+-]\d{4}$/.test(fuso))
    fuso = `${fuso.slice(0, 3)}:${fuso.slice(3)}`;
  const fracao = partes[3]?.slice(0, 4) ?? "";
  const data = new Date(`${partes[1]}T${partes[2]}${fracao}${fuso}`);
  return Number.isNaN(data.getTime())
    ? null
    : formatadorDataHoraRelatorio.format(data);
}

export function valor(v: unknown): string {
  if (v === null || v === undefined) return "Não informado no registro";
  if (Array.isArray(v)) return v.map(valor).join("; ");
  if (typeof v === "object")
    return Object.entries(v)
      .map(([k, x]) => `${rotulo(k)}: ${valor(x)}`)
      .join("; ");
  if (typeof v === "string" && /^-?\d+\.\d{7}$/.test(v)) {
    const [a, b] = v.split(".");
    return `${a!.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${b}`;
  }
  if (typeof v === "string" && /^\d{4}-\d{2}$/.test(v)) {
    const [ano, mes] = v.split("-");
    return `${mes}/${ano}`;
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [ano, mes, dia] = v.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  if (typeof v === "string") {
    const instante = formatarInstanteRelatorio(v);
    if (instante) return instante;
  }
  if (typeof v === "string" && /^[A-Z][A-Z_]+$/.test(v)) return rotuloOpcao(v);
  return String(v);
}
export function rotuloOpcao(v: string): string {
  const nomes: Record<string, string> = {
    NUMERO: "Número patrimonial",
    TOMBAMENTO: "Data de tombamento",
    OFICIAL: "Com número oficial",
    SEM_NUMERO_OFICIAL: "Sem número oficial",
    ATIVO: "Ativo",
    BAIXADO: "Baixado",
    EMPRESTADO: "Emprestado",
    EM_MANUTENCAO: "Em manutenção",
    ENVIO: "Envio",
    RETORNO: "Retorno",
    PREVENTIVA: "Preventiva",
    CORRETIVA: "Corretiva",
    PENDENTE: "Pendente",
    RETORNADO: "Retornado",
    REGISTRO: "Data do registro",
    REFERENCIA: "Data de referência",
    VERIFICADO: "Verificado",
    CORRETO: "Correto",
    DIVERGENCIA: "Divergência",
    NAO_LOCALIZADO: "Não localizado",
    CORRIGIDO: "Corrigido",
    SAIDA: "Saída",
    PREVISAO: "Previsão",
    DEVOLUCAO: "Devolução",
    DEVOLVIDO: "Devolvido",
    ALIENACAO: "Alienação",
    INUTILIZACAO: "Inutilização",
    SINISTRO: "Sinistro",
    FURTO: "Furto",
    EXTRAVIO: "Extravio",
    TRANSFERENCIA: "Transferência",
    RECLASSIFICACAO: "Reclassificação",
    ABANDONO: "Abandono",
    ERRO_REGISTRO: "Erro de registro",
    OUTRO: "Outro",
    CORRECAO_INVENTARIO: "Correção de inventário",
    COMUM: "Comum",
    DIA: "Somente data",
    INSTANTE: "Data e hora",
  };
  return (
    nomes[v] ??
    v
      .replaceAll("_", " ")
      .toLocaleLowerCase("pt-BR")
      .replace(/^./, (c) => c.toUpperCase())
  );
}
export function campoTecnico(campo: string): boolean {
  return campo === "id" || campo.endsWith("Id");
}

export function chaveRegistroRelatorio(
  registro: Record<string, unknown>,
  indice: number,
): string {
  return `${String(registro.id ?? "registro")}-${indice}`;
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function ValorRegistro({ campo, dado }: { campo: string; dado: unknown }) {
  if (Array.isArray(dado)) {
    if (dado.length === 0)
      return <span className="text-muted-foreground">Nenhum registro</span>;
    return (
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {dado.map((item, indice) => (
          <li key={indice} className="rounded-lg border bg-card p-3">
            {ehRegistro(item) ? (
              <DadosRegistro dados={item} compacto />
            ) : (
              valor(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (ehRegistro(dado)) return <DadosRegistro dados={dado} compacto />;
  if (
    dado === null &&
    ["brutoAtual", "acumuladoAtual", "liquidoAtual"].includes(campo)
  )
    return "Total indisponível";
  return valor(dado);
}

export function DadosRegistro({
  dados,
  compacto = false,
}: {
  dados: Record<string, unknown>;
  compacto?: boolean;
}) {
  const itens = Object.entries(dados).filter(([campo]) => !campoTecnico(campo));
  return (
    <dl
      className={
        compacto
          ? "grid gap-2 text-sm"
          : "grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {itens.map(([campo, dado]) => {
        const composto = Array.isArray(dado) || ehRegistro(dado);
        return (
          <div
            key={campo}
            className={
              compacto
                ? "min-w-0 break-words"
                : `min-w-0 rounded-lg bg-muted/40 p-3 break-words ${composto ? "sm:col-span-2 xl:col-span-3" : ""}`
            }
          >
            <dt className="text-xs font-medium text-muted-foreground">
              {rotulo(campo)}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap font-medium text-foreground">
              <ValorRegistro campo={campo} dado={dado} />
            </dd>
          </div>
        );
      })}
      {itens.length === 0 ? (
        <div className="text-muted-foreground">Sem informações adicionais.</div>
      ) : null}
    </dl>
  );
}
