import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Monitor, Package, Smartphone } from "lucide-react";

const BRASAO_SRC = "/images/brasao.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh bg-[#f6f8fc] min-[801px]:grid-cols-[41.7%_minmax(0,1fr)]">
      <aside
        className="hidden min-w-0 flex-col bg-[#102747] p-[clamp(2rem,4vw,5rem)] text-white min-[801px]:flex"
        aria-label="Sobre o SIPAT"
      >
        <div className="grid gap-5">
          <Link
            className="flex w-fit items-center gap-4 text-[clamp(1.5rem,1.65vw,2.25rem)] font-bold tracking-[-0.04em] text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
            href="/login"
          >
            <span className="grid size-12 place-items-center rounded-[0.65rem] bg-[#1d3b61] text-[#f0b600]">
              <Package size={23} aria-hidden="true" />
            </span>
            <span>SIPAT</span>
          </Link>
          <p className="text-[0.66rem] font-bold tracking-[0.045em] text-[#c8d7e9] uppercase">
            Sistema de Gestão Patrimonial
          </p>
        </div>
        <div className="my-auto py-8">
          <p className="max-w-lg text-[clamp(2rem,2.65vw,3.5rem)] leading-[1.15] font-bold tracking-[-0.035em] text-white">
            Gestão patrimonial
            <br />
            da Câmara.
          </p>
          <p className="mt-5 max-w-md text-[clamp(0.95rem,1vw,1.25rem)] leading-[1.7] text-[#b9cce2]">
            Consulte os bens, acompanhe as operações
            <br />e preserve o histórico de cada item.
          </p>
          <div className="mt-12 max-w-xl rounded-[0.85rem] border border-[#244469] bg-[#193759] px-6 py-5">
            <div className="flex items-center gap-3 text-sm font-bold text-white">
              <span className="mr-1 flex gap-2 text-[#bfd1e6]">
                <Monitor size={19} aria-hidden="true" />
                <Smartphone size={18} aria-hidden="true" />
              </span>
              <strong>No computador ou no celular</strong>
            </div>
            <p className="mt-3 text-xs text-[#b7cce2]">
              A mesma conta e os mesmos dados do SIPAT.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-[#274260] pt-6">
          <span className="grid size-15 shrink-0 place-items-center rounded-lg bg-white">
            <Image
              className="size-13 object-contain"
              src={BRASAO_SRC}
              alt=""
              width={89}
              height={90}
              unoptimized
            />
          </span>
          <div>
            <strong className="block text-sm leading-5">
              Câmara Municipal de Patos de Minas
            </strong>
            <span className="mt-0.5 block text-xs text-[#adc2d9]">
              Gestão do patrimônio público
            </span>
          </div>
        </div>
      </aside>
      <section
        className="flex min-h-svh min-w-0 flex-col items-center justify-center px-5 py-8 min-[801px]:min-h-0 min-[801px]:px-[clamp(1.5rem,5vw,6rem)] min-[801px]:py-12"
        aria-label="Acesso ao SIPAT"
      >
        <div className="mb-6 flex w-full max-w-2xl items-center gap-3 text-xl font-bold text-[#17385f] min-[801px]:hidden">
          <span className="grid size-10 place-items-center rounded-[0.65rem] bg-[#1d3b61] text-[#f0b600]">
            <Package size={20} aria-hidden="true" />
          </span>
          SIPAT
        </div>
        <div className="w-full max-w-2xl min-[801px]:max-w-[35.4vw]">
          {children}
          <p className="mt-8 text-center text-xs text-[#596b84]">
            SIPAT · Câmara Municipal de Patos de Minas
          </p>
        </div>
      </section>
    </main>
  );
}
