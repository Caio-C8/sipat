"use client";

import type { EspecieDetalhe } from "@repo/contracts";
import {
  useAlterarEspecie,
  useCriarEspecie,
} from "@/features/cadastros/api/hooks";
import {
  Campo,
  Descricao,
  opcional,
  texto,
} from "@/features/cadastros/components/cadastro-ui";
import {
  FormularioCadastro,
  type ContextoFormularioCadastro,
} from "@/features/cadastros/components/formulario-cadastro";
import { SeletorNatureza } from "@/features/cadastros/components/seletor-cadastro";

export function FormularioEspecie({
  registro,
  contexto = "legado",
  onCancelar,
  onSucesso,
}: {
  registro?: EspecieDetalhe;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const criar = useCriarEspecie();
  const alterar = useAlterarEspecie();
  return (
    <FormularioCadastro
      titulo={registro ? "Editar espécie" : "Nova espécie"}
      destino="/especies"
      destinoSucesso={(id) => `/especies/${encodeURIComponent(id)}?salvo=1`}
      contexto={contexto}
      onCancelar={onCancelar}
      onSucesso={onSucesso}
      navegarAposSucesso={contexto !== "modal"}
      rotaDetalhe
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
