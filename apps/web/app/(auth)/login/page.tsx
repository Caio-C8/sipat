import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse o SIPAT.",
};

export default async function LoginPage() {
  const identidade = await obterIdentidadeAtual();

  if (identidade) {
    redirect(
      identidade.trocaSenhaObrigatoria ? "/redefinir-senha" : "/dashboard",
    );
  }

  return (
    <div className="w-full rounded-[1.1rem] border border-[#e2e8f1] bg-white p-[clamp(1.35rem,2.1vw,2.5rem)] min-[801px]:mt-[11vw]">
      <h1 className="text-[clamp(1.5rem,1.55vw,2rem)] leading-[1.2] font-bold tracking-[-0.025em] text-[#1d3c67]">
        Acesse sua conta
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#52647f]">
        Informe suas credenciais para entrar no SIPAT.
      </p>
      <LoginForm />
      <p className="mt-5 text-center text-xs text-[#596b84]">
        Acesso destinado aos usuários autorizados da Câmara.
      </p>
    </div>
  );
}
