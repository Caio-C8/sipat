"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function ReavaliacaoDetalheDrawer({
  children,
  patrimonio,
  interceptado,
  retorno,
}: {
  children: ReactNode;
  patrimonio: string;
  interceptado: boolean;
  retorno: string;
}) {
  const router = useRouter();
  return (
    <Drawer
      defaultOpen
      onOpenChange={(aberto) => {
        if (aberto) return;
        if (interceptado) router.back();
        else router.push(retorno);
      }}
    >
      <DrawerContent className="max-w-[52rem] sm:w-[min(94vw,52rem)]">
        <DrawerHeader>
          <DrawerTitle>Reavaliação · Detalhes</DrawerTitle>
          <DrawerDescription>
            Registro individual do patrimônio {patrimonio}. Os dados são somente
            para consulta.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>{children}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
