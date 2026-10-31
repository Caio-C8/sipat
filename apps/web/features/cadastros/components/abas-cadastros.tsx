import Link from "next/link";
import {
  BadgeCheck,
  FileText,
  MapPin,
  Package,
  Tag,
  UsersRound,
} from "lucide-react";

export type SecaoAbas =
  | "processos"
  | "especies"
  | "naturezas"
  | "comissoes"
  | "responsaveis"
  | "setores";

const abas = [
  {
    id: "processos",
    nome: "Processos de compra",
    href: "/cadastros",
    icon: FileText,
  },
  {
    id: "especies",
    nome: "Espécies",
    href: "/cadastros/especies",
    icon: Package,
  },
  {
    id: "naturezas",
    nome: "Naturezas",
    href: "/cadastros/naturezas",
    icon: Tag,
  },
  {
    id: "comissoes",
    nome: "Comissões",
    href: "/cadastros/comissoes",
    icon: UsersRound,
  },
  {
    id: "responsaveis",
    nome: "Responsáveis",
    href: "/cadastros/responsaveis",
    icon: BadgeCheck,
  },
  { id: "setores", nome: "Setores", href: "/cadastros/setores", icon: MapPin },
] as const;

export function AbasCadastros({ secao }: { secao: SecaoAbas }) {
  return (
    <nav
      className="grid grid-cols-2 gap-1 rounded-lg border border-[#dfe7f1] bg-white p-1 sm:grid-cols-3 xl:grid-cols-6"
      aria-label="Seções dos cadastros"
    >
      {abas.map(({ id, nome, href, icon: Icone }) => (
        <Link
          key={id}
          href={href}
          aria-current={id === secao ? "page" : undefined}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-md border-b-2 px-2 text-center text-xs no-underline ${id === secao ? "border-[#2860eb] font-semibold text-[#2860eb]" : "border-transparent text-[#62748e] hover:bg-[#f7f9fc]"}`}
        >
          <Icone className="size-4 shrink-0" />
          {nome}
        </Link>
      ))}
    </nav>
  );
}
