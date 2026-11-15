import Link from "next/link";
import { RotateCw } from "lucide-react";

export function SessionUnavailable() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f6f8fc] px-5 py-10">
      <section
        className="w-full max-w-xl rounded-2xl border border-[#dce5f0] bg-white p-6 text-[#1d3c67] shadow-sm sm:p-8"
        aria-labelledby="sessao-indisponivel-titulo"
      >
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-[#eef5ff] text-[#2864b5]">
          <RotateCw aria-hidden="true" size={21} />
        </span>
        <h1
          id="sessao-indisponivel-titulo"
          className="text-2xl font-bold tracking-[-0.025em]"
        >
          Não foi possível verificar sua sessão
        </h1>
        <p role="alert" className="mt-3 leading-7 text-[#52647f]">
          O SIPAT está temporariamente indisponível. Sua sessão não foi tratada
          como encerrada. Aguarde um momento e tente novamente.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1d3b61] px-5 text-sm font-bold text-white no-underline hover:bg-[#294d78] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
          href="/"
        >
          Tentar novamente
        </Link>
      </section>
    </main>
  );
}
