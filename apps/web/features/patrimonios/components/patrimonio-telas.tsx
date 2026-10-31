"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowLeftRight,
  Box,
  FileText,
  Hash,
  Info,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { historicoExemplo, patrimonioExemplo as bem } from "./dados-exemplo";
import { PatrimonioModal, type AcaoPatrimonio } from "./patrimonio-modais";

type Tela = "consulta" | "ficha" | "relatorio";
type Aba = "dados" | "historico";
// Mantém o dimensionamento e as cores da área principal do dashboard.
const paginaSistema =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-3 px-4 py-4 text-[#17253d] min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]";
const tituloPagina =
  "text-xl leading-tight font-bold text-[#111d34] min-[1500px]:text-[27px]";
const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-2.5 min-[1500px]:px-[19px] min-[1500px]:py-4";
const botao =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#dce5f0] bg-white px-4 text-xs font-semibold text-[#203b61] hover:bg-[#f4f8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2863ec] disabled:cursor-not-allowed disabled:opacity-50";
const principal =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#203b61] px-4 text-xs font-semibold text-white hover:bg-[#31537f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2863ec]";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#e9fbf3] px-4 py-1 text-[11px] font-semibold text-[#00865f]">
      {children}
    </span>
  );
}
function CampoDado({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-[#7188a5]">{titulo}</dt>
      <dd className="mt-1 break-words text-sm text-[#203b61]">{valor}</dd>
    </div>
  );
}
function CabecalhoSecao({
  children,
  icon: Icone,
}: {
  children: React.ReactNode;
  icon: typeof Box;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#17253d]">
      <span className="rounded-md bg-[#eef5ff] p-2 text-[#2863ec]">
        <Icone className="size-4" />
      </span>
      {children}
    </h2>
  );
}

function Consulta({
  abrirFicha,
  podeCadastrar,
}: {
  abrirFicha: () => void;
  podeCadastrar: boolean;
}) {
  const [termo, setTermo] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [situacao, setSituacao] = useState("todas");
  const encontrado =
    (situacao === "todas" || situacao === "ativo") &&
    (!pesquisa ||
      [bem.numero, bem.codigo, bem.nome, bem.descricao].some((valor) =>
        valor
          .toLocaleLowerCase("pt-BR")
          .includes(pesquisa.toLocaleLowerCase("pt-BR")),
      ));
  return (
    <main className={paginaSistema}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={tituloPagina}>Consultar patrimônio</h1>
          <p className="mt-1 text-xs text-[#7188a5]">
            Encontre um bem e acompanhe seus dados e todas as ocorrências em um
            só lugar.
          </p>
        </div>
        {podeCadastrar ? (
          <Link className={principal} href="/patrimonios/novo">
            + Novo patrimônio
          </Link>
        ) : null}
      </header>
      <section className={cartao} aria-labelledby="pesquisa-title">
        <CabecalhoSecao icon={Search}>
          <span id="pesquisa-title">Pesquisar patrimônio</span>
        </CabecalhoSecao>
        <p className="-mt-2 mb-4 text-xs text-[#7188a5]">
          Pesquise pela placa, pelo código do bem ou por sua descrição.
        </p>
        <form
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_140px] md:items-end"
          onSubmit={(evento) => {
            evento.preventDefault();
            setPesquisa(termo.trim());
          }}
        >
          <label className="text-xs">
            Placa, código ou descrição
            <input
              className="mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2863ec]"
              value={termo}
              onChange={(evento) => setTermo(evento.target.value)}
              placeholder="000002656"
            />
          </label>
          <label className="text-xs">
            Situação
            <select
              className="mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] px-3 text-sm"
              value={situacao}
              onChange={(evento) => setSituacao(evento.target.value)}
            >
              <option value="todas">Todas as situações</option>
              <option value="ativo">Ativo</option>
              <option value="manutencao">Em manutenção</option>
              <option value="baixado">Baixado</option>
            </select>
          </label>
          <button className={principal} type="submit">
            <Search className="size-4" />
            Pesquisar
          </button>
        </form>
        <p className="mt-2 text-[11px] text-[#7188a5]">
          Busca de exemplo: 000002656, NB-2026-001 ou Notebook.
        </p>
      </section>
      <section
        className={`${cartao} min-h-[360px]`}
        aria-labelledby="resultados-title"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            id="resultados-title"
            className="text-sm font-bold text-[#17253d]"
          >
            Resultados da pesquisa
          </h2>
          <span className="text-xs text-[#7188a5]">
            {encontrado
              ? "1 patrimônio encontrado"
              : "Nenhum patrimônio encontrado"}
          </span>
        </div>
        {encontrado ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-1 text-left text-xs">
              <thead className="bg-[#f7f9fc] text-[10px] uppercase text-[#7188a5]">
                <tr>
                  <th className="p-3">Patrimônio / código</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Setor / responsável</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3">Valor atual</th>
                  <th className="p-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr className="rounded-md outline outline-1 outline-[#e4ebf4]">
                  <td className="p-3">
                    <strong className="text-sm">{bem.numero}</strong>
                    <small className="mt-1 block text-[#7188a5]">
                      {bem.codigo}
                    </small>
                  </td>
                  <td className="p-3">
                    <strong>{bem.nome}</strong>
                    <small className="mt-1 block text-[#7188a5]">
                      Equipamentos de informática · Bem móvel
                    </small>
                  </td>
                  <td className="p-3">
                    {bem.setor}
                    <small className="mt-1 block text-[#7188a5]">
                      {bem.responsavel}
                    </small>
                  </td>
                  <td className="p-3">
                    <Etiqueta>Ativo</Etiqueta>
                  </td>
                  <td className="p-3 font-bold">{bem.atual}</td>
                  <td className="p-3">
                    <button className={botao} onClick={abrirFicha}>
                      Ver ficha
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md bg-[#f7f9fc] p-8 text-center text-sm text-[#7188a5]">
            Nenhum bem corresponde aos filtros informados.
          </div>
        )}
        <div className="mt-16 rounded-md bg-[#eef5ff] p-4 text-xs">
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 text-[#2863ec]" />
            <div>
              <strong>Do resultado à ficha completa</strong>
              <p className="mt-1 text-[#7188a5]">
                Consulte movimentações, depreciações e manutenções. A adição
                fica em uma tela separada.
              </p>
            </div>
          </div>
        </div>
      </section>
      <p className="text-xs text-[#7188a5]">
        Itens S/P podem ser encontrados pelo código do bem ou pela descrição. ·
        Dados ilustrativos
      </p>
    </main>
  );
}

function Valores() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        {
          titulo: "Valor de incorporação",
          valor: bem.incorporacao,
          icon: Wallet,
        },
        { titulo: "Valor atual", valor: bem.atual, icon: TrendingUp },
        {
          titulo: "Depreciação acumulada",
          valor: bem.depreciacao,
          icon: TrendingDown,
        },
      ].map(({ titulo, valor, icon: Icone }) => (
        <div className={`${cartao} flex items-center gap-3`} key={titulo}>
          <Icone className="size-5 shrink-0 text-[#2863ec]" />
          <div>
            <p className="text-[10px] font-semibold uppercase text-[#7188a5]">
              {titulo}
            </p>
            <p className="text-xl font-bold text-[#203b61]">{valor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DadosBem() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={`${cartao} lg:col-span-2`}>
        <CabecalhoSecao icon={Box}>
          Identificação e classificação
        </CabecalhoSecao>
        <dl className="grid gap-5 sm:grid-cols-3">
          <CampoDado titulo="Marca" valor={bem.marca} />
          <CampoDado titulo="Modelo" valor={bem.modelo} />
          <CampoDado titulo="Número de série" valor={bem.serie} />
          <div className="sm:col-span-3">
            <CampoDado titulo="Descrição" valor={bem.descricao} />
          </div>
          <CampoDado titulo="Espécie" valor={bem.especie} />
          <CampoDado titulo="Natureza da espécie" valor={bem.natureza} />
        </dl>
      </section>
      <section className={cartao}>
        <CabecalhoSecao icon={Box}>
          Localização e responsabilidade
        </CabecalhoSecao>
        <dl className="space-y-5">
          <CampoDado titulo="Setor atual" valor={bem.setor} />
          <CampoDado titulo="Responsável do setor" valor={bem.responsavel} />
        </dl>
        <p className="mt-5 text-xs text-[#7188a5]">
          A responsabilidade acompanha o setor do patrimônio.
        </p>
      </section>
      <section className={cartao}>
        <CabecalhoSecao icon={FileText}>Aquisição e tombamento</CabecalhoSecao>
        <dl className="grid gap-5 sm:grid-cols-2">
          <CampoDado titulo="Tipo de tombamento" valor="Aquisição" />
          <CampoDado titulo="Data do tombamento" valor={bem.tombamento} />
          <div className="sm:col-span-2">
            <CampoDado titulo="Aquisição vinculada" valor={bem.aquisicao} />
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#7188a5]">
          Valor de incorporação por bem: {bem.incorporacao}
        </p>
        <button
          className={`${botao} mt-4 w-full`}
          disabled
          title="Consulta de aquisição fora desta entrega"
        >
          Consultar aquisição
        </button>
      </section>
      <section className={cartao}>
        <CabecalhoSecao icon={TrendingDown}>
          Parâmetros de depreciação
        </CabecalhoSecao>
        <dl className="grid grid-cols-2 gap-5">
          <CampoDado titulo="Método" valor="Linear · automático" />
          <CampoDado titulo="Vida útil inicial" valor="60 meses" />
          <CampoDado titulo="Valor residual" valor={bem.residual} />
          <CampoDado titulo="Início" valor="01/07/2026" />
        </dl>
        <p className="mt-4 text-xs font-semibold">
          3 depreciações · R$ 82,35 por mês
        </p>
      </section>
      <section className={cartao}>
        <CabecalhoSecao icon={Archive}>Últimos registros</CabecalhoSecao>
        <ul className="space-y-3 text-xs">
          {historicoExemplo.slice(0, 3).map((item) => (
            <li key={item.registro}>
              <strong>{item.tipo}</strong>
              <span className="float-right text-[#7188a5]">{item.data}</span>
              <p className="text-[#7188a5]">{item.descricao}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Historico() {
  const [tipo, setTipo] = useState("Todos");
  const [termo, setTermo] = useState("");
  const itens = historicoExemplo.filter(
    (item) =>
      (tipo === "Todos" || item.tipo === tipo) &&
      `${item.descricao} ${item.registro}`
        .toLocaleLowerCase("pt-BR")
        .includes(termo.toLocaleLowerCase("pt-BR")),
  );
  return (
    <section className={cartao}>
      <h2 className="mb-4 text-base font-bold text-[#17253d]">
        Histórico de operações
      </h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-[200px_minmax(0,430px)]">
        <label className="text-xs">
          Tipo de operação
          <select
            className="mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] px-3"
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
          >
            {[
              "Todos",
              "Inventário",
              "Depreciação",
              "Movimentação",
              "Manutenção",
            ].map((opcao) => (
              <option key={opcao}>{opcao}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Pesquisar no histórico
          <input
            className="mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] px-3"
            placeholder="Descrição ou número do registro"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-[#f7f9fc] text-[10px] uppercase text-[#7188a5]">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Operação / registro</th>
              <th className="p-3">Descrição</th>
              <th className="p-3">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr className="border-b border-[#e4ebf4]" key={item.registro}>
                <td className="p-3">{item.data}</td>
                <td className="p-3">
                  <strong>{item.tipo}</strong>
                  <small className="block text-[#7188a5]">
                    {item.registro}
                  </small>
                </td>
                <td className="p-3">
                  <strong>{item.descricao}</strong>
                  <small className="block text-[#7188a5]">{item.detalhe}</small>
                </td>
                <td className="p-3 font-semibold">{item.resultado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {itens.length === 0 && (
        <p className="p-6 text-center text-xs text-[#7188a5]">
          Nenhum registro encontrado.
        </p>
      )}
      <p className="mt-4 text-xs text-[#7188a5]">
        Os registros anteriores permanecem disponíveis após cada operação. ·
        Dados ilustrativos
      </p>
    </section>
  );
}

function Ficha({
  novaPesquisa,
  gerarRelatorio,
  abrirModal,
}: {
  novaPesquisa: () => void;
  gerarRelatorio: () => void;
  abrirModal: (acao: AcaoPatrimonio) => void;
}) {
  const [aba, setAba] = useState<Aba>("dados");
  const [mais, setMais] = useState(false);
  return (
    <main className={paginaSistema}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className={tituloPagina}>{bem.nome}</h1>
            <Etiqueta>Ativo</Etiqueta>
          </div>
          <p className="mt-1 text-xs text-[#7188a5]">
            Patrimônio {bem.numero} · Com placa patrimonial
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={botao} onClick={novaPesquisa}>
            <Search className="size-4" />
            Nova pesquisa
          </button>
          <button className={botao} onClick={gerarRelatorio}>
            <FileText className="size-4" />
            Gerar ficha do bem
          </button>
        </div>
      </header>
      <Valores />
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-[#d5e4ff] bg-[#eef5ff] p-3">
        <Box className="size-5 text-[#203b61]" />
        <div className="mr-auto">
          <h2 className="text-xs font-bold">Ações deste patrimônio</h2>
          <p className="text-[11px] text-[#7188a5]">
            O bem já está selecionado.
          </p>
        </div>
        <button className={principal} onClick={() => abrirModal("movimentar")}>
          <ArrowLeftRight className="size-4" />
          Movimentar bem
        </button>
        <button className={botao} onClick={() => abrirModal("reavaliar")}>
          <TrendingUp className="size-4" />
          Registrar reavaliação
        </button>
        <div className="relative">
          <button
            className={botao}
            aria-expanded={mais}
            aria-haspopup="menu"
            onClick={() => setMais(!mais)}
          >
            Mais ações
          </button>
          {mais && (
            <div
              className="absolute right-0 z-10 mt-1 w-52 rounded-md border border-[#dce5f0] bg-white p-1 shadow-lg"
              role="menu"
            >
              <button
                className="w-full rounded p-2 text-left text-xs hover:bg-[#eef5ff]"
                role="menuitem"
                onClick={() => {
                  abrirModal("baixar");
                  setMais(false);
                }}
              >
                <Archive className="mr-2 inline size-4" />
                Registrar baixa
              </button>
              <button
                className="w-full rounded p-2 text-left text-xs hover:bg-[#eef5ff]"
                role="menuitem"
                onClick={() => {
                  abrirModal("substituir");
                  setMais(false);
                }}
              >
                <Hash className="mr-2 inline size-4" />
                Substituir número da placa
              </button>
            </div>
          )}
        </div>
      </section>
      <div className="flex gap-2 rounded-lg border border-[#dce5f0] bg-white px-3 pt-1">
        <button
          className={`min-h-10 border-b-2 px-4 text-xs ${aba === "dados" ? "border-[#2863ec] font-bold text-[#2863ec]" : "border-transparent text-[#7188a5]"}`}
          onClick={() => setAba("dados")}
        >
          Dados do bem
        </button>
        <button
          className={`min-h-10 border-b-2 px-4 text-xs ${aba === "historico" ? "border-[#2863ec] font-bold text-[#2863ec]" : "border-transparent text-[#7188a5]"}`}
          onClick={() => setAba("historico")}
        >
          Histórico do bem
        </button>
      </div>
      {aba === "dados" ? <DadosBem /> : <Historico />}
      <footer className="flex flex-wrap justify-between gap-2 py-3 text-xs text-[#7188a5]">
        <span>Cadastrado por Paulo Caixeta · 15/06/2026</span>
        <span>Histórico preservado em cada operação · Dados ilustrativos</span>
      </footer>
    </main>
  );
}

function Relatorio({ voltar }: { voltar: () => void }) {
  const [completo, setCompleto] = useState(true);
  const [historico, setHistorico] = useState(true);
  return (
    <main className={paginaSistema}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={tituloPagina}>Relatório do patrimônio</h1>
          <p className="mt-1 text-xs text-[#7188a5]">
            Ficha individual com identificação, valores e histórico do bem.
          </p>
        </div>
        <button className={botao} onClick={voltar}>
          <ArrowLeft className="size-4" />
          Voltar à ficha
        </button>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <aside className={`${cartao} flex flex-col gap-5`}>
          <CabecalhoSecao icon={FileText}>Opções do relatório</CabecalhoSecao>
          <p className="-mt-5 text-xs text-[#7188a5]">
            Patrimônio {bem.numero} · {bem.nome}
          </p>
          <fieldset className="space-y-5">
            <legend className="mb-3 text-[11px] font-bold uppercase text-[#7188a5]">
              Conteúdo
            </legend>
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={completo}
                onChange={(evento) => setCompleto(evento.target.checked)}
              />
              Ficha completa do patrimônio
            </label>
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={historico}
                onChange={(evento) => setHistorico(evento.target.checked)}
              />
              Incluir histórico completo
            </label>
          </fieldset>
          <dl className="space-y-4 border-t border-[#e4ebf4] pt-5">
            <CampoDado
              titulo="Formato de impressão"
              valor="A4 · orientação retrato"
            />
            <CampoDado titulo="Moeda" valor="Real brasileiro (R$)" />
            <CampoDado titulo="Emitido por" valor="Paulo Caixeta" />
          </dl>
          <div className="mt-auto space-y-2 pt-10">
            <button
              className={`${principal} w-full`}
              disabled
              title="Exportação disponível após integração"
            >
              <FileText className="size-4" />
              Imprimir / salvar em PDF
            </button>
            <button
              className={`${botao} w-full`}
              disabled
              title="Exportação disponível após integração"
            >
              Baixar relatório HTML
            </button>
            <p className="pt-3 text-[11px] text-[#7188a5]">
              Prévia com dados ilustrativos. Exportação pendente de integração.
            </p>
          </div>
        </aside>
        <section
          className="flex min-w-0 justify-center rounded-lg bg-[#e9eef5] p-3 sm:p-6"
          aria-label="Prévia do relatório"
        >
          <article className="w-full max-w-[600px] bg-white p-5 text-[#203b61] shadow-sm sm:p-8">
            <header className="flex justify-between border-t-4 border-[#203b61] pt-3 text-[10px]">
              <strong>CÂMARA MUNICIPAL DE PATOS DE MINAS</strong>
              <span>Emissão: 28/09/2026</span>
            </header>
            <h2 className="mt-6 text-lg font-bold">{bem.nome}</h2>
            <p className="text-xs">Número patrimonial {bem.numero}</p>
            <p className="mt-2 text-xs">{bem.descricao}</p>
            {completo && (
              <>
                <h3 className="mt-6 bg-[#eef2f7] p-2 text-xs font-bold uppercase">
                  Identificação, classificação e localização
                </h3>
                <dl className="mt-3 grid gap-4 sm:grid-cols-3">
                  <CampoDado titulo="Marca" valor={bem.marca} />
                  <CampoDado titulo="Modelo" valor={bem.modelo} />
                  <CampoDado titulo="Número de série" valor={bem.serie} />
                  <CampoDado titulo="Setor" valor={bem.setor} />
                  <CampoDado titulo="Responsável" valor={bem.responsavel} />
                  <CampoDado titulo="Espécie" valor={bem.especie} />
                </dl>
                <h3 className="mt-6 bg-[#eef2f7] p-2 text-xs font-bold uppercase">
                  Aquisição e tombamento
                </h3>
                <dl className="mt-3 grid gap-4 sm:grid-cols-3">
                  <CampoDado titulo="Processo" valor={bem.aquisicao} />
                  <CampoDado titulo="Tombamento" valor={bem.tombamento} />
                  <CampoDado titulo="Tipo" valor="Aquisição" />
                </dl>
                <h3 className="mt-6 bg-[#eef2f7] p-2 text-xs font-bold uppercase">
                  Valores do bem
                </h3>
                <dl className="mt-3 grid gap-4 sm:grid-cols-3">
                  <CampoDado titulo="Incorporação" valor={bem.incorporacao} />
                  <CampoDado titulo="Depreciação" valor={bem.depreciacao} />
                  <CampoDado titulo="Valor atual" valor={bem.atual} />
                </dl>
              </>
            )}
            {historico && (
              <>
                <h3 className="mt-6 bg-[#eef2f7] p-2 text-xs font-bold uppercase">
                  Histórico do patrimônio
                </h3>
                <ul className="mt-3 space-y-2 text-xs">
                  {historicoExemplo.map((item) => (
                    <li key={item.registro}>
                      <strong>
                        {item.data} · {item.tipo}
                      </strong>{" "}
                      — {item.descricao}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <footer className="mt-8 border-t border-[#dce5f0] pt-3 text-[10px] text-[#7188a5]">
              Prévia ilustrativa · SIPAT · Câmara Municipal de Patos de Minas
            </footer>
          </article>
        </section>
      </div>
    </main>
  );
}

/** Prévia visual de consulta, ficha e relatório patrimonial. */
export function PatrimonioTelas({
  podeCadastrar = false,
}: {
  podeCadastrar?: boolean;
}) {
  const [tela, setTela] = useState<Tela>("consulta");
  const [modal, setModal] = useState<AcaoPatrimonio | null>(null);
  return (
    <>
      {tela === "consulta" ? (
        <Consulta
          abrirFicha={() => setTela("ficha")}
          podeCadastrar={podeCadastrar}
        />
      ) : tela === "ficha" ? (
        <Ficha
          novaPesquisa={() => setTela("consulta")}
          gerarRelatorio={() => setTela("relatorio")}
          abrirModal={setModal}
        />
      ) : (
        <Relatorio voltar={() => setTela("ficha")} />
      )}
      <PatrimonioModal acao={modal} onClose={() => setModal(null)} />
    </>
  );
}
