"use client";

import type { ResponsavelDetalhe } from "@repo/contracts";
import { useState } from "react";
import {
  useAlterarResponsavel,
  useAlterarSituacaoResponsavel,
  useCriarResponsavel,
} from "@/features/cadastros/api/hooks";
import { Campo, texto } from "@/features/cadastros/components/cadastro-ui";
import {
  FormularioCadastro,
  type ContextoFormularioCadastro,
} from "@/features/cadastros/components/formulario-cadastro";
import { SituacaoCadastro } from "@/features/cadastros/components/situacao-cadastro";

export function FormularioResponsavel({
  registro,
  contexto = "legado",
  onCancelar,
  onSucesso,
}: {
  registro?: ResponsavelDetalhe;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const [versao, setVersao] = useState(0);
  const criar = useCriarResponsavel();
  const alterar = useAlterarResponsavel();
  const situacao = useAlterarSituacaoResponsavel();
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        key={versao}
        titulo={registro ? "Editar responsável" : "Novo responsável"}
        destino="/responsaveis"
        destinoSucesso={(id) =>
          registro
            ? `/responsaveis/${encodeURIComponent(id)}?salvo=1`
            : "/responsaveis?salvo=1"
        }
        mensagemSucesso="Responsável salvo com sucesso."
        contexto={contexto}
        onCancelar={onCancelar}
        onRestaurar={() => setVersao((atual) => atual + 1)}
        onSucesso={onSucesso}
        navegarAposSucesso={contexto !== "modal"}
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
        <p className="rounded-md bg-accent p-4 text-sm">
          Este cadastro disponibiliza o funcionário para assumir a
          responsabilidade pelos bens e participar das comissões.
        </p>
      </FormularioCadastro>
      {registro ? (
        <SituacaoCadastro
          ativo={registro.ativo}
          pending={situacao.pending}
          alterar={() =>
            situacao.confirmar({ id: registro.id, ativo: !registro.ativo })
          }
        />
      ) : null}
    </div>
  );
}
