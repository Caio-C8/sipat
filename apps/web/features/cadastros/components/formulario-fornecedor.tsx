"use client";

import type { FornecedorDetalhe } from "@repo/contracts";
import { FormularioCadastro } from "./formulario-cadastro";
import { SituacaoCadastro } from "./formularios-basicos";
import { Campo, campo, cartao, opcional, texto } from "./cadastro-ui";
import {
  useAlterarFornecedor,
  useAlterarSituacaoFornecedor,
  useCriarFornecedor,
} from "../api/hooks";

const formatarCnpj = (valor: string | null | undefined) => {
  if (!valor || valor.length !== 14) return valor ?? "";
  return `${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5, 8)}/${valor.slice(8, 12)}-${valor.slice(12)}`;
};

const formatarData = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(valor))
    : "Sem alteração registrada";

export function FormularioFornecedor({
  registro,
}: {
  registro?: FornecedorDetalhe;
}) {
  const criar = useCriarFornecedor();
  const alterar = useAlterarFornecedor();
  const situacao = useAlterarSituacaoFornecedor();

  return (
    <div className="grid gap-4">
      <FormularioCadastro
        titulo={registro ? "Editar fornecedor" : "Novo fornecedor"}
        destino="/cadastros/fornecedores"
        idempotente={!registro}
        rotulo="Salvar fornecedor"
        salvar={async (dados, chave) => {
          const nomeFantasia = opcional(dados, "nomeFantasia");
          const nomeRepresentante = opcional(dados, "nomeRepresentante");
          const cnpj = opcional(dados, "cnpj");
          const email = opcional(dados, "email");
          const telefone = opcional(dados, "telefone");
          const endereco = opcional(dados, "endereco");
          const resposta = registro
            ? await alterar.confirmar({
                id: registro.id,
                body: {
                  razaoSocial: texto(dados, "razaoSocial"),
                  nomeFantasia: nomeFantasia ?? null,
                  nomeRepresentante: nomeRepresentante ?? null,
                  cnpj: cnpj ?? null,
                  email: email ?? null,
                  telefone: telefone ?? null,
                  endereco: endereco ?? null,
                },
              })
            : await criar.confirmar({
                chaveIdempotencia: chave,
                razaoSocial: texto(dados, "razaoSocial"),
                ...(nomeFantasia ? { nomeFantasia } : {}),
                ...(nomeRepresentante ? { nomeRepresentante } : {}),
                ...(cnpj ? { cnpj } : {}),
                ...(email ? { email } : {}),
                ...(telefone ? { telefone } : {}),
                ...(endereco ? { endereco } : {}),
              });
          return resposta?.dados ?? null;
        }}
      >
        <Campo
          rotulo="Razão social"
          name="razaoSocial"
          required
          maxLength={150}
          defaultValue={registro?.razaoSocial}
          autoComplete="organization"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Nome fantasia"
            name="nomeFantasia"
            maxLength={150}
            defaultValue={registro?.nomeFantasia ?? ""}
          />
          <Campo
            rotulo="Representante"
            name="nomeRepresentante"
            maxLength={150}
            defaultValue={registro?.nomeRepresentante ?? ""}
            autoComplete="name"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="CNPJ"
            name="cnpj"
            maxLength={18}
            defaultValue={formatarCnpj(registro?.cnpj)}
            autoCapitalize="characters"
            spellCheck={false}
          />
          <Campo
            rotulo="E-mail"
            name="email"
            type="email"
            maxLength={150}
            defaultValue={registro?.email ?? ""}
            autoComplete="email"
          />
        </div>
        <Campo
          rotulo="Telefone"
          name="telefone"
          type="tel"
          maxLength={30}
          defaultValue={registro?.telefone ?? ""}
          autoComplete="tel"
        />
        <label className="block min-w-0 text-sm text-[#29456d]">
          Endereço
          <textarea
            name="endereco"
            maxLength={500}
            defaultValue={registro?.endereco ?? ""}
            autoComplete="street-address"
            className={campo + " min-h-24"}
          />
        </label>
      </FormularioCadastro>

      {registro && (
        <>
          <section className={cartao} aria-labelledby="dados-fornecedor">
            <h2 id="dados-fornecedor" className="font-bold">
              Dados do cadastro
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#62748e]">Situação</dt>
                <dd className="font-semibold">
                  {registro.ativo ? "Ativo" : "Inativo"}
                </dd>
              </div>
              <div>
                <dt className="text-[#62748e]">Criado em</dt>
                <dd>{formatarData(registro.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[#62748e]">Última atualização</dt>
                <dd>{formatarData(registro.updatedAt)}</dd>
              </div>
            </dl>
          </section>
          <SituacaoCadastro
            ativo={registro.ativo}
            pending={situacao.pending}
            alterar={() =>
              situacao.confirmar({ id: registro.id, ativo: !registro.ativo })
            }
          />
        </>
      )}
    </div>
  );
}
