"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Info,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { AbasCadastros } from "./abas-cadastros";
import {
  bensGabineteExemplo,
  setoresExemplo,
  type SetorExemplo,
} from "./setores-exemplo";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-3 px-4 py-4 text-[#17253d] min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]";
const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 min-[1500px]:p-5";
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dfe7f1] bg-white px-3 text-xs text-[#19355d] outline-none focus-visible:ring-2 focus-visible:ring-[#2860eb]";
const botao =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#dfe7f1] bg-white px-4 text-xs font-semibold text-[#19355d] hover:bg-[#f7f9fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb]";
const principal =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#19355d] px-4 text-xs font-semibold text-white hover:bg-[#2b4c79] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb]";

function Cabecalho({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold leading-tight text-[#111d34] min-[1500px]:text-[27px]">
          {titulo}
        </h1>
        <p className="mt-1 text-xs text-[#62748e]">{descricao}</p>
      </div>
      {acao}
    </header>
  );
}
function TituloCartao({
  titulo,
  Icone,
}: {
  titulo: string;
  Icone: typeof MapPin;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
      <span className="rounded-md bg-[#eff5ff] p-2 text-[#2860eb]">
        <Icone className="size-4" />
      </span>
      {titulo}
    </h2>
  );
}
function Dado({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[#62748e]">{nome}</dt>
      <dd className="mt-1 text-xs text-[#19355d]">
        {valor || "Não informado"}
      </dd>
    </div>
  );
}
function Rotulo({
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
function Rodape() {
  return (
    <footer className="flex flex-wrap justify-between gap-2 py-2 text-[11px] text-[#62748e]">
      <span>SIPAT · Cadastro de setores</span>
      <span>Prévia visual · sem gravação</span>
    </footer>
  );
}
function Situacao() {
  return (
    <span className="rounded-full bg-[#e9fbf3] px-3 py-1 text-[10px] font-semibold text-[#00865f]">
      ● Ativo
    </span>
  );
}

export function ListaSetores() {
  const [termo, setTermo] = useState("");
  const [consulta, setConsulta] = useState("");
  const [situacao, setSituacao] = useState("todos");
  const resultados = setoresExemplo.filter(
    (setor) =>
      (situacao === "todos" || situacao === "ativos") &&
      `${setor.nome} ${setor.codigo} ${setor.sigla} ${setor.sala}`
        .toLocaleLowerCase("pt-BR")
        .includes(consulta.toLocaleLowerCase("pt-BR")),
  );
  return (
    <main className={pagina}>
      <Cabecalho
        titulo="Setores"
        descricao="Consulte os setores, seus responsáveis, salas e bens vinculados."
        acao={
          <Link className={principal} href="/cadastros/setores/novo">
            <Plus className="size-4" />
            Cadastrar setor
          </Link>
        }
      />
      <AbasCadastros secao="setores" />
      <form
        className={`${cartao} grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(160px,250px)_170px] md:items-end`}
        onSubmit={(e) => {
          e.preventDefault();
          setConsulta(termo.trim());
        }}
      >
        <Rotulo nome="Nome, código ou sigla">
          <input
            className={campo}
            placeholder="Ex.: Gabinete 02, TI ou SET-005"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </Rotulo>
        <Rotulo nome="Situação">
          <select
            className={campo}
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="todos">Todos os setores</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </Rotulo>
        <button className={botao} type="submit">
          <Search className="size-4" />
          Consultar
        </button>
      </form>
      <section
        className={`${cartao} min-h-[330px]`}
        aria-labelledby="setores-lista-title"
      >
        <div className="mb-3 flex justify-between gap-2">
          <h2 id="setores-lista-title" className="text-sm font-bold">
            Setores cadastrados
          </h2>
          <span className="text-[11px] text-[#62748e]">
            {resultados.length} {resultados.length === 1 ? "setor" : "setores"}{" "}
            de exemplo
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[#f7f9fc] text-[10px] uppercase text-[#62748e]">
              <tr>
                <th className="p-3">Setor / código</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Sala / localização</th>
                <th className="p-3">Bens</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((setor) => (
                <tr
                  key={setor.id}
                  className="border-b border-[#e5ebf3] odd:bg-white even:bg-[#f8fafc]"
                >
                  <td className="p-3">
                    <strong>{setor.nome}</strong>
                    <small className="mt-1 block text-[#62748e]">
                      {setor.codigo} · {setor.sigla}
                    </small>
                  </td>
                  <td className="p-3">{setor.responsavel}</td>
                  <td className="p-3">
                    {setor.sala}
                    <small className="mt-1 block text-[#62748e]">
                      {setor.andar}
                    </small>
                  </td>
                  <td className="p-3 font-bold">{setor.bens}</td>
                  <td className="p-3">
                    <Situacao />
                  </td>
                  <td className="p-3">
                    <Link
                      className={botao}
                      href={`/cadastros/setores/${setor.id}`}
                    >
                      Consultar<span className="sr-only"> {setor.nome}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resultados.length === 0 && (
          <p className="p-6 text-center text-xs text-[#62748e]">
            Nenhum setor encontrado.
          </p>
        )}
      </section>
      <p className="px-1 text-[11px] text-[#62748e]">
        Cada gabinete possui seu próprio cadastro de setor, assim como TI,
        Administrativo e Plenário.
      </p>
      <Rodape />
    </main>
  );
}

export function DetalheSetor({ setor }: { setor: SetorExemplo }) {
  const bens = setor.id === "gabinete-02" ? bensGabineteExemplo : [];
  return (
    <main className={pagina}>
      <Cabecalho
        titulo={setor.nome}
        descricao={`${setor.codigo} · Dados do setor e bens vinculados.`}
        acao={
          <Link href="/cadastros/setores" className={botao}>
            <ArrowLeft className="size-4" />
            Voltar aos setores
          </Link>
        }
      />
      <AbasCadastros secao="setores" />
      <section className={cartao}>
        <TituloCartao titulo="Identificação do setor" Icone={LayoutGrid} />
        <dl className="grid gap-5 sm:grid-cols-4">
          <Dado nome="Nome" valor={setor.nome} />
          <Dado nome="Sigla" valor={setor.sigla} />
          <Dado nome="Responsável · funcionário" valor={setor.responsavel} />
          <div className="sm:text-right">
            <Situacao />
            <p className="mt-5 text-[10px] text-[#62748e]">
              Dados ilustrativos
            </p>
          </div>
        </dl>
      </section>
      <section className={cartao}>
        <TituloCartao titulo="Localização física" Icone={MapPin} />
        <dl className="grid gap-5 sm:grid-cols-4">
          <Dado nome="Sala / localização" valor={setor.sala} />
          <Dado nome="Andar" valor={setor.andar} />
          <Dado nome="Prédio / unidade" valor={setor.edificio} />
          <Dado nome="Ramal" valor={setor.ramal} />
        </dl>
      </section>
      <section className={cartao}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Bens vinculados ao setor</h2>
          <span className="text-[11px] text-[#62748e]">
            {setor.bens} bens de exemplo
          </span>
        </div>
        {bens.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-[#f7f9fc] text-[10px] uppercase text-[#62748e]">
                <tr>
                  <th className="p-3">Patrimônio</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {bens.map((bem) => (
                  <tr
                    key={bem.numero}
                    className="border-b border-[#e5ebf3] even:bg-[#f8fafc]"
                  >
                    <td className="p-3 font-bold">{bem.numero}</td>
                    <td className="p-3">{bem.descricao}</td>
                    <td className="p-3">{setor.responsavel}</td>
                    <td className="p-3">
                      <Situacao />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-md bg-[#f7f9fc] p-5 text-xs text-[#62748e]">
            Prévia de bens vinculados disponível para Gabinete 02.
          </p>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={botao}
          disabled
          title="Disponível após integração com a API"
        >
          Editar setor
        </button>
        <button
          className={botao}
          disabled
          title="Disponível após integração com a API"
        >
          Inativar setor
        </button>
        <span className="ml-auto text-[11px] text-[#62748e]">
          O histórico dos bens permanece disponível.
        </span>
      </div>
      <Rodape />
    </main>
  );
}

export function NovoSetor() {
  return (
    <main className={pagina}>
      <Cabecalho
        titulo="Cadastrar setor"
        descricao="Informe o nome, o responsável e a sala ocupada pelo setor."
        acao={
          <Link href="/cadastros/setores" className={botao}>
            <ArrowLeft className="size-4" />
            Voltar aos setores
          </Link>
        }
      />
      <AbasCadastros secao="setores" />
      <section className={cartao}>
        <TituloCartao titulo="Identificação do setor" Icone={LayoutGrid} />
        <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <Rotulo nome="Código">
            <input
              className={`${campo} bg-[#f1f5f9] text-[#62748e]`}
              value="SET-006"
              readOnly
            />
          </Rotulo>
          <Rotulo nome="Nome do setor" obrigatorio>
            <input className={campo} defaultValue="Gabinete 03" />
          </Rotulo>
          <Rotulo nome="Sigla">
            <input className={campo} defaultValue="GAB03" />
          </Rotulo>
          <Rotulo nome="Responsável · funcionário" obrigatorio>
            <select className={campo}>
              <option>Paulo Caixeta</option>
              <option>Ana Martins</option>
            </select>
          </Rotulo>
        </div>
      </section>
      <section className={cartao}>
        <TituloCartao titulo="Localização física" Icone={MapPin} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,250px)]">
          <Rotulo nome="Sala / localização" obrigatorio>
            <input className={campo} defaultValue="Sala 203" />
          </Rotulo>
          <Rotulo nome="Andar">
            <select className={campo}>
              <option>2º andar</option>
              <option>1º andar</option>
              <option>Térreo</option>
            </select>
          </Rotulo>
          <Rotulo nome="Prédio / unidade">
            <select className={campo}>
              <option>Sede da Câmara</option>
            </select>
          </Rotulo>
          <Rotulo nome="Ramal">
            <input className={campo} defaultValue="223" />
          </Rotulo>
        </div>
      </section>
      <div className="rounded-lg bg-[#eef5ff] p-4 text-xs text-[#29456d]">
        <Info className="mr-2 inline size-4 text-[#2860eb]" />
        <strong>Responsabilidade e localização</strong>
        <p className="ml-6 mt-1 text-[#62748e]">
          O responsável é um funcionário. Alterar a sala do cadastro não
          registra uma movimentação dos bens.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <Link href="/cadastros/setores" className={botao}>
          Cancelar
        </Link>
        <button
          className={`${principal} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled
          title="Disponível após integração com a API"
        >
          Salvar setor
        </button>
      </div>
      <Rodape />
    </main>
  );
}
