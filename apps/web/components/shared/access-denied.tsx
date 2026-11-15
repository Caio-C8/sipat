import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function AccessDenied({
  description = "Seu perfil não possui permissão para acessar esta página.",
  backHref = "/dashboard",
  backLabel = "Voltar à visão geral",
}: Readonly<{
  description?: string;
  backHref?: string;
  backLabel?: string;
}>) {
  return (
    <main className="grid min-h-[60vh] place-items-center p-4 sm:p-7">
      <section className="w-full max-w-xl rounded-xl border border-[#dfe7f1] bg-white p-6 text-[#19355d] shadow-sm sm:p-8">
        <ShieldAlert
          className="mb-4 text-[#b45309]"
          aria-hidden="true"
          size={30}
        />
        <h1 className="text-2xl font-bold">Acesso não permitido</h1>
        <p role="alert" className="mt-3 leading-7 text-[#526580]">
          {description}
        </p>
        <Link
          className="mt-6 inline-flex min-h-10 items-center font-bold text-[#286bc2] underline underline-offset-4"
          href={backHref}
        >
          {backLabel}
        </Link>
      </section>
    </main>
  );
}
