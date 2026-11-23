import type { ReactNode } from "react";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export default async function SetoresLayout({
  children,
}: {
  children: ReactNode;
}) {
  await exigirIdentidadeAtual();
  return children;
}
