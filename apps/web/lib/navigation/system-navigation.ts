import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
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
import { administrativeRoutes } from "./administrative-routes";
import type { PerfilUsuario } from "@repo/contracts";

export const nomesPerfis = {
  ADMINISTRADOR: "Administrador",
  DIRETOR_PATRIMONIO: "Diretor de Patrimônio",
} satisfies Record<PerfilUsuario, string>;

export type GrupoNavegacao = "principal" | "administracao";

export type BreadcrumbSistema = Readonly<{
  label: string;
  href?: `/${string}`;
}>;

export type TelaSistema = Readonly<{
  id: string;
  label: string;
  padrao: `/${string}`;
  perfis: readonly PerfilUsuario[];
  breadcrumb: readonly BreadcrumbSistema[];
  itemNavegacaoId?: string;
}>;

export type ItemNavegacao = Readonly<{
  id: string;
  label: string;
  icon: LucideIcon;
  grupo: GrupoNavegacao;
  perfis: readonly PerfilUsuario[];
  href: `/${string}`;
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
    href: "/dashboard",
  },
  {
    id: "patrimonios",
    label: "Patrimônios",
    icon: PackageSearch,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/patrimonios",
  },
  {
    id: "cadastrar-patrimonio",
    label: "Cadastrar patrimônio",
    icon: Plus,
    grupo: "principal",
    perfis: APENAS_DIRETOR,
    href: "/patrimonios/novo",
  },
  {
    id: "reavaliacoes",
    label: "Reavaliações",
    icon: TrendingUp,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/reavaliacoes",
  },
  {
    id: "depreciacoes",
    label: "Depreciações",
    icon: TrendingDown,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/depreciacao",
  },
  {
    id: "movimentacoes",
    label: "Movimentações",
    icon: ArrowLeftRight,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/movimentacoes",
  },
  {
    id: "emprestimos",
    label: "Empréstimos",
    icon: Landmark,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/emprestimos",
  },
  {
    id: "baixas",
    label: "Baixas",
    icon: Archive,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/baixas",
  },
  {
    id: "inventarios",
    label: "Inventários",
    icon: ClipboardList,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/inventarios",
  },
  {
    id: "manutencoes",
    label: "Manutenções",
    icon: Wrench,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/manutencoes",
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    grupo: "principal",
    perfis: TODOS_PERFIS,
    href: "/relatorios",
  },
  {
    id: "processos-compra",
    label: "Processos de compra",
    icon: FileText,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.processosCompra.list,
  },
  {
    id: "fornecedores",
    label: "Fornecedores",
    icon: Truck,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.fornecedores.list,
  },
  {
    id: "setores",
    label: "Setores",
    icon: Building2,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.setores.list,
  },
  {
    id: "responsaveis",
    label: "Responsáveis",
    icon: UsersRound,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.responsaveis.list,
  },
  {
    id: "comissoes",
    label: "Comissões",
    icon: Scale,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.comissoes.list,
  },
  {
    id: "naturezas",
    label: "Naturezas",
    icon: Shapes,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.naturezas.list,
  },
  {
    id: "especies",
    label: "Espécies",
    icon: PackageSearch,
    grupo: "administracao",
    perfis: TODOS_PERFIS,
    href: administrativeRoutes.especies.list,
  },
  {
    id: "usuarios",
    label: "Usuários",
    icon: UserRoundCog,
    grupo: "administracao",
    perfis: APENAS_ADMINISTRADOR,
    href: administrativeRoutes.usuarios.list,
  },
] as const;

function tela(
  id: string,
  label: string,
  padrao: `/${string}`,
  perfis: readonly PerfilUsuario[],
  itemNavegacaoId: string | undefined,
  breadcrumb: readonly BreadcrumbSistema[],
): TelaSistema {
  return { id, label, padrao, perfis, itemNavegacaoId, breadcrumb };
}

export const catalogoTelasSistema: readonly TelaSistema[] = [
  tela("dashboard", "Início", "/dashboard", TODOS_PERFIS, "inicio", [
    { label: "Início" },
  ]),
  tela(
    "patrimonios",
    "Patrimônios",
    "/patrimonios",
    TODOS_PERFIS,
    "patrimonios",
    [{ label: "Patrimônios" }],
  ),
  tela(
    "patrimonio-novo",
    "Cadastrar patrimônio",
    "/patrimonios/novo",
    APENAS_DIRETOR,
    "cadastrar-patrimonio",
    [
      { label: "Patrimônios", href: "/patrimonios" },
      { label: "Cadastrar patrimônio" },
    ],
  ),
  tela(
    "patrimonio-detalhe",
    "Detalhes do patrimônio",
    "/patrimonios/:patrimonioId",
    TODOS_PERFIS,
    "patrimonios",
    [{ label: "Patrimônios", href: "/patrimonios" }, { label: "Detalhes" }],
  ),
  tela(
    "reavaliacoes",
    "Reavaliações",
    "/reavaliacoes",
    TODOS_PERFIS,
    "reavaliacoes",
    [{ label: "Reavaliações" }],
  ),
  tela(
    "reavaliacao-nova",
    "Nova reavaliação",
    "/reavaliacoes/nova",
    APENAS_DIRETOR,
    "reavaliacoes",
    [
      { label: "Reavaliações", href: "/reavaliacoes" },
      { label: "Nova reavaliação" },
    ],
  ),
  tela(
    "reavaliacao-detalhe",
    "Detalhes da reavaliação",
    "/reavaliacoes/:reavaliacaoId",
    TODOS_PERFIS,
    "reavaliacoes",
    [{ label: "Reavaliações", href: "/reavaliacoes" }, { label: "Detalhes" }],
  ),
  tela(
    "depreciacoes",
    "Depreciações",
    "/depreciacao",
    TODOS_PERFIS,
    "depreciacoes",
    [{ label: "Depreciações" }],
  ),
  tela(
    "movimentacoes",
    "Movimentações",
    "/movimentacoes",
    TODOS_PERFIS,
    "movimentacoes",
    [{ label: "Movimentações" }],
  ),
  tela(
    "movimentacao-nova",
    "Nova movimentação",
    "/movimentacoes/nova",
    APENAS_DIRETOR,
    "movimentacoes",
    [
      { label: "Movimentações", href: "/movimentacoes" },
      { label: "Nova movimentação" },
    ],
  ),
  tela(
    "movimentacao-detalhe",
    "Detalhes da movimentação",
    "/movimentacoes/:movimentacaoId",
    TODOS_PERFIS,
    "movimentacoes",
    [{ label: "Movimentações", href: "/movimentacoes" }, { label: "Detalhes" }],
  ),
  tela(
    "emprestimos",
    "Empréstimos",
    "/emprestimos",
    TODOS_PERFIS,
    "emprestimos",
    [{ label: "Empréstimos" }],
  ),
  tela(
    "emprestimo-novo",
    "Novo empréstimo",
    "/emprestimos/nova",
    APENAS_DIRETOR,
    "emprestimos",
    [
      { label: "Empréstimos", href: "/emprestimos" },
      { label: "Novo empréstimo" },
    ],
  ),
  tela(
    "emprestimo-detalhe",
    "Detalhes do empréstimo",
    "/emprestimos/:emprestimoId",
    TODOS_PERFIS,
    "emprestimos",
    [{ label: "Empréstimos", href: "/emprestimos" }, { label: "Detalhes" }],
  ),
  tela("baixas", "Baixas", "/baixas", TODOS_PERFIS, "baixas", [
    { label: "Baixas" },
  ]),
  tela(
    "baixa-nova",
    "Registrar baixa",
    "/baixas/nova",
    APENAS_DIRETOR,
    "baixas",
    [{ label: "Baixas", href: "/baixas" }, { label: "Registrar baixa" }],
  ),
  tela(
    "baixa-detalhe",
    "Detalhes da baixa",
    "/baixas/:patrimonioId",
    TODOS_PERFIS,
    "baixas",
    [{ label: "Baixas", href: "/baixas" }, { label: "Detalhes" }],
  ),
  tela(
    "inventarios",
    "Inventários",
    "/inventarios",
    TODOS_PERFIS,
    "inventarios",
    [{ label: "Inventários" }],
  ),
  tela(
    "inventario-detalhe",
    "Detalhes do inventário",
    "/inventarios/:inventarioId",
    TODOS_PERFIS,
    "inventarios",
    [{ label: "Inventários", href: "/inventarios" }, { label: "Detalhes" }],
  ),
  tela(
    "manutencoes",
    "Manutenções",
    "/manutencoes",
    TODOS_PERFIS,
    "manutencoes",
    [{ label: "Manutenções" }],
  ),
  tela(
    "manutencao-nova",
    "Novo pedido de manutenção",
    "/manutencoes/nova",
    TODOS_PERFIS,
    "manutencoes",
    [{ label: "Manutenções", href: "/manutencoes" }, { label: "Novo pedido" }],
  ),
  tela(
    "manutencao-detalhe",
    "Detalhes da manutenção",
    "/manutencoes/:manutencaoId",
    TODOS_PERFIS,
    "manutencoes",
    [{ label: "Manutenções", href: "/manutencoes" }, { label: "Detalhes" }],
  ),
  tela("relatorios", "Relatórios", "/relatorios", TODOS_PERFIS, "relatorios", [
    { label: "Relatórios" },
  ]),
  tela(
    "processos-compra",
    "Processos de compra",
    "/processos-compra",
    TODOS_PERFIS,
    "processos-compra",
    [{ label: "Processos de compra" }],
  ),
  tela(
    "processo-compra-novo",
    "Cadastrar processo",
    "/processos-compra/novo",
    TODOS_PERFIS,
    "processos-compra",
    [
      { label: "Processos de compra", href: "/processos-compra" },
      { label: "Cadastrar processo" },
    ],
  ),
  tela(
    "processo-compra-editar",
    "Editar processo",
    "/processos-compra/:processoCompraId/editar",
    TODOS_PERFIS,
    "processos-compra",
    [
      { label: "Processos de compra", href: "/processos-compra" },
      { label: "Editar processo" },
    ],
  ),
  tela(
    "processo-compra-detalhe",
    "Detalhes do processo",
    "/processos-compra/:processoCompraId",
    TODOS_PERFIS,
    "processos-compra",
    [
      { label: "Processos de compra", href: "/processos-compra" },
      { label: "Detalhes" },
    ],
  ),
  tela(
    "fornecedores",
    "Fornecedores",
    "/fornecedores",
    TODOS_PERFIS,
    "fornecedores",
    [{ label: "Fornecedores" }],
  ),
  tela(
    "fornecedor-novo",
    "Cadastrar fornecedor",
    "/fornecedores/novo",
    APENAS_ADMINISTRADOR,
    "fornecedores",
    [
      { label: "Fornecedores", href: "/fornecedores" },
      { label: "Cadastrar fornecedor" },
    ],
  ),
  tela(
    "fornecedor-editar",
    "Editar fornecedor",
    "/fornecedores/:fornecedorId/editar",
    APENAS_ADMINISTRADOR,
    "fornecedores",
    [
      { label: "Fornecedores", href: "/fornecedores" },
      { label: "Editar fornecedor" },
    ],
  ),
  tela(
    "fornecedor-detalhe",
    "Detalhes do fornecedor",
    "/fornecedores/:fornecedorId",
    TODOS_PERFIS,
    "fornecedores",
    [{ label: "Fornecedores", href: "/fornecedores" }, { label: "Detalhes" }],
  ),
  tela("setores", "Setores", "/setores", TODOS_PERFIS, "setores", [
    { label: "Setores" },
  ]),
  tela(
    "setor-novo",
    "Cadastrar setor",
    "/setores/novo",
    APENAS_ADMINISTRADOR,
    "setores",
    [{ label: "Setores", href: "/setores" }, { label: "Cadastrar setor" }],
  ),
  tela(
    "setor-detalhe",
    "Detalhes do setor",
    "/setores/:setorId",
    TODOS_PERFIS,
    "setores",
    [{ label: "Setores", href: "/setores" }, { label: "Detalhes" }],
  ),
  tela(
    "setor-editar",
    "Editar setor",
    "/setores/:setorId/editar",
    APENAS_ADMINISTRADOR,
    "setores",
    [{ label: "Setores", href: "/setores" }, { label: "Editar setor" }],
  ),
  tela(
    "responsaveis",
    "Responsáveis",
    "/responsaveis",
    TODOS_PERFIS,
    "responsaveis",
    [{ label: "Responsáveis" }],
  ),
  tela(
    "responsavel-novo",
    "Cadastrar responsável",
    "/responsaveis/novo",
    APENAS_ADMINISTRADOR,
    "responsaveis",
    [
      { label: "Responsáveis", href: "/responsaveis" },
      { label: "Cadastrar responsável" },
    ],
  ),
  tela(
    "responsavel-editar",
    "Editar responsável",
    "/responsaveis/:responsavelId/editar",
    APENAS_ADMINISTRADOR,
    "responsaveis",
    [
      { label: "Responsáveis", href: "/responsaveis" },
      { label: "Editar responsável" },
    ],
  ),
  tela(
    "responsavel-detalhe",
    "Detalhes do responsável",
    "/responsaveis/:responsavelId",
    TODOS_PERFIS,
    "responsaveis",
    [{ label: "Responsáveis", href: "/responsaveis" }, { label: "Detalhes" }],
  ),
  tela("comissoes", "Comissões", "/comissoes", TODOS_PERFIS, "comissoes", [
    { label: "Comissões" },
  ]),
  tela(
    "comissao-nova",
    "Cadastrar comissão",
    "/comissoes/novo",
    APENAS_ADMINISTRADOR,
    "comissoes",
    [
      { label: "Comissões", href: "/comissoes" },
      { label: "Cadastrar comissão" },
    ],
  ),
  tela(
    "comissao-editar",
    "Editar comissão",
    "/comissoes/:comissaoId/editar",
    APENAS_ADMINISTRADOR,
    "comissoes",
    [{ label: "Comissões", href: "/comissoes" }, { label: "Editar comissão" }],
  ),
  tela(
    "comissao-detalhe",
    "Detalhes da comissão",
    "/comissoes/:comissaoId",
    TODOS_PERFIS,
    "comissoes",
    [{ label: "Comissões", href: "/comissoes" }, { label: "Detalhes" }],
  ),
  tela("naturezas", "Naturezas", "/naturezas", TODOS_PERFIS, "naturezas", [
    { label: "Naturezas" },
  ]),
  tela(
    "natureza-nova",
    "Cadastrar natureza",
    "/naturezas/novo",
    APENAS_ADMINISTRADOR,
    "naturezas",
    [
      { label: "Naturezas", href: "/naturezas" },
      { label: "Cadastrar natureza" },
    ],
  ),
  tela(
    "natureza-editar",
    "Editar natureza",
    "/naturezas/:naturezaId/editar",
    APENAS_ADMINISTRADOR,
    "naturezas",
    [{ label: "Naturezas", href: "/naturezas" }, { label: "Editar natureza" }],
  ),
  tela(
    "natureza-detalhe",
    "Detalhes da natureza",
    "/naturezas/:naturezaId",
    TODOS_PERFIS,
    "naturezas",
    [{ label: "Naturezas", href: "/naturezas" }, { label: "Detalhes" }],
  ),
  tela("especies", "Espécies", "/especies", TODOS_PERFIS, "especies", [
    { label: "Espécies" },
  ]),
  tela(
    "especie-nova",
    "Cadastrar espécie",
    "/especies/novo",
    APENAS_ADMINISTRADOR,
    "especies",
    [{ label: "Espécies", href: "/especies" }, { label: "Cadastrar espécie" }],
  ),
  tela(
    "especie-editar",
    "Editar espécie",
    "/especies/:especieId/editar",
    APENAS_ADMINISTRADOR,
    "especies",
    [{ label: "Espécies", href: "/especies" }, { label: "Editar espécie" }],
  ),
  tela(
    "especie-detalhe",
    "Detalhes da espécie",
    "/especies/:especieId",
    TODOS_PERFIS,
    "especies",
    [{ label: "Espécies", href: "/especies" }, { label: "Detalhes" }],
  ),
  tela("usuarios", "Usuários", "/usuarios", APENAS_ADMINISTRADOR, "usuarios", [
    { label: "Usuários" },
  ]),
  tela(
    "usuario-novo",
    "Cadastrar usuário",
    "/usuarios/novo",
    APENAS_ADMINISTRADOR,
    "usuarios",
    [{ label: "Usuários", href: "/usuarios" }, { label: "Cadastrar usuário" }],
  ),
  tela(
    "usuario-editar",
    "Editar usuário",
    "/usuarios/:usuarioId/editar",
    APENAS_ADMINISTRADOR,
    "usuarios",
    [{ label: "Usuários", href: "/usuarios" }, { label: "Editar usuário" }],
  ),
  tela(
    "usuario-detalhe",
    "Detalhes do usuário",
    "/usuarios/:usuarioId",
    APENAS_ADMINISTRADOR,
    "usuarios",
    [{ label: "Usuários", href: "/usuarios" }, { label: "Detalhes" }],
  ),
  tela(
    "minha-conta",
    "Minha conta",
    "/configuracoes",
    TODOS_PERFIS,
    undefined,
    [{ label: "Minha conta" }],
  ),
  tela(
    "alterar-senha",
    "Alterar senha",
    "/configuracoes/alterar-senha",
    TODOS_PERFIS,
    undefined,
    [
      { label: "Minha conta", href: "/configuracoes" },
      { label: "Alterar senha" },
    ],
  ),
] as const;

function correspondeAoPadrao(pathname: string, padrao: string): boolean {
  const caminho = pathname.split("/").filter(Boolean);
  const partesPadrao = padrao.split("/").filter(Boolean);

  return (
    caminho.length === partesPadrao.length &&
    partesPadrao.every(
      (parte, indice) => parte.startsWith(":") || parte === caminho[indice],
    )
  );
}

export function listarNavegacaoPorPerfil(
  perfil: PerfilUsuario,
): readonly ItemNavegacao[] {
  return catalogoNavegacao.filter((item) => item.perfis.includes(perfil));
}

export function encontrarTelaPorCaminho(
  pathname: string,
): TelaSistema | undefined {
  return catalogoTelasSistema.find((item) =>
    correspondeAoPadrao(pathname, item.padrao),
  );
}

export function encontrarNavegacaoPorCaminho(
  pathname: string,
): ItemNavegacao | undefined {
  const itemNavegacaoId = encontrarTelaPorCaminho(pathname)?.itemNavegacaoId;
  return catalogoNavegacao.find((item) => item.id === itemNavegacaoId);
}
