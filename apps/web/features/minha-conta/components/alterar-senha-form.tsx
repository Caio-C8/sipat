"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, CheckCircle2, LogIn } from "lucide-react";
import { AlterarSenhaBodySchema } from "@repo/contracts";
import { FormErrorSummary } from "@/components/shared/form-error-summary";
import { TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  mapearErrosApi,
  mapearErrosZod,
  mensagemGeralAuth,
  type ErrosFormulario,
} from "@/lib/auth/form-errors";
import { useAlterarSenha } from "../api/hooks";

const ordemCampos = [
  "senhaAtual",
  "novaSenha",
  "confirmacaoNovaSenha",
] as const;

function focarPrimeiroCampoInvalido(
  formulario: HTMLFormElement,
  erros: ErrosFormulario,
) {
  const nome = ordemCampos.find((campo) => Boolean(erros[campo]));
  if (!nome) return;

  const campo = formulario.elements.namedItem(nome);
  if (!(campo instanceof HTMLElement)) return;
  campo.scrollIntoView?.({ block: "center", behavior: "smooth" });
  campo.focus({ preventScroll: true });
}

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
      const errosValidacao = mapearErrosZod(validacao.error);
      setErros(errosValidacao);
      setErroGeral(null);
      focarPrimeiroCampoInvalido(formulario, errosValidacao);
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
      const errosCampos = mapearErrosApi(erro);
      setErros(errosCampos);

      if (Object.keys(errosCampos).length > 0) {
        setErroGeral(null);
        focarPrimeiroCampoInvalido(formulario, errosCampos);
        return;
      }

      setErroGeral(mensagemGeralAuth(erro));
    }
  }

  if (concluida) {
    return (
      <Alert role="status" className="border-primary/30 bg-primary/5 p-4">
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>Senha alterada com sucesso</AlertTitle>
        <AlertDescription className="grid gap-4">
          <p>
            Seu acesso foi encerrado em todos os dispositivos. Entre novamente
            usando a nova senha.
          </p>
          <Button asChild className="w-fit">
            <Link href="/login">
              <LogIn aria-hidden="true" data-icon="inline-start" />
              Entrar novamente
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      aria-label="Alterar senha"
      aria-busy={alteracao.pending}
      className="grid gap-5"
      onSubmit={enviar}
      noValidate
    >
      <FormErrorSummary
        title="Não foi possível alterar a senha"
        messages={erroGeral ? [erroGeral] : []}
        focus
      />

      <fieldset
        disabled={alteracao.pending}
        className="grid min-w-0 gap-5 disabled:opacity-75"
      >
        <TextField
          id="senha-atual"
          label="Senha atual"
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          error={erros.senhaAtual}
        />

        <TextField
          id="nova-senha"
          label="Nova senha"
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          description="Use pelo menos 8 caracteres, com uma letra, um número e um símbolo."
          error={erros.novaSenha}
        />

        <TextField
          id="confirmacao-nova-senha"
          label="Confirmar nova senha"
          name="confirmacaoNovaSenha"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          description="Digite novamente a nova senha."
          error={erros.confirmacaoNovaSenha}
        />

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" size="lg">
            <Link href="/minha-conta">Cancelar</Link>
          </Button>
          <Button type="submit" size="lg" disabled={alteracao.pending}>
            <Check aria-hidden="true" data-icon="inline-start" />
            {alteracao.pending ? "Salvando nova senha…" : "Salvar nova senha"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
