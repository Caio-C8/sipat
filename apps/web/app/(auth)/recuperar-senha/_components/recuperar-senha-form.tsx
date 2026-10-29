"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RedefinirSenhaBodySchema,
  TokenRedefinicaoSenhaSchema,
} from "@repo/contracts";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/core/api-error";
import { browserAuth } from "@/lib/auth/browser-auth";
import {
  mapearErrosApi,
  mapearErrosZod,
  mensagemGeralAuth,
  type ErrosFormulario,
} from "@/lib/auth/form-errors";
import { PasswordInput } from "../../_components/password-input";

type EstadoToken = "capturando" | "valido" | "invalido";

const MENSAGEM_LINK_INVALIDO =
  "Este link de recuperação é inválido, expirou ou já foi utilizado. Solicite um novo link.";

export function RecuperarSenhaForm() {
  const router = useRouter();
  const capturaExecutada = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const [estadoToken, setEstadoToken] = useState<EstadoToken>("capturando");
  const [pending, setPending] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  useEffect(() => {
    if (capturaExecutada.current) return;
    capturaExecutada.current = true;

    const fragmento = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const params = new URLSearchParams(fragmento);
    const tokens = params.getAll("token");
    const possuiSomenteToken =
      tokens.length === 1 && [...params.keys()].every((key) => key === "token");
    const resultado = possuiSomenteToken
      ? TokenRedefinicaoSenhaSchema.safeParse(tokens[0])
      : { success: false as const };

    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    if (!resultado.success) {
      tokenRef.current = null;
      // O fragmento só existe no navegador e precisa ser refletido após a montagem.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstadoToken("invalido");
      return;
    }

    tokenRef.current = resultado.data;
    setEstadoToken("valido");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = tokenRef.current;
    if (!token) {
      setEstadoToken("invalido");
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const resultado = RedefinirSenhaBodySchema.safeParse({
      token,
      novaSenha: form.get("novaSenha"),
      confirmacaoNovaSenha: form.get("confirmacaoNovaSenha"),
    });

    if (!resultado.success) {
      setErros(mapearErrosZod(resultado.error));
      setErroGeral("Revise os campos destacados.");
      return;
    }

    setPending(true);
    setErros({});
    setErroGeral(null);

    try {
      await browserAuth.redefinirSenha(resultado.data);
      formElement.reset();
      tokenRef.current = null;
      router.replace("/recuperacao-concluida");
      router.refresh();
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        formElement.reset();
        tokenRef.current = null;
        setEstadoToken("invalido");
        setPending(false);
        return;
      }

      setErros(mapearErrosApi(error));
      setErroGeral(mensagemGeralAuth(error));
      setPending(false);
    }
  }

  if (estadoToken === "capturando") {
    return (
      <p className="mt-6 text-sm text-[#52647f]" role="status">
        Verificando o link de recuperação...
      </p>
    );
  }

  if (estadoToken === "invalido") {
    return (
      <div className="mt-6" role="alert">
        <span className="mb-5 grid size-12 place-items-center rounded-xl bg-[#fff3e8] text-[#a34f00]">
          <ShieldAlert size={24} aria-hidden="true" />
        </span>
        <p className="text-sm leading-7 text-[#52647f]">
          {MENSAGEM_LINK_INVALIDO}
        </p>
        <Button
          asChild
          className="mt-6 h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        >
          <Link href="/esqueci-senha">
            <ArrowRight size={17} aria-hidden="true" />
            Solicitar um novo link
          </Link>
        </Button>
        <Link
          className="mt-4 block w-fit text-xs font-semibold text-[#26588d] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
          href="/login"
        >
          Ir para o login Web
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-5 grid gap-[clamp(0.65rem,0.95vw,1.2rem)]"
      onSubmit={handleSubmit}
      noValidate
    >
      {erroGeral ? (
        <p
          className="rounded-lg border border-[#efb7b7] bg-[#fff4f4] px-3 py-2.5 text-xs leading-5 text-[#8f2525]"
          role="alert"
        >
          {erroGeral}
        </p>
      ) : null}
      <div className="grid gap-2">
        <label
          className="text-xs font-bold text-[#244163]"
          htmlFor="recuperar-nova-senha"
        >
          Nova senha *
        </label>
        <PasswordInput
          id="recuperar-nova-senha"
          name="novaSenha"
          autoComplete="new-password"
          autoFocus
          placeholder="Digite a senha"
          aria-invalid={Boolean(erros.novaSenha)}
          aria-describedby={
            erros.novaSenha ? "recuperar-nova-senha-error" : undefined
          }
        />
        {erros.novaSenha ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="recuperar-nova-senha-error"
          >
            {erros.novaSenha}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label
          className="text-xs font-bold text-[#244163]"
          htmlFor="recuperar-confirmacao-senha"
        >
          Confirmar nova senha *
        </label>
        <PasswordInput
          id="recuperar-confirmacao-senha"
          name="confirmacaoNovaSenha"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          aria-invalid={Boolean(erros.confirmacaoNovaSenha)}
          aria-describedby={
            erros.confirmacaoNovaSenha
              ? "recuperar-confirmacao-senha-error"
              : undefined
          }
        />
        {erros.confirmacaoNovaSenha ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="recuperar-confirmacao-senha-error"
          >
            {erros.confirmacaoNovaSenha}
          </p>
        ) : null}
      </div>
      <p className="text-xs leading-7 text-[#52647f]">
        Use de 8 a 128 caracteres, com uma letra, um número e um símbolo.
        <br />A confirmação deve ser igual à nova senha.
      </p>
      <Button
        className="h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        type="submit"
        disabled={pending}
      >
        <ArrowRight size={17} aria-hidden="true" />
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
