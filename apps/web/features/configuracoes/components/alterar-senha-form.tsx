"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, LogIn } from "lucide-react";
import { AlterarSenhaBodySchema } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/core/api-error";
import {
  mapearErrosApi,
  mapearErrosZod,
  type ErrosFormulario,
} from "@/lib/auth/form-errors";
import { useAlterarSenha } from "../api/hooks";

const classeCampo =
  "mt-1 h-10 w-full rounded-md border border-[#dfe7f1] bg-white px-3 text-sm text-[#19355d] outline-none focus-visible:ring-2 focus-visible:ring-[#2860eb]";

export function AlterarSenhaForm() {
  const alteracao = useAlterarSenha();
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [concluida, setConcluida] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    const validacao = AlterarSenhaBodySchema.safeParse({
      senhaAtual: dados.get("senhaAtual"),
      novaSenha: dados.get("novaSenha"),
      confirmacaoNovaSenha: dados.get("confirmacaoNovaSenha"),
    });

    if (!validacao.success) {
      setErros(mapearErrosZod(validacao.error));
      setErroGeral("Revise os campos destacados.");
      return;
    }

    setErros({});
    setErroGeral(null);
    try {
      const resposta = await alteracao.confirmar(validacao.data);
      if (resposta === null) return;
      formulario.reset();
      setConcluida(true);
    } catch (erro: unknown) {
      setErros(mapearErrosApi(erro));
      setErroGeral(
        isApiError(erro)
          ? erro.message
          : "Não foi possível alterar a senha. Tente novamente.",
      );
    }
  }

  if (concluida) {
    return (
      <section
        aria-labelledby="senha-alterada-titulo"
        className="grid gap-3 rounded-md border border-[#b8e4ca] bg-[#f0fbf4] p-4 text-sm text-[#145c37]"
      >
        <Check aria-hidden="true" className="size-5" />
        <h2 id="senha-alterada-titulo" className="font-bold">
          Senha alterada
        </h2>
        <p role="status" className="text-xs leading-5">
          Todas as sessões foram encerradas. Entre novamente com a nova senha.
        </p>
        <Button asChild className="w-fit bg-[#223d64] text-white">
          <Link href="/login">
            <LogIn aria-hidden="true" />
            Entrar novamente
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={enviar} noValidate>
      {erroGeral ? (
        <p
          role="alert"
          className="rounded-md border border-[#efb7b7] bg-[#fff4f4] px-3 py-2.5 text-xs leading-5 text-[#8f2525]"
        >
          {erroGeral}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <label
          htmlFor="senha-atual"
          className="text-[11px] font-semibold text-[#29456d]"
        >
          Senha atual *
        </label>
        <Input
          id="senha-atual"
          className={classeCampo}
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-invalid={Boolean(erros.senhaAtual)}
          aria-describedby={erros.senhaAtual ? "senha-atual-erro" : undefined}
        />
        {erros.senhaAtual ? (
          <p id="senha-atual-erro" className="text-xs text-[#9b2727]">
            {erros.senhaAtual}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="nova-senha"
          className="text-[11px] font-semibold text-[#29456d]"
        >
          Nova senha *
        </label>
        <Input
          id="nova-senha"
          className={classeCampo}
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          aria-invalid={Boolean(erros.novaSenha)}
          aria-describedby={erros.novaSenha ? "nova-senha-erro" : undefined}
        />
        {erros.novaSenha ? (
          <p id="nova-senha-erro" className="text-xs text-[#9b2727]">
            {erros.novaSenha}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="confirmacao-nova-senha"
          className="text-[11px] font-semibold text-[#29456d]"
        >
          Confirmar nova senha *
        </label>
        <Input
          id="confirmacao-nova-senha"
          className={classeCampo}
          name="confirmacaoNovaSenha"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          aria-invalid={Boolean(erros.confirmacaoNovaSenha)}
          aria-describedby={
            erros.confirmacaoNovaSenha ? "confirmacao-senha-erro" : undefined
          }
        />
        {erros.confirmacaoNovaSenha ? (
          <p id="confirmacao-senha-erro" className="text-xs text-[#9b2727]">
            {erros.confirmacaoNovaSenha}
          </p>
        ) : null}
      </div>

      <p className="text-[10px] leading-5 text-[#71839a]">
        A senha deve conter ao menos 8 caracteres, incluindo uma letra, um
        número e um símbolo. A confirmação deve ser igual à nova senha.
      </p>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[#edf1f6] pt-4">
        <Button asChild variant="outline" className="min-w-32">
          <Link href="/configuracoes">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={alteracao.pending}
          className="min-w-48 justify-start gap-2 bg-[#223d64] text-white hover:bg-[#2b507e]"
        >
          <Check aria-hidden="true" />
          {alteracao.pending ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </div>
    </form>
  );
}
