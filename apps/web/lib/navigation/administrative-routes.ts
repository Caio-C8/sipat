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
  processosCompra: administrativeRoute("/cadastros"),
  fornecedores: administrativeRoute("/cadastros/fornecedores"),
  setores: administrativeRoute("/cadastros/setores"),
  responsaveis: administrativeRoute("/cadastros/responsaveis"),
  comissoes: administrativeRoute("/cadastros/comissoes"),
  naturezas: administrativeRoute("/cadastros/naturezas"),
  especies: administrativeRoute("/cadastros/especies"),
  usuarios: administrativeRoute("/usuarios"),
} as const satisfies Record<string, AdministrativeRoute>;
