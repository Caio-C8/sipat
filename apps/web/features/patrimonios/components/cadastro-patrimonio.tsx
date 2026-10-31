"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  FileText,
  Laptop,
  MapPin,
  Tag,
  TrendingDown,
} from "lucide-react";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-3 px-4 py-4 text-[#17253d] min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]";
const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-3.5 py-3 min-[1500px]:px-[19px] min-[1500px]:py-4";
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dfe7f1] bg-white px-3 text-xs text-[#19355d] outline-none focus-visible:ring-2 focus-visible:ring-[#2860eb]";
const bloqueado = `${campo} bg-[#f1f5f9] text-[#62748e]`;

function Rotulo({
  children,
  obrigatorio = false,
}: {
  children: React.ReactNode;
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
  children: React.ReactNode;
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

export function CadastroPatrimonio() {
  const [descricao, setDescricao] = useState(
    "Notebook corporativo, 16 GB de memória, SSD de 512 GB",
  );
  const [marca, setMarca] = useState("Dell");
  const [modelo, setModelo] = useState("Latitude 3450");
  const [serie, setSerie] = useState("LAT2026001");
  const [especie, setEspecie] = useState("Notebooks");
  const [setor, setSetor] = useState("Tecnologia da Informação");
  const [semPlaca, setSemPlaca] = useState(false);
  const [tipo, setTipo] = useState("Aquisição");
  const [aquisicao, setAquisicao] = useState(
    "028/2026 · Equipamentos de informática",
  );
  const [data, setData] = useState("2026-09-27");
  const [valor, setValor] = useState("5.490,00");
  const [vida, setVida] = useState("60");
  const [residual, setResidual] = useState("549,00");
  const [inicio, setInicio] = useState("2026-10-01");
  const [manterDados, setManterDados] = useState(false);
  const nomeResumo = descricao.split(",")[0]?.trim() || "Bem sem descrição";

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
        <span className="text-[11px] text-[#62748e]">
          * Campos obrigatórios
        </span>
      </header>
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(270px,315px)]">
        <div className="grid min-w-0 gap-3">
          <Secao titulo="Identificação do bem" Icone={Tag}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
              <label className="block">
                <Rotulo obrigatorio>Descrição do bem</Rotulo>
                <input
                  className={campo}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </label>
              <div>
                <label className="flex items-center gap-2 text-[11px] text-[#29456d]">
                  <input
                    type="checkbox"
                    checked={semPlaca}
                    onChange={(e) => setSemPlaca(e.target.checked)}
                  />
                  Bem sem placa (S/P)
                </label>
                <label className="mt-1 block">
                  <Rotulo>Número patrimonial</Rotulo>
                  <input
                    className={bloqueado}
                    value={semPlaca ? "Sem placa" : "Gerado ao cadastrar"}
                    readOnly
                  />
                </label>
                <p className="mt-1 text-[10px] text-[#62748e]">
                  Identificação atribuída pelo sistema.
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label>
                <Rotulo>Marca</Rotulo>
                <input
                  className={campo}
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
              </label>
              <label>
                <Rotulo>Modelo</Rotulo>
                <input
                  className={campo}
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </label>
              <label>
                <Rotulo>Número de série</Rotulo>
                <input
                  className={campo}
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                />
              </label>
            </div>
          </Secao>
          <Secao titulo="Classificação e localização" Icone={MapPin}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label>
                <Rotulo obrigatorio>Espécie</Rotulo>
                <select
                  className={campo}
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                >
                  <option>Notebooks</option>
                  <option>Computadores</option>
                </select>
              </label>
              <label>
                <Rotulo>Natureza da espécie</Rotulo>
                <input className={bloqueado} value="Bens móveis" readOnly />
                <small className="text-[10px] text-[#62748e]">
                  Definida pela espécie selecionada.
                </small>
              </label>
              <label>
                <Rotulo obrigatorio>Setor de destino</Rotulo>
                <select
                  className={campo}
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                >
                  <option>Tecnologia da Informação</option>
                  <option>Administrativo</option>
                </select>
              </label>
              <label>
                <Rotulo>Responsável do setor</Rotulo>
                <input
                  className={bloqueado}
                  value={
                    setor === "Administrativo"
                      ? "Ana Oliveira"
                      : "Paulo Caixeta"
                  }
                  readOnly
                />
                <small className="text-[10px] text-[#62748e]">
                  Vinculado ao setor de destino.
                </small>
              </label>
            </div>
          </Secao>
          <Secao
            titulo="Aquisição e tombamento"
            Icone={FileText}
            detalhe="Valores em reais (R$)"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[140px_1fr_145px_145px]">
              <label>
                <Rotulo obrigatorio>Tipo de tombamento</Rotulo>
                <select
                  className={campo}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option>Aquisição</option>
                </select>
              </label>
              <label>
                <Rotulo obrigatorio>Aquisição / processo de compra</Rotulo>
                <select
                  className={campo}
                  value={aquisicao}
                  onChange={(e) => setAquisicao(e.target.value)}
                >
                  <option>028/2026 · Equipamentos de informática</option>
                </select>
              </label>
              <label>
                <Rotulo obrigatorio>Data de tombamento</Rotulo>
                <input
                  className={campo}
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </label>
              <label>
                <Rotulo obrigatorio>Valor de incorporação (R$)</Rotulo>
                <input
                  className={campo}
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </label>
            </div>
            <p className="mt-3 text-[11px] text-[#62748e]">
              Aquisição vinculada: 2 fornecedores e 3 notas fiscais. Consulte os
              documentos ao lado.
            </p>
          </Secao>
          <Secao titulo="Depreciação automática" Icone={TrendingDown}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label>
                <Rotulo>Método</Rotulo>
                <input className={bloqueado} value="Linear" readOnly />
              </label>
              <label>
                <Rotulo obrigatorio>Vida útil (meses)</Rotulo>
                <input
                  className={campo}
                  type="number"
                  min="1"
                  value={vida}
                  onChange={(e) => setVida(e.target.value)}
                />
              </label>
              <label>
                <Rotulo obrigatorio>Residual (R$)</Rotulo>
                <input
                  className={campo}
                  inputMode="decimal"
                  value={residual}
                  onChange={(e) => setResidual(e.target.value)}
                />
              </label>
              <label>
                <Rotulo obrigatorio>Início da depreciação</Rotulo>
                <input
                  className={campo}
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
              </label>
              <div>
                <Rotulo>Estimativa mensal</Rotulo>
                <p className="mt-2 text-base font-bold text-[#19355d]">
                  R$ 82,35
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[#62748e]">
              Prévia ilustrativa. O processamento será realizado pelo sistema
              após a integração.
            </p>
          </Secao>
        </div>
        <aside className="grid content-start gap-3">
          <section className={cartao}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">Resumo do cadastro</h2>
              <span className="rounded-full bg-[#fff8e8] px-2 py-1 text-[10px] text-[#a65b0c]">
                Em preenchimento
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3 border-b border-[#dfe7f1] pb-4">
              <Laptop className="size-6 text-[#2860eb]" />
              <div>
                <strong className="text-sm">{nomeResumo}</strong>
                <p className="text-[11px] text-[#62748e]">
                  {marca} · {modelo}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[10px] uppercase text-[#62748e]">
              Número patrimonial
            </p>
            <p className="text-base font-bold">
              {semPlaca ? "Sem placa (S/P)" : "Gerado ao cadastrar"}
            </p>
            <p className="text-[11px] text-[#62748e]">
              Identificação sequencial e individual do bem.
            </p>
            <p className="mt-4 text-[11px] text-[#62748e]">Setor de destino</p>
            <p className="text-sm font-bold">{setor}</p>
            <div className="mt-4 rounded-lg bg-[#eef5ff] p-4">
              <p className="text-[11px]">Valor de incorporação</p>
              <p className="text-2xl font-bold text-[#19355d]">R$ {valor}</p>
              <p className="text-right text-[10px] text-[#62748e]">por bem</p>
            </div>
          </section>
          <section className={cartao}>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <FileText className="size-4 text-[#2860eb]" />
              Documentos da aquisição
            </h2>
            <p className="mt-3 text-xs font-bold">Processo 028/2026</p>
            <p className="mt-2 text-[11px] text-[#62748e]">
              2 fornecedores · 3 notas fiscais vinculadas
            </p>
            <p className="mt-3 border-t border-[#dfe7f1] pt-3 text-[11px]">
              Valor total da aquisição{" "}
              <strong className="float-right">R$ 18.000,00</strong>
            </p>
          </section>
          <section className="rounded-lg border border-[#d9e8ff] bg-[#eef5ff] p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <ClipboardCheck className="size-4 text-[#2860eb]" />
              Confira antes de cadastrar
            </h2>
            <p className="mt-3 text-[11px] text-[#62748e]">
              Revise a identificação, o setor e os valores. Os dados do bem não
              poderão ser editados livremente após o cadastro.
            </p>
          </section>
        </aside>
      </div>
      <footer className={`${cartao} flex flex-wrap items-center gap-3`}>
        <Link
          href="/patrimonios"
          className="rounded-md border border-[#dfe7f1] px-4 py-2 text-xs font-semibold"
        >
          Cancelar
        </Link>
        <label className="mr-auto flex items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={manterDados}
            onChange={(e) => setManterDados(e.target.checked)}
          />
          Manter dados para cadastrar outro bem
        </label>
        <button
          className="rounded-md bg-[#19355d] px-5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled
          title="Cadastro disponível após integração com a API"
        >
          Cadastrar patrimônio
        </button>
        <p className="w-full text-right text-[10px] text-[#62748e]">
          Prévia visual: nenhum cadastro será enviado.
        </p>
      </footer>
    </main>
  );
}
