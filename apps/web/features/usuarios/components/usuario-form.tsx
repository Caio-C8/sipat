"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { UsuarioDetalhe } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { isApiError } from "@/lib/api/core/api-error";
import { criarOperacoesUsuarios } from "../api/usuario-operations";

const operacoes = criarOperacoesUsuarios(browserApiClient);
const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 text-sm text-[#17253d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2863ec]";
const perfilLabel = (perfil: string) =>
  perfil === "ADMINISTRADOR" ? "Administrador" : "Diretor de patrimônio";

function mensagem(erro: unknown) {
  if (isApiError(erro)) {
    if (erro.status === 401) return "Sua sessão expirou. Entre novamente.";
    if (erro.status === 403)
      return "Você não tem permissão para esta operação.";
    return erro.erros.length
      ? erro.erros.map((item) => `${item.campo}: ${item.mensagem}`).join(" ")
      : erro.message;
  }
  return "Não foi possível concluir a operação. Confira os dados e tente novamente.";
}

export function UsuarioForm({ usuario }: { usuario?: UsuarioDetalhe }) {
  const router = useRouter();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState(usuario?.perfil ?? "DIRETOR_PATRIMONIO");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      if (usuario) {
        await operacoes.alterar(usuario.id, { nome, email, perfil });
        router.push(`/usuarios/${usuario.id}`);
      } else {
        const resposta = await operacoes.criar({ nome, email, senha, perfil });
        router.push(`/usuarios/${resposta.dados.id}`);
      }
      router.refresh();
    } catch (falha) {
      setErro(mensagem(falha));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={salvar} className="grid gap-5">
      <section
        className="grid gap-5 rounded-lg border border-[#dfe7f1] bg-white p-5 sm:p-6"
        aria-labelledby="dados-heading"
      >
        <h2 id="dados-heading" className="text-lg font-bold text-[#17253d]">
          Dados de acesso
        </h2>
        <label className="text-sm font-medium text-[#425875]">
          Nome completo *
          <input
            className={campo}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            maxLength={100}
            autoComplete="name"
            required
          />
        </label>
        <label className="text-sm font-medium text-[#425875]">
          E-mail *
          <input
            className={campo}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={150}
            autoComplete="email"
            required
          />
        </label>
        {!usuario ? (
          <label className="text-sm font-medium text-[#425875]">
            Senha inicial *
            <input
              className={campo}
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="new-password"
              required
            />
            <span className="mt-1 block text-xs font-normal text-[#7188a5]">
              O usuário deverá redefinir esta senha no primeiro acesso.
            </span>
          </label>
        ) : null}
        <label className="text-sm font-medium text-[#425875]">
          Perfil de acesso *
          <select
            className={campo}
            value={perfil}
            onChange={(event) => setPerfil(event.target.value as typeof perfil)}
          >
            <option value="DIRETOR_PATRIMONIO">Diretor de patrimônio</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
        </label>
        {usuario ? (
          <p className="text-sm text-[#7188a5]">
            A situação atual é{" "}
            <strong>{usuario.ativo ? "Ativo" : "Inativo"}</strong>. Você pode
            alterá-la na consulta do usuário.
          </p>
        ) : null}
      </section>
      {erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        >
          {erro}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 px-5"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={ocupado}
          className="min-h-10 bg-[#203b61] px-5 text-white hover:bg-[#31537f]"
        >
          {ocupado
            ? "Salvando…"
            : usuario
              ? "Salvar alterações"
              : "Cadastrar usuário"}
        </Button>
      </div>
    </form>
  );
}

export function SituacaoUsuario({ usuario }: { usuario: UsuarioDetalhe }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function alternar() {
    if (
      !usuario.ativo &&
      !window.confirm(`Deseja ativar o acesso de ${usuario.nome}?`)
    )
      return;
    if (
      usuario.ativo &&
      !window.confirm(
        `Deseja inativar o acesso de ${usuario.nome}? As sessões atuais serão encerradas.`,
      )
    )
      return;
    setErro("");
    setOcupado(true);
    try {
      await operacoes.alterarSituacao(usuario.id, !usuario.ativo);
      router.refresh();
    } catch (falha) {
      setErro(mensagem(falha));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={ocupado}
        onClick={alternar}
        className="min-h-10 px-4"
      >
        {ocupado
          ? "Atualizando…"
          : usuario.ativo
            ? "Inativar usuário"
            : "Ativar usuário"}
      </Button>
      {erro ? (
        <p role="alert" className="basis-full text-sm text-red-800">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export { perfilLabel };
