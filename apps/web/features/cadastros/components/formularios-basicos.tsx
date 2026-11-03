"use client";
import { FormularioCadastro } from "./formulario-cadastro";
import type {
  NaturezaDetalhe,
  EspecieDetalhe,
  ResponsavelDetalhe,
  SetorDetalhe,
} from "@repo/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useCriarNatureza,
  useAlterarNatureza,
  useCriarEspecie,
  useAlterarEspecie,
  useCriarResponsavel,
  useAlterarResponsavel,
  useAlterarSituacaoResponsavel,
  useCriarSetor,
  useAlterarSetor,
  useAlterarSituacaoSetor,
} from "../api/hooks";
import {
  Campo,
  Descricao,
  texto,
  opcional,
  botao,
  mensagemErro,
} from "./cadastro-ui";
import { SeletorNatureza, SeletorResponsavel } from "./seletor-cadastro";

export function FormularioNatureza({
  registro,
}: {
  registro?: NaturezaDetalhe;
}) {
  const criar = useCriarNatureza();
  const alterar = useAlterarNatureza();
  return (
    <FormularioCadastro
      titulo={registro ? "Editar natureza" : "Nova natureza"}
      destino="/cadastros/naturezas"
      rotulo="Salvar natureza"
      salvar={async (dados) => {
        const body = {
          nome: texto(dados, "nome"),
          descricao: registro
            ? (opcional(dados, "descricao") ?? null)
            : opcional(dados, "descricao"),
        };
        const resposta = registro
          ? await alterar.confirmar({ id: registro.id, body })
          : await criar.confirmar({
              nome: body.nome,
              descricao: body.descricao ?? undefined,
            });
        return resposta?.dados ?? null;
      }}
    >
      <Campo
        rotulo="Nome da natureza"
        name="nome"
        required
        maxLength={100}
        defaultValue={registro?.nome}
      />
      <Descricao valor={registro?.descricao} />
    </FormularioCadastro>
  );
}
export function FormularioEspecie({ registro }: { registro?: EspecieDetalhe }) {
  const criar = useCriarEspecie();
  const alterar = useAlterarEspecie();
  return (
    <FormularioCadastro
      titulo={registro ? "Editar espécie" : "Nova espécie"}
      destino="/cadastros/especies"
      rotulo="Salvar espécie"
      salvar={async (dados) => {
        const body = {
          nome: texto(dados, "nome"),
          naturezaId: texto(dados, "naturezaId"),
          descricao: registro
            ? (opcional(dados, "descricao") ?? null)
            : opcional(dados, "descricao"),
        };
        const resposta = registro
          ? await alterar.confirmar({ id: registro.id, body })
          : await criar.confirmar({
              ...body,
              descricao: body.descricao ?? undefined,
            });
        return resposta?.dados ?? null;
      }}
    >
      <Campo
        rotulo="Nome da espécie"
        name="nome"
        required
        maxLength={100}
        defaultValue={registro?.nome}
      />
      <SeletorNatureza
        name="naturezaId"
        rotulo="Natureza vinculada"
        inicial={
          registro
            ? { id: registro.natureza.id, rotulo: registro.natureza.nome }
            : undefined
        }
      />
      <Descricao valor={registro?.descricao} />
    </FormularioCadastro>
  );
}
function SituacaoCadastro({
  ativo,
  pending,
  alterar,
}: {
  ativo: boolean;
  pending: boolean;
  alterar: () => Promise<unknown>;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="grid gap-3 rounded-md border border-[#dfe7f1] p-4 text-sm">
      <p>
        Situação atual: <strong>{ativo ? "Ativo" : "Inativo"}</strong>
      </p>
      {erro && (
        <p role="alert" className="text-red-800">
          {erro}
        </p>
      )}
      {confirmar ? (
        <>
          <p>
            Confirmar {ativo ? "inativação" : "ativação"}? Os vínculos
            existentes serão preservados.
          </p>
          <div className="flex gap-3">
            <button
              className={botao}
              type="button"
              disabled={pending}
              onClick={async () => {
                setErro(null);
                try {
                  const resultado = await alterar();
                  if (resultado === null) return;
                  setConfirmar(false);
                  router.refresh();
                } catch (e) {
                  setErro(mensagemErro(e));
                }
              }}
            >
              {pending ? "Atualizando…" : "Confirmar situação"}
            </button>
            <button
              className={botao}
              type="button"
              disabled={pending}
              onClick={() => setConfirmar(false)}
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <button
          className={botao}
          type="button"
          onClick={() => setConfirmar(true)}
        >
          {ativo ? "Inativar" : "Ativar"} cadastro
        </button>
      )}
    </div>
  );
}
export function FormularioResponsavel({
  registro,
}: {
  registro?: ResponsavelDetalhe;
}) {
  const criar = useCriarResponsavel();
  const alterar = useAlterarResponsavel();
  const situacao = useAlterarSituacaoResponsavel();
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        titulo={registro ? "Editar responsável" : "Novo responsável"}
        destino="/cadastros/responsaveis"
        rotulo="Salvar responsável"
        salvar={async (dados) => {
          const body = {
            nome: texto(dados, "nome"),
            matricula: texto(dados, "matricula"),
          };
          const resposta = registro
            ? await alterar.confirmar({ id: registro.id, body })
            : await criar.confirmar(body);
          return resposta?.dados ?? null;
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
          <Campo
            rotulo="Matrícula"
            name="matricula"
            required
            maxLength={20}
            defaultValue={registro?.matricula}
          />
          <Campo
            rotulo="Nome completo"
            name="nome"
            required
            maxLength={100}
            defaultValue={registro?.nome}
          />
        </div>
        <p className="rounded-md bg-[#eef5ff] p-4 text-sm">
          Este cadastro disponibiliza o funcionário para assumir a
          responsabilidade pelos bens e participar das comissões.
        </p>
      </FormularioCadastro>
      {registro && (
        <SituacaoCadastro
          ativo={registro.ativo}
          pending={situacao.pending}
          alterar={() =>
            situacao.confirmar({ id: registro.id, ativo: !registro.ativo })
          }
        />
      )}
    </div>
  );
}
export function FormularioSetor({ registro }: { registro?: SetorDetalhe }) {
  const criar = useCriarSetor();
  const alterar = useAlterarSetor();
  const situacao = useAlterarSituacaoSetor();
  const destino = registro
    ? "/cadastros/setores/" + registro.id
    : "/cadastros/setores";
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        titulo={registro ? "Editar setor" : "Novo setor"}
        destino={destino}
        rotaDetalhe={!registro}
        idempotente={!registro}
        rotulo="Salvar setor"
        salvar={async (dados, chave) => {
          const body = {
            nome: texto(dados, "nome"),
            sala: opcional(dados, "sala"),
            ramal: opcional(dados, "ramal"),
            responsavelId: texto(dados, "responsavelId"),
          };
          const resposta = registro
            ? await alterar.confirmar({
                id: registro.id,
                body: {
                  ...body,
                  sala: body.sala ?? null,
                  ramal: body.ramal ?? null,
                },
              })
            : await criar.confirmar({ ...body, chaveIdempotencia: chave });
          return resposta?.dados ?? null;
        }}
      >
        <Campo
          rotulo="Nome do setor"
          name="nome"
          required
          maxLength={100}
          defaultValue={registro?.nome}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Sala"
            name="sala"
            maxLength={50}
            defaultValue={registro?.sala ?? ""}
          />
          <Campo
            rotulo="Ramal"
            name="ramal"
            maxLength={10}
            defaultValue={registro?.ramal ?? ""}
          />
        </div>
        <SeletorResponsavel
          name="responsavelId"
          rotulo="Responsável"
          inicial={
            registro
              ? {
                  id: registro.responsavel.id,
                  rotulo:
                    registro.responsavel.nome +
                    " · " +
                    registro.responsavel.matricula +
                    (registro.responsavel.ativo ? "" : " (inativo)"),
                }
              : undefined
          }
        />
      </FormularioCadastro>
      {registro && (
        <SituacaoCadastro
          ativo={registro.ativo}
          pending={situacao.pending}
          alterar={() =>
            situacao.confirmar({ id: registro.id, ativo: !registro.ativo })
          }
        />
      )}
    </div>
  );
}
