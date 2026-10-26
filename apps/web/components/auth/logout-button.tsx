"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { browserAuth } from "@/lib/auth/browser-auth";

type LogoutButtonProps = Readonly<{
  className?: string;
  children?: string;
}>;

export function LogoutButton({
  className,
  children = "Sair",
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setErro(null);

    try {
      await browserAuth.logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setErro("Não foi possível encerrar a sessão. Tente novamente.");
      setPending(false);
    }
  }

  return (
    <span>
      <button
        className={className}
        type="button"
        onClick={logout}
        disabled={pending}
      >
        <LogOut size={15} aria-hidden="true" />
        {pending ? "Saindo..." : children}
      </button>
      {erro ? <span role="alert">{erro}</span> : null}
    </span>
  );
}
