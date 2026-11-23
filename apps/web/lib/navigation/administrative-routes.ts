export type AdministrativeRoute = {
  list: `/${string}`;
  create: `/${string}`;
  edit: (id: string) => `/${string}`;
};

function administrativeRoute(list: `/${string}`): AdministrativeRoute {
  return {
    list,
    create: `${list}/novo` as const,
    edit: (id) => `${list}/${encodeURIComponent(id)}/editar` as const,
  };
}

export const administrativeRoutes = {
  processosCompra: administrativeRoute("/processos-compra"),
  fornecedores: administrativeRoute("/fornecedores"),
  setores: administrativeRoute("/setores"),
  responsaveis: administrativeRoute("/responsaveis"),
  comissoes: administrativeRoute("/comissoes"),
  naturezas: administrativeRoute("/naturezas"),
  especies: administrativeRoute("/especies"),
  usuarios: administrativeRoute("/usuarios"),
} as const satisfies Record<string, AdministrativeRoute>;
