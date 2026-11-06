import Link from "next/link";
import type { ListarSetoresResponse, SetorDetalhe } from "@repo/contracts";
import { AbasCadastros } from "./abas-cadastros";
import {
  pagina,
  cartao,
  campo,
  botao,
  principal,
  Paginacao,
} from "./cadastro-ui";
import { FormularioSetor } from "./formularios-basicos";
export function ListaSetores({
  resposta,
  busca,
  ativo,
  admin,
}: {
  resposta: ListarSetoresResponse;
  busca?: string;
  ativo?: string;
  admin: boolean;
}) {
  const hrefPagina = (p: number) =>
    "/cadastros/setores?" +
    new URLSearchParams({
      pagina: String(p),
      ...(busca ? { busca } : {}),
      ...(ativo ? { ativo } : {}),
    }).toString();
  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold min-[1500px]:text-[27px]">
            Setores
          </h1>
          <p className="mt-1 text-sm text-[#62748e]">
            Consulte os setores, seus responsáveis, salas e bens vinculados.
          </p>
        </div>
        {admin && (
          <Link className={principal} href="/cadastros/setores/novo">
            Cadastrar setor
          </Link>
        )}
      </header>
      <AbasCadastros secao="setores" />
      <form
        action="/cadastros/setores"
        className={
          cartao +
          " grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"
        }
      >
        <label className="text-sm">
          Nome do setor
          <input
            name="busca"
            className={campo}
            maxLength={100}
            defaultValue={busca}
            placeholder="Buscar setor…"
          />
        </label>
        <label className="text-sm">
          Situação
          <select name="ativo" className={campo} defaultValue={ativo ?? ""}>
            <option value="">Todos os setores</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </label>
        <button type="submit" className={botao}>
          Consultar
        </button>
      </form>
      <section className={cartao}>
        <h2 className="mb-4 font-bold">Setores cadastrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <caption className="sr-only">
              Setores cadastrados e seus responsáveis
            </caption>
            <thead className="bg-[#f1f5f9] text-xs text-[#62748e]">
              <tr>
                {[
                  "Setor",
                  "Responsável",
                  "Sala",
                  "Ramal",
                  "Situação",
                  "Ação",
                ].map((t) => (
                  <th key={t} scope="col" className="p-3">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resposta.dados.map((s) => (
                <tr className="border-b border-[#dfe7f1]" key={s.id}>
                  <td className="p-3 font-semibold">{s.nome}</td>
                  <td className="p-3">{s.responsavel.nome}</td>
                  <td className="p-3">{s.sala ?? "Não informada"}</td>
                  <td className="p-3">{s.ramal ?? "Não informado"}</td>
                  <td className="p-3">{s.ativo ? "Ativo" : "Inativo"}</td>
                  <td className="p-3">
                    <Link
                      className={botao}
                      href={"/cadastros/setores/" + s.id}
                      aria-label={"Consultar " + s.nome}
                    >
                      Consultar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resposta.dados.length === 0 && (
          <p className="py-6 text-sm">Nenhum setor encontrado.</p>
        )}
        <Paginacao meta={resposta.meta} href={hrefPagina} />
      </section>
    </main>
  );
}
export function NovoSetor() {
  return (
    <main className={pagina}>
      <h1 className="text-xl font-bold">Cadastrar setor</h1>
      <AbasCadastros secao="setores" />
      <FormularioSetor />
    </main>
  );
}
export function DetalheSetor({
  setor,
  admin,
  children,
  salvo,
}: {
  setor: SetorDetalhe;
  admin: boolean;
  children: React.ReactNode;
  salvo?: boolean;
}) {
  return (
    <main className={pagina}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Consultar setor · {setor.nome}</h1>
          <p className="mt-1 text-sm">
            {setor.ativo ? "Ativo" : "Inativo"} · Responsável:{" "}
            {setor.responsavel.nome}
          </p>
        </div>
        <Link className={botao} href="/cadastros/setores">
          Voltar aos setores
        </Link>
      </header>
      <AbasCadastros secao="setores" />
      {salvo && (
        <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm">
          Setor salvo com sucesso.
        </p>
      )}
      {admin ? (
        <FormularioSetor key={JSON.stringify(setor)} registro={setor} />
      ) : (
        <section className={cartao}>
          <h2 className="font-bold">Dados do setor</h2>
          <p className="mt-3">
            Sala: {setor.sala ?? "Não informada"} · Ramal:{" "}
            {setor.ramal ?? "Não informado"}
          </p>
        </section>
      )}
      {children}
    </main>
  );
}
