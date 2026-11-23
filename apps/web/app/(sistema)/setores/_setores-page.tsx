import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as z from "zod";
import { AccessDenied } from "@/components/shared/access-denied";
import { DetalheSetor } from "@/features/setores/components/setor-detail";
import { ListaSetores } from "@/features/setores/components/setor-list";
import { CadastroFormPage } from "@/features/cadastros/components/cadastro-form-page";
import { SetorRouteModal } from "@/features/setores/components/setor-route-modal";
import { FormularioSetor } from "@/features/setores/components/setor-form";
import { serverCadastros } from "@/features/cadastros/api/server";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import {
  ErroCadastro,
  mensagemErro,
  pagina,
  cartao,
  Paginacao,
} from "@/features/cadastros/components/cadastro-ui";
import type { SearchCadastros } from "@/app/(sistema)/_cadastros/_cadastros-page";
import { PageHeader } from "@/components/shared/page-header";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";
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
  const identidade = await exigirIdentidadeAtual();
  const parsed = QuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <main className={pagina}>
        <PageHeader
          title="Consulta inválida"
          description="Revise os filtros dos setores."
        />
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
        <PageHeader
          title="Setores"
          description="Consulte os setores cadastrados."
        />
        <ErroCadastro mensagem={mensagemErro(e)} />
        <Link href="/setores" className="underline">
          Tentar novamente
        </Link>
      </main>
    );
  }
  return (
    <ListaSetores
      registros={resposta.dados}
      meta={resposta.meta}
      busca={q.busca}
      ativo={q.ativo}
      admin={identidade.perfil === "ADMINISTRADOR"}
    />
  );
}
export async function NovoSetorPage({ modal = false }: { modal?: boolean }) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR")
    return (
      <AccessDenied description="Somente o Administrador pode cadastrar setores." />
    );
  if (modal) return <SetorRouteModal />;
  return (
    <CadastroFormPage
      title="Cadastrar setor"
      description="Informe o nome, a localização e o responsável pelo setor."
      listHref={administrativeRoutes.setores.list}
    >
      <FormularioSetor contexto="pagina-criacao" />
    </CadastroFormPage>
  );
}

export async function EditarSetorPage({
  params,
  modal = false,
}: {
  params: Promise<{ setorId: string }>;
  modal?: boolean;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR")
    return (
      <AccessDenied description="Somente o Administrador pode editar setores." />
    );
  const { setorId } = await params;
  if (!z.uuid().safeParse(setorId).success) notFound();
  let setor;
  try {
    setor = (
      await serverCadastros.setores.consultar(setorId, {
        cookie: (await headers()).get("cookie") ?? "",
      })
    ).dados;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
  if (modal) return <SetorRouteModal registro={setor} />;
  return (
    <CadastroFormPage
      title="Editar setor"
      description="Atualize os dados e a situação do setor."
      listHref={administrativeRoutes.setores.list}
    >
      <FormularioSetor registro={setor} contexto="pagina-edicao" />
    </CadastroFormPage>
  );
}
export async function SetorPage({
  params,
  searchParams,
}: {
  params: Promise<{ setorId: string }>;
  searchParams: SearchCadastros;
}) {
  const identidade = await exigirIdentidadeAtual();
  const { setorId } = await params;
  if (!z.uuid().safeParse(setorId).success) notFound();
  const parsed = QuerySchema.safeParse(await searchParams);
  if (!parsed.success)
    return (
      <main className={pagina}>
        <PageHeader
          title="Consulta inválida"
          description="Revise a página dos bens vinculados."
        />
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
        <PageHeader
          title="Consultar setor"
          description="Consulte os dados e os bens vinculados ao setor."
        />
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
    <DetalheSetor setor={setor} admin={identidade.perfil === "ADMINISTRADOR"}>
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
          href={(p) => "/setores/" + setorId + "?paginaBens=" + p}
        />
      </section>
    </DetalheSetor>
  );
}
