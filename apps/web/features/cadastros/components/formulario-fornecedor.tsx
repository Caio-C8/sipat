"use client";

import type { FornecedorDetalhe } from "@repo/contracts";
import { useId, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FormularioCadastro,
  type ContextoFormularioCadastro,
} from "./formulario-cadastro";
import { SituacaoCadastro } from "./formularios-basicos";
import { Campo, cartao, opcional, texto } from "./cadastro-ui";
import {
  useAlterarFornecedor,
  useAlterarSituacaoFornecedor,
  useCriarFornecedor,
} from "../api/hooks";
import { useCadastroFieldError } from "./cadastro-field-errors";

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

function EnderecoFornecedorField({ value }: { value?: string | null }) {
  const id = useId();
  const error = useCadastroFieldError("endereco");
  return (
    <div className="grid min-w-0 gap-1 text-sm text-[#29456d]">
      <label htmlFor={id}>Endereço</label>
      <Textarea
        id={id}
        name="endereco"
        maxLength={500}
        defaultValue={value ?? ""}
        autoComplete="street-address"
        className="mt-1 min-h-24"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormularioFornecedor({
  registro,
  contexto = "legado",
  onCancelar,
  onSucesso,
}: {
  registro?: FornecedorDetalhe;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onSucesso?: (id: string) => void;
}) {
  const [versao, setVersao] = useState(0);
  const criar = useCriarFornecedor();
  const alterar = useAlterarFornecedor();
  const situacao = useAlterarSituacaoFornecedor();

  return (
    <div className="grid gap-4">
      <FormularioCadastro
        key={versao}
        titulo={registro ? "Editar fornecedor" : "Novo fornecedor"}
        destino="/cadastros/fornecedores"
        destinoSucesso={(id) =>
          registro
            ? `/cadastros/fornecedores/${encodeURIComponent(id)}?salvo=1`
            : "/cadastros/fornecedores?salvo=1"
        }
        contexto={contexto}
        onCancelar={onCancelar}
        onRestaurar={() => setVersao((atual) => atual + 1)}
        onSucesso={onSucesso}
        navegarAposSucesso={contexto !== "modal"}
        mensagemSucesso="Fornecedor salvo com sucesso."
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
        <EnderecoFornecedorField value={registro?.endereco} />
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
