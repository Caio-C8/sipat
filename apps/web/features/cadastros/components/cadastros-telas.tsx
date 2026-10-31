"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  FileText,
  Info,
  Package,
  Plus,
  Search,
  Tag,
  UsersRound,
} from "lucide-react";
import { AbasCadastros, type SecaoAbas } from "./abas-cadastros";

export type SecaoCadastro = Exclude<SecaoAbas, "setores">;

const paginas = {
  processos: {
    titulo: "Cadastros",
    subtitulo:
      "Organize os processos de compra e os dados usados na gestão patrimonial.",
    lista: "Processos de compra",
    singular: "Processo de compra",
    href: "/cadastros",
    icon: FileText,
  },
  especies: {
    titulo: "Cadastrar espécie",
    subtitulo: "Agrupe bens com características semelhantes.",
    lista: "Espécies cadastradas",
    singular: "Nova espécie",
    href: "/cadastros/especies",
    icon: Package,
  },
  naturezas: {
    titulo: "Cadastrar natureza",
    subtitulo: "Defina a natureza usada na identificação dos bens.",
    lista: "Naturezas cadastradas",
    singular: "Nova natureza",
    href: "/cadastros/naturezas",
    icon: Tag,
  },
  comissoes: {
    titulo: "Cadastrar comissão",
    subtitulo:
      "Defina a finalidade, a vigência e os funcionários participantes.",
    lista: "Comissões cadastradas",
    singular: "Nova comissão",
    href: "/cadastros/comissoes",
    icon: UsersRound,
  },
  responsaveis: {
    titulo: "Cadastrar responsável",
    subtitulo:
      "Cadastre os funcionários que poderão assumir a responsabilidade pelos bens.",
    lista: "Responsáveis cadastrados",
    singular: "Novo responsável",
    href: "/cadastros/responsaveis",
    icon: BadgeCheck,
  },
} as const;

const registros: Record<
  SecaoCadastro,
  readonly { titulo: string; detalhe: string }[]
> = {
  processos: [
    {
      titulo: "028/2026",
      detalhe: "Equipamentos de informática · 1 nota fiscal",
    },
    { titulo: "021/2026", detalhe: "Processo cadastrado" },
    { titulo: "017/2026", detalhe: "Processo cadastrado" },
  ],
  especies: [
    { titulo: "Equipamentos de informática", detalhe: "ESP-001 · Bem móvel" },
    { titulo: "Mobiliário", detalhe: "ESP-002 · Bem móvel" },
    { titulo: "Equipamentos de áudio", detalhe: "ESP-003 · Bem móvel" },
  ],
  naturezas: [
    { titulo: "Bem móvel", detalhe: "NAT-001 · Cadastro ativo" },
    { titulo: "Bem imóvel", detalhe: "NAT-002 · Cadastro ativo" },
  ],
  comissoes: [
    {
      titulo: "Comissão de Inventário · 2026",
      detalhe: "COM-001 · 3 membros · Ativa",
    },
    {
      titulo: "Comissão de Avaliação · 2026",
      detalhe: "COM-002 · 3 membros · Ativa",
    },
  ],
  responsaveis: [
    { titulo: "Ana Martins", detalhe: "000215 · Administrativo" },
    { titulo: "Carlos Oliveira", detalhe: "000308 · Tecnologia da Informação" },
    { titulo: "Mariana Costa", detalhe: "000327 · Secretaria Legislativa" },
  ],
};

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-3 px-4 py-4 text-[#17253d] min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]";
const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 min-[1500px]:p-5";
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dfe7f1] bg-white px-3 text-xs text-[#19355d] outline-none focus-visible:ring-2 focus-visible:ring-[#2860eb]";
const bloqueado = `${campo} bg-[#f1f5f9] text-[#62748e]`;
const botao =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#dfe7f1] bg-white px-4 text-xs font-semibold text-[#19355d] hover:bg-[#f7f9fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb]";

function Campo({
  nome,
  children,
  obrigatorio = false,
}: {
  nome: string;
  children: ReactNode;
  obrigatorio?: boolean;
}) {
  return (
    <label className="block min-w-0 text-[11px] text-[#29456d]">
      {nome}
      {obrigatorio ? " *" : ""}
      {children}
    </label>
  );
}

function CaixaInfo({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-[#eef5ff] p-4 text-xs leading-relaxed text-[#29456d]">
      <Info className="mr-2 inline size-4 text-[#2860eb]" />
      {children}
    </div>
  );
}

function CabecalhoFormulario({
  secao,
  novo,
}: {
  secao: SecaoCadastro;
  novo: boolean;
}) {
  const { icon: Icone, singular } = paginas[secao];
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-start gap-2">
        <span className="rounded-md bg-[#eff5ff] p-2 text-[#2860eb]">
          <Icone className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold">
            {secao === "processos"
              ? "Processo de compra"
              : novo
                ? singular
                : singular.replace(/^Nov[oa] /, "Dados de ")}
          </h2>
          <p className="text-[11px] text-[#62748e]">
            Preencha os dados e revise antes de salvar.
          </p>
        </div>
      </div>
      {secao !== "processos" && (
        <span className="rounded-full bg-[#eff5ff] px-3 py-1 text-[10px] font-semibold text-[#2860eb]">
          ● Novo
        </span>
      )}
    </div>
  );
}

function ProcessoForm({ novo }: { novo: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(110px,140px)_minmax(90px,110px)_minmax(150px,190px)]">
        <Campo nome="Número do processo" obrigatorio>
          <input
            className={campo}
            defaultValue={novo ? "" : "028"}
            key={`numero-${novo}`}
          />
        </Campo>
        <Campo nome="Ano" obrigatorio>
          <input
            className={campo}
            defaultValue={novo ? "" : "2026"}
            key={`ano-${novo}`}
            inputMode="numeric"
          />
        </Campo>
        <Campo nome="Data de abertura">
          <input
            className={campo}
            type="date"
            defaultValue={novo ? "" : "2026-09-01"}
            key={`data-${novo}`}
          />
        </Campo>
      </div>
      <Campo nome="Objeto da compra" obrigatorio>
        <textarea
          className={`${campo} min-h-16 py-2`}
          defaultValue={
            novo
              ? ""
              : "Aquisição de equipamentos de informática para os setores da Câmara Municipal."
          }
          key={`objeto-${novo}`}
        />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo nome="Fornecedor" obrigatorio>
          <input
            className={campo}
            defaultValue={novo ? "" : "Fornecedor de informática"}
            key={`fornecedor-${novo}`}
          />
        </Campo>
        <Campo nome="Número do empenho">
          <input
            className={campo}
            defaultValue={novo ? "" : "154"}
            key={`empenho-${novo}`}
          />
        </Campo>
        <Campo nome="Ano do empenho">
          <input
            className={campo}
            defaultValue={novo ? "" : "2026"}
            key={`ano-empenho-${novo}`}
          />
        </Campo>
      </div>
      <section className="border-t border-[#dfe7f1] pt-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Notas fiscais do processo</h3>
            <p className="text-[11px] text-[#62748e]">
              Inclua aqui os documentos fiscais que serão vinculados aos
              patrimônios.
            </p>
          </div>
          <button
            className={botao}
            type="button"
            disabled
            title="Disponível após integração com a API"
          >
            <Plus className="size-4" />
            Adicionar nota fiscal
          </button>
        </div>
        {!novo ? (
          <div className="grid gap-2 rounded-md border border-[#dfe7f1] bg-[#f7f9fc] p-3 text-xs sm:grid-cols-[1fr_auto_auto]">
            <div>
              <strong>NF 000.012.458</strong>
              <p className="text-[#62748e]">
                NF-000012458.pdf · documento vinculado
              </p>
            </div>
            <span>
              Emissão
              <br />
              10/09/2026
            </span>
            <span>
              Moeda
              <br />
              R$ · Real brasileiro
            </span>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-[#dfe7f1] p-4 text-xs text-[#62748e]">
            Nenhuma nota fiscal nesta prévia.
          </p>
        )}
        <p className="mt-3 text-[11px] text-[#62748e]">
          A nota fiscal será exibida no cadastro do bem ao selecionar este
          processo.
        </p>
      </section>
    </div>
  );
}

function EspecieForm() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <Campo nome="Código automático">
          <input className={bloqueado} value="ESP-004" readOnly />
        </Campo>
        <Campo nome="Nome da espécie" obrigatorio>
          <input className={campo} defaultValue="Equipamentos de energia" />
        </Campo>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Campo nome="Natureza vinculada" obrigatorio>
          <select className={campo} defaultValue="Bem móvel">
            <option>Bem móvel</option>
            <option>Bem imóvel</option>
          </select>
        </Campo>
        <CaixaInfo>Vincule a espécie à natureza correspondente.</CaixaInfo>
      </div>
      <Campo nome="Descrição">
        <textarea
          className={`${campo} min-h-24 py-2`}
          defaultValue="Equipamentos destinados à proteção e ao fornecimento temporário de energia. Nobreaks e estabilizadores de energia."
        />
      </Campo>
      <Disponibilidade texto="Registros ativos ficam disponíveis para seleção nos novos cadastros." />
    </div>
  );
}

function NaturezaForm() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <Campo nome="Código automático">
          <input className={bloqueado} value="NAT-003" readOnly />
        </Campo>
        <Campo nome="Nome da natureza" obrigatorio>
          <input className={campo} defaultValue="Bem intangível" />
        </Campo>
      </div>
      <Campo nome="Descrição">
        <textarea
          className={`${campo} min-h-24 py-2`}
          defaultValue="Bens e direitos que não possuem forma física. Licenças de software e outros ativos sem forma física."
        />
      </Campo>
      <Disponibilidade texto="Registros ativos ficam disponíveis para seleção nos novos cadastros." />
      <CaixaInfo>
        <strong>Onde esta natureza será usada?</strong>
        <p>
          Na classificação dos bens e no vínculo com as espécies cadastradas.
        </p>
      </CaixaInfo>
    </div>
  );
}

function Disponibilidade({ texto }: { texto: string }) {
  return (
    <fieldset className="border-t border-[#dfe7f1] pt-4">
      <legend className="sr-only">Disponibilidade</legend>
      <h3 className="text-sm font-bold">Disponibilidade</h3>
      <label className="mt-3 flex items-center gap-2 text-xs">
        <input type="checkbox" defaultChecked />
        Cadastro ativo
      </label>
      <p className="mt-1 pl-5 text-[11px] text-[#62748e]">{texto}</p>
    </fieldset>
  );
}

const membros = [
  { nome: "Paulo Caixeta", matricula: "000142", funcao: "Presidente" },
  { nome: "Ana Martins", matricula: "000215", funcao: "Membro" },
  { nome: "Carlos Oliveira", matricula: "000308", funcao: "Membro" },
];

function ComissaoForm() {
  const [participantes, setParticipantes] = useState(membros);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Campo nome="Código automático">
          <input className={bloqueado} value="COM-003" readOnly />
        </Campo>
        <Campo nome="Nome da comissão" obrigatorio>
          <input
            className={campo}
            defaultValue="Comissão de Patrimônio · 2026"
          />
        </Campo>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo nome="Finalidade" obrigatorio>
          <select className={campo}>
            <option>Cadastro e acompanhamento patrimonial</option>
            <option>Inventário</option>
            <option>Avaliação</option>
          </select>
        </Campo>
        <Campo nome="Início da vigência" obrigatorio>
          <input className={campo} type="date" defaultValue="2026-01-01" />
        </Campo>
        <Campo nome="Fim da vigência" obrigatorio>
          <input className={campo} type="date" defaultValue="2026-12-31" />
        </Campo>
        <Campo nome="Portaria / ato de designação">
          <input className={campo} defaultValue="Portaria nº 012/2026" />
        </Campo>
        <Campo nome="Data da designação">
          <input className={campo} type="date" defaultValue="2026-01-01" />
        </Campo>
        <Campo nome="Situação" obrigatorio>
          <select className={campo}>
            <option>Ativa</option>
            <option>Inativa</option>
          </select>
        </Campo>
      </div>
      <section className="border-t border-[#dfe7f1] pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Membros da comissão</h3>
            <p className="text-[11px] text-[#62748e]">
              Selecione os funcionários e defina a função de cada participante.
            </p>
          </div>
          <button
            type="button"
            className={botao}
            disabled
            title="Disponível após integração com a API"
          >
            <Plus className="size-4" />
            Adicionar funcionário
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-[#f1f5f9] text-[10px] uppercase text-[#62748e]">
              <tr>
                <th className="p-2">Funcionário</th>
                <th className="p-2">Matrícula</th>
                <th className="p-2">Função na comissão</th>
                <th className="p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((membro) => (
                <tr
                  key={membro.matricula}
                  className="border-b border-[#dfe7f1]"
                >
                  <td className="p-2">{membro.nome}</td>
                  <td className="p-2">{membro.matricula}</td>
                  <td className="p-2">
                    <select className={campo} defaultValue={membro.funcao}>
                      <option>Presidente</option>
                      <option>Membro</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-[#62748e] underline"
                      onClick={() =>
                        setParticipantes((atuais) =>
                          atuais.filter(
                            (item) => item.matricula !== membro.matricula,
                          ),
                        )
                      }
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {participantes.length === 0 && (
          <p className="p-3 text-xs text-[#62748e]">
            Nenhum membro selecionado.
          </p>
        )}
      </section>
    </div>
  );
}

function ResponsavelForm() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[170px_minmax(0,1fr)]">
        <Campo nome="Matrícula" obrigatorio>
          <input className={campo} defaultValue="000142" />
        </Campo>
        <Campo nome="Nome completo" obrigatorio>
          <input className={campo} defaultValue="Paulo Caixeta" />
        </Campo>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo nome="Setor de lotação" obrigatorio>
          <select className={campo}>
            <option>Tecnologia da Informação</option>
            <option>Administrativo</option>
          </select>
        </Campo>
        <Campo nome="Cargo / função">
          <input className={campo} defaultValue="Analista de TI" />
        </Campo>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Campo nome="E-mail institucional">
          <input
            className={campo}
            type="email"
            placeholder="Ex.: nome@camara.gov.br"
          />
        </Campo>
        <Campo nome="Ramal">
          <input className={campo} placeholder="Ex.: 204" />
        </Campo>
      </div>
      <CaixaInfo>
        <strong>Responsável pelo patrimônio · funcionário</strong>
        <p>
          Este cadastro disponibiliza o funcionário para seleção como
          responsável pelos bens.
        </p>
      </CaixaInfo>
      <Disponibilidade texto="Funcionários ativos ficam disponíveis no cadastro e na movimentação de patrimônio." />
    </div>
  );
}

function Formulario({
  secao,
  novo,
  cancelar,
}: {
  secao: SecaoCadastro;
  novo: boolean;
  cancelar: () => void;
}) {
  return (
    <section
      className={`${cartao} flex min-h-[500px] flex-col`}
      aria-labelledby="formulario-cadastro"
    >
      <div id="formulario-cadastro">
        <CabecalhoFormulario secao={secao} novo={novo} />
      </div>
      <div className="flex-1">
        {secao === "processos" ? (
          <ProcessoForm novo={novo} />
        ) : secao === "especies" ? (
          <EspecieForm />
        ) : secao === "naturezas" ? (
          <NaturezaForm />
        ) : secao === "comissoes" ? (
          <ComissaoForm />
        ) : (
          <ResponsavelForm />
        )}
      </div>
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe7f1] pt-4">
        <p className="text-[11px] text-[#62748e]">
          Dados de exemplo · sem gravação
        </p>
        <div className="flex gap-2">
          <button className={botao} type="button" onClick={cancelar}>
            Cancelar
          </button>
          <button
            className="min-h-9 rounded-md bg-[#19355d] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled
            title="Disponível após integração com a API"
          >
            Salvar{" "}
            {secao === "processos"
              ? "processo"
              : secao === "especies"
                ? "espécie"
                : secao === "naturezas"
                  ? "natureza"
                  : secao === "comissoes"
                    ? "comissão"
                    : "responsável"}
          </button>
        </div>
      </footer>
    </section>
  );
}

export function CadastrosTelas({ secao }: { secao: SecaoCadastro }) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(
    secao === "processos" ? "028/2026" : "",
  );
  const [novo, setNovo] = useState(secao !== "processos");
  const paginaAtual = paginas[secao];
  const resultados = registros[secao].filter((item) =>
    `${item.titulo} ${item.detalhe}`
      .toLocaleLowerCase("pt-BR")
      .includes(busca.toLocaleLowerCase("pt-BR")),
  );
  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold leading-tight text-[#111d34] min-[1500px]:text-[27px]">
            {paginaAtual.titulo}
          </h1>
          <p className="mt-1 text-xs text-[#62748e]">{paginaAtual.subtitulo}</p>
        </div>
        {secao === "processos" ? (
          <Link href="/patrimonios" className={botao}>
            ← Voltar ao patrimônio
          </Link>
        ) : (
          <span className="text-[11px] text-[#62748e]">
            * Campos obrigatórios
          </span>
        )}
      </header>
      <AbasCadastros secao={secao} />
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(245px,300px)_minmax(0,1fr)]">
        <aside className={`${cartao} flex flex-col`}>
          <h2 className="text-sm font-bold">{paginaAtual.lista}</h2>
          <p className="mt-1 text-[11px] text-[#62748e]">
            Selecione para consultar ou editar.
          </p>
          <label className="mt-4 flex items-center gap-2 rounded-md border border-[#dfe7f1] bg-[#f7f9fc] px-3">
            <Search className="size-4 text-[#62748e]" />
            <span className="sr-only">Buscar cadastro</span>
            <input
              className="min-h-10 w-full bg-transparent text-xs outline-none"
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
          <p className="mt-3 text-[11px] text-[#62748e]">
            {resultados.length} registros de exemplo
          </p>
          <ul className="mt-2 space-y-2">
            {resultados.map((item) => (
              <li key={item.titulo}>
                <button
                  type="button"
                  className={`w-full rounded-md border p-3 text-left text-xs ${selecionado === item.titulo ? "border-[#bfd4ff] bg-[#eff5ff] text-[#2860eb]" : "border-[#dfe7f1] bg-white text-[#19355d] hover:bg-[#f7f9fc]"}`}
                  onClick={() => {
                    setSelecionado(item.titulo);
                    setNovo(false);
                  }}
                >
                  <strong>{item.titulo}</strong>
                  <small className="mt-1 block text-[#62748e]">
                    {item.detalhe}
                  </small>
                </button>
              </li>
            ))}
          </ul>
          {resultados.length === 0 && (
            <p className="py-5 text-center text-xs text-[#62748e]">
              Nenhum registro encontrado.
            </p>
          )}
          <div className="mt-auto pt-8">
            {secao === "processos" ? (
              <button
                type="button"
                className="flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-[#19355d] px-3 text-xs font-semibold text-white"
                onClick={() => {
                  setNovo(true);
                  setSelecionado("");
                }}
              >
                <Plus className="size-4" />
                Novo processo
              </button>
            ) : (
              <CaixaInfo>
                <strong>Antes de cadastrar</strong>
                <p>
                  Confira a lista para evitar registros duplicados no
                  patrimônio.
                </p>
              </CaixaInfo>
            )}
          </div>
        </aside>
        <Formulario
          secao={secao}
          novo={novo}
          cancelar={() => {
            setNovo(false);
            setSelecionado(registros[secao][0]?.titulo ?? "");
          }}
        />
      </div>
      <footer className="flex flex-wrap justify-between gap-2 py-2 text-[11px] text-[#62748e]">
        <span>SIPAT · Organização dos dados patrimoniais</span>
        <span>Prévia visual · sem gravação</span>
      </footer>
    </main>
  );
}
