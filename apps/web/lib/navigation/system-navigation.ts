import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  PackageSearch,
  Plus,
  Scale,
  Shapes,
  TrendingDown,
  TrendingUp,
  Truck,
  UserRoundCog,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { PerfilUsuario } from "@repo/contracts";

export const nomesPerfis = {
  ADMINISTRADOR: "Administrador",
  DIRETOR_PATRIMONIO: "Diretor de Patrimônio",
} satisfies Record<PerfilUsuario, string>;

export type GrupoNavegacao = "principal" | "administracao";

export type ItemNavegacao = Readonly<{
  id: string;
  label: string;
  icon: LucideIcon;
  grupo: GrupoNavegacao;
  perfis: readonly PerfilUsuario[];
  implementado: boolean;
  href?: `/${string}`;
  breadcrumb?: readonly string[];
}>;

const TODOS_PERFIS = [
  "ADMINISTRADOR",
  "DIRETOR_PATRIMONIO",
] as const satisfies readonly PerfilUsuario[];
const APENAS_ADMINISTRADOR = [
  "ADMINISTRADOR",
] as const satisfies readonly PerfilUsuario[];
const APENAS_DIRETOR = [
  "DIRETOR_PATRIMONIO",
] as const satisfies readonly PerfilUsuario[];

export const catalogoNavegacao: readonly ItemNavegacao[] = [
  {
    id: "inicio",
    label: "Início",
    icon: LayoutDashboard,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/dashboard",
    breadcrumb: ["Início", "Visão geral"],
  },
  {
    id: "pesquisar-patrimonio",
    label: "Pesquisar patrimônio",
    icon: PackageSearch,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/patrimonios",
    breadcrumb: ["Patrimônio", "Consulta"],
  },
  {
    id: "cadastrar-patrimonio",
    label: "Cadastrar patrimônio",
    icon: Plus,
    grupo: "principal",
    perfis: APENAS_DIRETOR,
    implementado: true,
    href: "/patrimonios/novo",
    breadcrumb: ["Patrimônio", "Cadastrar patrimônio"],
  },
  {
    id: "processos-compra-documentos-fiscais",
    label: "Processos de compra",
    icon: FileText,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/cadastros",
    breadcrumb: ["Cadastros", "Processos de compra"],
  },
  {
    id: "movimentacoes",
    label: "Movimentações",
    icon: ArrowLeftRight,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/movimentacoes",
    breadcrumb: ["Início", "Movimentações"],
  },
  {
    id: "inventario",
    label: "Inventário",
    icon: ClipboardList,
    grupo: "principal",
    perfis: APENAS_DIRETOR,
    implementado: false,
  },
  {
    id: "emprestimos",
    label: "Empréstimos",
    icon: Landmark,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/emprestimos",
    breadcrumb: ["Início", "Empréstimos"],
  },
  {
    id: "manutencao",
    label: "Manutenção",
    icon: Wrench,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/manutencoes",
    breadcrumb: ["Início", "Manutenções"],
  },
  {
    id: "reavaliacao",
    label: "Reavaliação",
    icon: TrendingUp,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: true,
    href: "/reavaliacoes",
    breadcrumb: ["Início", "Reavaliações"],
  },
  {
    id: "depreciacao",
    label: "Depreciação",
    icon: TrendingDown,
    grupo: "principal",
    perfis: APENAS_DIRETOR,
    implementado: false,
  },
  {
    id: "baixa-estorno",
    label: "Baixa e estorno",
    icon: Archive,
    grupo: "principal",
    perfis: APENAS_DIRETOR,
    implementado: false,
  },
  {
    id: "historico-patrimonial",
    label: "Histórico patrimonial",
    icon: History,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: false,
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    implementado: false,
  },
  {
    id: "usuarios",
    label: "Usuários",
    icon: UserRoundCog,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: false,
  },
  {
    id: "responsaveis",
    label: "Responsáveis",
    icon: UsersRound,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: true,
    href: "/cadastros/responsaveis",
    breadcrumb: ["Cadastros", "Responsáveis"],
  },
  {
    id: "setores",
    label: "Setores",
    icon: Building2,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: true,
    href: "/cadastros/setores",
    breadcrumb: ["Cadastros", "Setores"],
  },
  {
    id: "comissoes",
    label: "Comissões",
    icon: Scale,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: true,
    href: "/cadastros/comissoes",
    breadcrumb: ["Cadastros", "Comissões"],
  },
  {
    id: "naturezas",
    label: "Naturezas",
    icon: Shapes,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: true,
    href: "/cadastros/naturezas",
    breadcrumb: ["Cadastros", "Naturezas"],
  },
  {
    id: "especies",
    label: "Espécies",
    icon: PackageSearch,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: true,
    href: "/cadastros/especies",
    breadcrumb: ["Cadastros", "Espécies"],
  },
  {
    id: "fornecedores",
    label: "Fornecedores",
    icon: Truck,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    implementado: false,
  },
] as const;

export function listarNavegacaoPorPerfil(
  perfil: PerfilUsuario,
): readonly ItemNavegacao[] {
  return catalogoNavegacao.filter((item) => item.perfis.includes(perfil));
}

export function encontrarNavegacaoPorCaminho(
  pathname: string,
): ItemNavegacao | undefined {
  return catalogoNavegacao.find(
    (item) =>
      item.href === pathname ||
      (item.href === "/movimentacoes" &&
        pathname.startsWith("/movimentacoes/")) ||
      (item.href === "/emprestimos" && pathname.startsWith("/emprestimos/")) ||
      (item.href === "/cadastros/setores" &&
        pathname.startsWith("/cadastros/setores/")),
  );
}
