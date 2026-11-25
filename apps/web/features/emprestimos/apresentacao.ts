import { isApiError } from "@/lib/api/core/api-error";

export const painelEmprestimo =
  "min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6";
export const botaoPrimarioEmprestimo =
  "bg-primary text-primary-foreground hover:bg-primary/90";

export function identificacaoEmprestimo(id: string): string {
  return `Empréstimo ${id.slice(0, 8)}`;
}

export function situacaoEmprestimo(item: {
  situacao: "EM_ANDAMENTO" | "CONCLUIDO";
  emAtraso: boolean;
}) {
  if (item.situacao === "CONCLUIDO")
    return { texto: "Concluído", classe: "bg-emerald-50 text-emerald-800" };
  if (item.emAtraso)
    return { texto: "Em atraso", classe: "bg-amber-50 text-amber-900" };
  return { texto: "Em andamento", classe: "bg-blue-50 text-blue-800" };
}

export function mensagemEmprestimo(erro: unknown): string {
  if (isApiError(erro)) {
    if (erro.status === 401) return "A sessão expirou. Entre novamente.";
    if (erro.status === 403) return "Seu perfil não permite esta operação.";
    return erro.message;
  }
  return "Não foi possível concluir a operação. Confira a conexão e tente novamente.";
}

type BemSelecionado = {
  numeroPatrimonio: string;
  descricao: string;
};

export function detalhesErroEmprestimo(
  erro: unknown,
  bens: BemSelecionado[],
): string[] {
  if (!isApiError(erro)) return [];

  return erro.erros.map((item) => {
    const correspondencia = /^patrimonioIds\.(\d+)$/.exec(item.campo);
    if (!correspondencia) return item.mensagem;

    const indice = Number(correspondencia[1]);
    const bem = bens[indice];
    if (!bem) return item.mensagem;

    return `${bem.numeroPatrimonio} — ${bem.descricao}: ${item.mensagem}`;
  });
}

export function hojeSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}
export function dataExibicao(iso: string | null): string {
  if (!iso) return "Não informado";
  if (iso.includes("T")) {
    if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(iso))
      return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}, ${iso.slice(11, 16)}`;
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  }
  const dia = iso.slice(0, 10);
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
}
