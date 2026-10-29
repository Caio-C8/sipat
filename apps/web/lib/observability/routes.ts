type RotaObservavel = Readonly<{
  pattern: RegExp;
  nome: string;
}>;

const ROTAS_OBSERVAVEIS: readonly RotaObservavel[] = [
  {
    pattern: /^\/$/,
    nome: "inicio",
  },
  {
    pattern: /^\/login$/,
    nome: "auth.login",
  },
  {
    pattern: /^\/esqueci-senha$/,
    nome: "auth.recuperacao_solicitar",
  },
  {
    pattern: /^\/recuperar-senha$/,
    nome: "auth.recuperacao_redefinir",
  },
  {
    pattern: /^\/recuperacao-concluida$/,
    nome: "auth.recuperacao_concluida",
  },
  {
    pattern: /^\/redefinir-senha$/,
    nome: "auth.primeiro_acesso",
  },
  {
    pattern: /^\/senha-atualizada$/,
    nome: "auth.senha_atualizada",
  },
  {
    pattern: /^\/dashboard$/,
    nome: "dashboard",
  },
];

function removerBarrasFinais(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function normalizarRotaObservavel(pathname: string): string {
  const pathnameNormalizado = removerBarrasFinais(pathname);

  const rota = ROTAS_OBSERVAVEIS.find(({ pattern }) =>
    pattern.test(pathnameNormalizado),
  );

  return rota?.nome ?? "rota.desconhecida";
}
