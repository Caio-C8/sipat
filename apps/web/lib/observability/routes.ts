type RotaObservavel = Readonly<{
  pattern: RegExp;
  nome: string;
}>;

const ROTAS_OBSERVAVEIS: readonly RotaObservavel[] = [
  {
    pattern: /^\/$/,
    nome: "inicio",
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
