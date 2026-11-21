"use client";

import { createContext, useContext, type ReactNode } from "react";

const CadastroFieldErrorsContext = createContext<Record<string, string>>({});

export function CadastroFieldErrorsProvider({
  errors,
  children,
}: {
  errors: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <CadastroFieldErrorsContext.Provider value={errors}>
      {children}
    </CadastroFieldErrorsContext.Provider>
  );
}

export function useCadastroFieldError(name: string) {
  return useContext(CadastroFieldErrorsContext)[name];
}
