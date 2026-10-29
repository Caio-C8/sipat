import type { Metadata } from "next";
import { RecuperarSenhaForm } from "./_components/recuperar-senha-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Defina uma nova senha para acessar o SIPAT.",
};

export default function RecuperarSenhaPage() {
  return (
    <div className="w-full rounded-[1.1rem] border border-[#e2e8f1] bg-white p-[clamp(1.35rem,2.1vw,2.5rem)] min-[801px]:mt-12">
      <h1 className="text-[clamp(1.5rem,1.55vw,2rem)] leading-[1.2] font-bold tracking-[-0.025em] text-[#1d3c67]">
        Crie sua nova senha
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#52647f]">
        Use o link recebido por e-mail para concluir a recuperação.
      </p>
      <RecuperarSenhaForm />
    </div>
  );
}
