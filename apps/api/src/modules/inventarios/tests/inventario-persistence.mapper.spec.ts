import { InventarioPersistenceMapper } from "../mappers/inventario-persistence.mapper";

const SETOR_INVENTARIO_ID = "00000000-0000-4000-8000-000000000001";

describe("InventarioPersistenceMapper", () => {
  it("separa os itens previstos dos encontrados posteriormente no setor", () => {
    const base = {
      pagina: 1,
      limite: 10,
      setorInventarioId: SETOR_INVENTARIO_ID,
      statusVerificacao: "VERIFICADO" as const,
    };

    expect(
      InventarioPersistenceMapper.paraFiltroItens({
        ...base,
        contextoSetor: "PREVISTO",
      }),
    ).toEqual({
      statusVerificacao: "VERIFICADO",
      AND: [{ setorInventarioId: SETOR_INVENTARIO_ID }],
    });
    expect(
      InventarioPersistenceMapper.paraFiltroItens({
        ...base,
        contextoSetor: "ENCONTRADO_NO_SETOR",
      }),
    ).toEqual({
      statusVerificacao: "VERIFICADO",
      AND: [
        {
          OR: [
            {
              setorEncontrado: {
                setoresInventario: {
                  some: { id: SETOR_INVENTARIO_ID },
                },
              },
            },
            {
              localizacoesPosteriores: {
                some: { setorInventarioEncontradoId: SETOR_INVENTARIO_ID },
              },
            },
          ],
        },
      ],
    });
    expect(InventarioPersistenceMapper.paraFiltroItens(base)).toEqual({
      statusVerificacao: "VERIFICADO",
      AND: [
        {
          OR: [
            { setorInventarioId: SETOR_INVENTARIO_ID },
            {
              setorEncontrado: {
                setoresInventario: {
                  some: { id: SETOR_INVENTARIO_ID },
                },
              },
            },
            {
              localizacoesPosteriores: {
                some: { setorInventarioEncontradoId: SETOR_INVENTARIO_ID },
              },
            },
          ],
        },
      ],
    });
  });
});
