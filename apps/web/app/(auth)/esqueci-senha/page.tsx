import type { Metadata } from "next";
import { SolicitarRecuperacaoForm } from "./_components/solicitar-recuperacao-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  description: "Solicite as instruções para recuperar sua senha do SIPAT.",
};

export default function EsqueciSenhaPage() {
  return (
    <div className="w-full rounded-[1.1rem] border border-[#e2e8f1] bg-white p-[clamp(1.35rem,2.1vw,2.5rem)] min-[801px]:mt-[11vw]">
      <h1 className="text-[clamp(1.5rem,1.55vw,2rem)] leading-[1.2] font-bold tracking-[-0.025em] text-[#1d3c67]">
        Recupere sua senha
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#52647f]">
        Informe seu e-mail institucional para receber as instruções.
      </p>
      <SolicitarRecuperacaoForm />
    </div>
  );
}
