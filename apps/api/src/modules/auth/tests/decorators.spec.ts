import { CHAVE_PERFIS_PERMITIDOS, CHAVE_ROTA_PUBLICA } from "../auth.constants";
import { PerfisPermitidos } from "../decorators/perfis-permitidos.decorator";
import { Publica } from "../decorators/publica.decorator";

describe("decorators de segurança", () => {
  it("Publica registra somente a metadata consumida pelo Guard", () => {
    const handler = () => undefined;

    Publica()(handler);

    expect(Reflect.getMetadata(CHAVE_ROTA_PUBLICA, handler)).toBe(true);
  });

  it("PerfisPermitidos registra os perfis declarados", () => {
    const handler = () => undefined;

    PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")(handler);

    expect(Reflect.getMetadata(CHAVE_PERFIS_PERMITIDOS, handler)).toEqual([
      "ADMINISTRADOR",
      "DIRETOR_PATRIMONIO",
    ]);
  });
});
