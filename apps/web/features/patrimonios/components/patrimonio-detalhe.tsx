import Link from "next/link";
import {
  Box,
  FileText,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { EventosFichaResponse, PatrimonioDetalhe } from "@repo/contracts";
import { apresentarEvento, formatarData, rotulosEvento } from "../apresentacao";
import { PatrimonioAcoes } from "./patrimonio-acoes";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-4 text-[#17253d] sm:px-7 sm:py-6";
const cartao = "min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5";
const botao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#dce5f0] bg-white px-4 text-sm font-semibold text-[#203b61] hover:bg-[#f4f8ff] focus-visible:outline-2 focus-visible:outline-[#2863ec]";
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 text-sm";
const nulo = "Não informado";
const moeda = (valor: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(valor),
  );

function Dado({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs text-[#7188a5]">{titulo}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[#203b61]">
        {valor ?? nulo}
      </dd>
    </div>
  );
}

function Historico({
  resposta,
  valores,
  patrimonioId,
}: {
  resposta: EventosFichaResponse;
  valores: Record<string, string>;
  patrimonioId: string;
}) {
  const possuiFiltros = Boolean(
    valores.evento || valores.busca || valores.dataInicial || valores.dataFinal,
  );
  const hrefPagina = (pagina: number) =>
    `/patrimonios/${patrimonioId}?${new URLSearchParams({ ...valores, aba: "historico", pagina: String(pagina) }).toString()}`;
  return (
    <section className={cartao} aria-labelledby="historico-title">
      <h2 id="historico-title" className="text-lg font-bold">
        Histórico de operações
      </h2>
      <form className="mt-4 grid gap-3 md:grid-cols-4">
        <input type="hidden" name="aba" value="historico" />
        <label className="text-xs">
          Tipo
          <select
            className={campo}
            name="evento"
            defaultValue={valores.evento ?? ""}
          >
            <option value="">Todos os eventos</option>
            {Object.entries(rotulosEvento).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs md:col-span-2">
          Pesquisar
          <input
            className={campo}
            name="busca"
            maxLength={200}
            defaultValue={valores.busca}
            placeholder="Descrição, autor, comissão ou valor"
          />
        </label>
        <button className={`${botao} self-end`} type="submit">
          <Search className="size-4" /> Filtrar
        </button>
        <label className="text-xs">
          Data inicial
          <input
            className={campo}
            type="date"
            name="dataInicial"
            defaultValue={valores.dataInicial}
          />
        </label>
        <label className="text-xs">
          Data final
          <input
            className={campo}
            type="date"
            name="dataFinal"
            defaultValue={valores.dataFinal}
          />
        </label>
      </form>
      {resposta.dados.length === 0 ? (
        <div
          role="status"
          className="mt-5 rounded-md border border-[#dfe7f1] bg-[#f7f9fc] p-8 text-center"
        >
          <p className="font-semibold text-[#203b61]">
            {possuiFiltros
              ? "Nenhum evento encontrado"
              : "Histórico ainda sem registros"}
          </p>
          <p className="mt-2 text-sm text-[#7188a5]">
            {possuiFiltros
              ? "Não existem eventos que correspondam aos filtros informados."
              : "Este bem ainda não possui movimentações ou outras operações registradas no histórico."}
          </p>
        </div>
      ) : (
        <ol className="mt-5 grid gap-3">
          {resposta.dados.map((evento) => {
            const item = apresentarEvento(evento);
            return (
              <li
                className="rounded-md border border-[#e4ebf4] p-4"
                key={`${evento.tipo}-${evento.fonteId}`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{item.titulo}</strong>
                  <time className="text-sm text-[#7188a5]">
                    {formatarData(evento.ocorrencia)}
                  </time>
                </div>
                <p className="mt-2 text-sm">{item.descricao}</p>
                <p className="mt-1 text-sm text-[#7188a5]">
                  {item.detalhe}
                  {evento.comissao ? ` Comissão: ${evento.comissao}.` : ""}
                  {evento.autor ? ` Autor: ${evento.autor}.` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
      <nav
        className="mt-5 flex gap-5 text-sm"
        aria-label="Paginação do histórico"
      >
        {resposta.meta.pagina > 1 ? (
          <Link
            className="underline"
            href={hrefPagina(resposta.meta.pagina - 1)}
          >
            Página anterior
          </Link>
        ) : null}
        {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
          <Link
            className="underline"
            href={hrefPagina(resposta.meta.pagina + 1)}
          >
            Próxima página
          </Link>
        ) : null}
      </nav>
    </section>
  );
}

export function PatrimonioDetalheView({
  patrimonio,
  eventos,
  erroEventos,
  valores,
  diretor,
  usuarioId,
}: {
  patrimonio: PatrimonioDetalhe;
  eventos: EventosFichaResponse | null;
  erroEventos: string | null;
  valores: Record<string, string>;
  diretor: boolean;
  usuarioId: string;
}) {
  const liquido =
    Number(patrimonio.situacaoContabil.valorBrutoAtual) -
    Number(patrimonio.situacaoContabil.depreciacaoAcumuladaAtual);
  const historico = valores.aba === "historico";
  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{patrimonio.descricao}</h1>
            <span className="rounded-full bg-[#e9fbf3] px-3 py-1 text-xs font-semibold text-[#08795c]">
              {patrimonio.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#7188a5]">
            Patrimônio {patrimonio.numeroPatrimonio} ·{" "}
            {patrimonio.tipoNumeroPatrimonial === "OFICIAL"
              ? "Numeração oficial"
              : "Sem número oficial"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={botao} href="/patrimonios">
            <Search className="size-4" /> Nova pesquisa
          </Link>
          <Link
            className={botao}
            href={`/relatorios?tipo=ficha-bem&patrimonioId=${patrimonio.id}&consultar=1`}
          >
            <FileText className="size-4" /> Relatório do bem
          </Link>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            titulo: "Valor de incorporação",
            valor: moeda(patrimonio.valorIncorporacao),
            Icone: Wallet,
          },
          {
            titulo: "Valor atual",
            valor: moeda(liquido.toFixed(7)),
            Icone: TrendingUp,
          },
          {
            titulo: "Depreciação acumulada",
            valor: moeda(patrimonio.situacaoContabil.depreciacaoAcumuladaAtual),
            Icone: TrendingDown,
          },
        ].map(({ titulo, valor, Icone }) => (
          <section className={`${cartao} flex items-center gap-3`} key={titulo}>
            <Icone className="size-5 text-[#2863ec]" />
            <div>
              <p className="text-xs uppercase text-[#7188a5]">{titulo}</p>
              <p className="text-xl font-bold text-[#203b61]">{valor}</p>
            </div>
          </section>
        ))}
      </div>
      {diretor ? (
        <PatrimonioAcoes patrimonio={patrimonio} usuarioId={usuarioId} />
      ) : null}
      <nav
        className="flex gap-2 rounded-lg border border-[#dce5f0] bg-white px-3"
        aria-label="Seções do patrimônio"
      >
        <Link
          className={`min-h-11 border-b-2 px-4 py-3 text-sm ${!historico ? "border-[#2863ec] font-bold text-[#2863ec]" : "border-transparent"}`}
          href={`/patrimonios/${patrimonio.id}`}
        >
          Dados do bem
        </Link>
        <Link
          className={`min-h-11 border-b-2 px-4 py-3 text-sm ${historico ? "border-[#2863ec] font-bold text-[#2863ec]" : "border-transparent"}`}
          href={`/patrimonios/${patrimonio.id}?aba=historico`}
        >
          Histórico do bem
        </Link>
      </nav>
      {historico ? (
        eventos ? (
          <Historico
            resposta={eventos}
            valores={valores}
            patrimonioId={patrimonio.id}
          />
        ) : (
          <section className={cartao} aria-labelledby="historico-error-title">
            <h2 id="historico-error-title" className="text-lg font-bold">
              Não foi possível carregar o histórico
            </h2>
            <p role="alert" className="mt-4 text-sm text-red-800">
              {erroEventos ??
                "Não foi possível consultar o histórico deste patrimônio."}
            </p>
            <p className="mt-2 text-sm text-[#7188a5]">
              Houve uma falha durante a consulta. Isso não significa que o bem
              não possua eventos registrados.
            </p>
            <Link
              className={`${botao} mt-4`}
              href={`/patrimonios/${patrimonio.id}?aba=historico`}
            >
              Tentar novamente
            </Link>
          </section>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className={`${cartao} lg:col-span-2`}>
            <h2 className="mb-4 flex items-center gap-2 font-bold">
              <Box className="size-4 text-[#2863ec]" /> Identificação e
              classificação
            </h2>
            <dl className="grid gap-5 sm:grid-cols-3">
              <Dado titulo="Marca" valor={patrimonio.marca} />
              <Dado titulo="Modelo" valor={patrimonio.modelo} />
              <Dado titulo="Número de série" valor={patrimonio.numeroSerie} />
              <div className="sm:col-span-3">
                <Dado titulo="Descrição" valor={patrimonio.descricao} />
              </div>
              <Dado titulo="Espécie" valor={patrimonio.especie.nome} />
              <Dado
                titulo="Natureza"
                valor={patrimonio.especie.natureza.nome}
              />
            </dl>
          </section>
          <section className={cartao}>
            <h2 className="mb-4 font-bold">Localização e responsabilidade</h2>
            <dl className="grid gap-5">
              <Dado titulo="Setor atual" valor={patrimonio.setorAtual.nome} />
              <Dado
                titulo="Responsável do setor"
                valor={patrimonio.setorAtual.responsavel.nome}
              />
            </dl>
          </section>
          <section className={cartao}>
            <h2 className="mb-4 font-bold">Aquisição e tombamento</h2>
            <dl className="grid gap-5">
              <Dado
                titulo="Tipo de incorporação"
                valor={patrimonio.tipoIncorporacao}
              />
              <Dado
                titulo="Data do tombamento"
                valor={formatarData(patrimonio.dataTombamento)}
              />
              <Dado
                titulo="Processo de compra"
                valor={
                  patrimonio.processoCompra
                    ? [
                        patrimonio.processoCompra.numeroProcesso,
                        patrimonio.processoCompra.anoProcesso,
                      ]
                        .filter(Boolean)
                        .join("/")
                    : null
                }
              />
            </dl>
          </section>
          <section className={cartao}>
            <h2 className="mb-4 font-bold">Parâmetros de depreciação</h2>
            {patrimonio.parametroDepreciacaoAtual ? (
              <dl className="grid grid-cols-2 gap-5">
                <Dado
                  titulo="Método"
                  valor={patrimonio.parametroDepreciacaoAtual.metodo}
                />
                <Dado
                  titulo="Vida útil inicial"
                  valor={`${patrimonio.parametroDepreciacaoAtual.vidaUtilInicialMeses} meses`}
                />
                <Dado
                  titulo="Valor residual"
                  valor={moeda(
                    patrimonio.parametroDepreciacaoAtual.valorResidual,
                  )}
                />
                <Dado
                  titulo="Início"
                  valor={formatarData(
                    patrimonio.parametroDepreciacaoAtual.dataInicio,
                  )}
                />
              </dl>
            ) : (
              <p className="text-sm text-[#7188a5]">Não informado</p>
            )}
          </section>
        </div>
      )}
      <footer className="flex flex-wrap justify-between gap-2 py-3 text-xs text-[#7188a5]">
        <span>
          Cadastrado por {patrimonio.cadastradoPor.nome} ·{" "}
          {formatarData(patrimonio.createdAt)}
        </span>
        <span>Histórico preservado em cada operação</span>
      </footer>
    </main>
  );
}
