"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { browserAuth } from "@/lib/auth/browser-auth";

type LogoutButtonProps = Readonly<{
  className?: string;
  children?: string;
  wrapperClassName?: string;
  errorClassName?: string;
  menuItem?: boolean;
}>;

export function LogoutButton({
  className,
  children = "Sair",
  wrapperClassName,
  errorClassName,
  menuItem = false,
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
    <span className={wrapperClassName}>
      <button
        className={className}
        type="button"
        onClick={logout}
        disabled={pending}
        role={menuItem ? "menuitem" : undefined}
      >
        <LogOut size={15} aria-hidden="true" />
        {pending ? "Saindo..." : children}
      </button>
      {erro ? (
        <span className={errorClassName} role="alert">
          {erro}
        </span>
      ) : null}
    </span>
  );
}
