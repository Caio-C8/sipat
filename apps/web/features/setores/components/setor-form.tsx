"use client";

import type { SetorDetalhe } from "@repo/contracts";
import { useState } from "react";
import {
  useAlterarSetor,
  useAlterarSituacaoSetor,
  useCriarSetor,
} from "@/features/cadastros/api/hooks";
import {
  Campo,
  opcional,
  texto,
} from "@/features/cadastros/components/cadastro-ui";
import {
  FormularioCadastro,
  type ContextoFormularioCadastro,
} from "@/features/cadastros/components/formulario-cadastro";
import { SeletorResponsavel } from "@/features/cadastros/components/seletor-cadastro";
import { SituacaoCadastro } from "@/features/cadastros/components/situacao-cadastro";

export function FormularioSetor({
  registro,
  contexto = "legado",
  onCancelar,
  onSucesso,
}: {
  registro?: SetorDetalhe;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const [versao, setVersao] = useState(0);
  const criar = useCriarSetor();
  const alterar = useAlterarSetor();
  const situacao = useAlterarSituacaoSetor();
  const destino = registro ? `/setores/${registro.id}` : "/setores";
  return (
    <div className="grid gap-4">
      <FormularioCadastro
        key={versao}
        titulo={registro ? "Editar setor" : "Novo setor"}
        destino={destino}
        rotaDetalhe={!registro}
        destinoSucesso={(id) =>
          registro
            ? `/setores/${encodeURIComponent(id)}?salvo=1`
            : "/setores?salvo=1"
        }
        mensagemSucesso="Setor salvo com sucesso."
        contexto={contexto}
        onCancelar={onCancelar}
        onRestaurar={() => setVersao((atual) => atual + 1)}
        onSucesso={onSucesso}
        navegarAposSucesso={contexto !== "modal"}
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
                  rotulo: `${registro.responsavel.nome} · ${registro.responsavel.matricula}${registro.responsavel.ativo ? "" : " (inativo)"}`,
                }
              : undefined
          }
        />
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
