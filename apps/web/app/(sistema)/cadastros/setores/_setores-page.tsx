import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as z from "zod";
import {
  ListaSetores,
  DetalheSetor,
  NovoSetor,
} from "@/features/cadastros/components/setores-telas";
import { serverCadastros } from "@/features/cadastros/api/server";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import {
  ErroCadastro,
  mensagemErro,
  pagina,
  cartao,
  Paginacao,
} from "@/features/cadastros/components/cadastro-ui";
import type { SearchCadastros } from "../_cadastros-page";
const QuerySchema = z.object({
  busca: z.string().trim().max(100).optional(),
  ativo: z.enum(["", "true", "false"]).optional(),
  pagina: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional(),
  paginaBens: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional(),
  salvo: z.literal("1").optional(),
});
export async function SetoresPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const parsed = QuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <main className={pagina}>
        <h1>Consulta inválida</h1>
        <p role="alert">Revise os filtros dos setores.</p>
      </main>
    );
  const q = parsed.data;
  let resposta;
  try {
    const cookie = (await headers()).get("cookie") ?? "";
    resposta = await serverCadastros.setores.listar(
      {
        busca: q.busca || undefined,
        ativo: q.ativo || undefined,
        pagina: q.pagina,
        limite: "20",
      },
      { cookie },
    );
  } catch (e) {
    return (
      <main className={pagina}>
        <h1>Setores</h1>
        <ErroCadastro mensagem={mensagemErro(e)} />
        <Link href="/cadastros/setores" className="underline">
          Tentar novamente
        </Link>
      </main>
    );
  }
  return (
    <ListaSetores
      resposta={resposta}
      busca={q.busca}
      ativo={q.ativo}
      admin={identidade.perfil === "ADMINISTRADOR"}
    />
  );
}
export async function NovoSetorPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (identidade.perfil !== "ADMINISTRADOR")
    return (
      <main className={pagina}>
        <h1>Acesso não permitido</h1>
        <p role="alert">Somente o Administrador pode cadastrar setores.</p>
      </main>
    );
  return <NovoSetor />;
}
export async function SetorPage({
  params,
  searchParams,
}: {
  params: Promise<{ setorId: string }>;
  searchParams: SearchCadastros;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const { setorId } = await params;
  if (!z.uuid().safeParse(setorId).success) notFound();
  const parsed = QuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <main className={pagina}>
        <h1>Consulta inválida</h1>
        <p role="alert">Revise a página dos bens vinculados.</p>
      </main>
    );
  const cookie = (await headers()).get("cookie") ?? "";
  let setor;
  try {
    setor = (await serverCadastros.setores.consultar(setorId, { cookie }))
      .dados;
  } catch (e) {
    if (isApiError(e) && e.status === 404) notFound();
    return (
      <main className={pagina}>
        <h1>Consultar setor</h1>
        <ErroCadastro mensagem={mensagemErro(e)} />
      </main>
    );
  }
  let bens;
  try {
    bens = await serverPatrimonioOperations.listar(
      { setorId, pagina: parsed.data.paginaBens, limite: "10" },
      { cookie },
    );
  } catch (e) {
    return (
      <DetalheSetor setor={setor} admin={identidade.perfil === "ADMINISTRADOR"}>
        <ErroCadastro
          mensagem={"Falha ao consultar os bens vinculados. " + mensagemErro(e)}
        />
      </DetalheSetor>
    );
  }
  return (
    <DetalheSetor
      setor={setor}
      admin={identidade.perfil === "ADMINISTRADOR"}
      salvo={parsed.data.salvo === "1"}
    >
      <section className={cartao}>
        <h2 className="mb-3 font-bold">Bens vinculados ao setor</h2>
        {bens.dados.length === 0 ? (
          <p className="text-sm">Nenhum patrimônio vinculado.</p>
        ) : (
          <ul className="divide-y divide-[#dfe7f1]">
            {bens.dados.map((b) => (
              <li className="py-3 text-sm" key={b.id}>
                <Link className="underline" href={"/patrimonios/" + b.id}>
                  {b.numeroPatrimonio} · {b.descricao}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Paginacao
          meta={bens.meta}
          href={(p) => "/cadastros/setores/" + setorId + "?paginaBens=" + p}
        />
      </section>
    </DetalheSetor>
  );
}
