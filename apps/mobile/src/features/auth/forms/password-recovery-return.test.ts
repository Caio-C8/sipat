import { describe, expect, it } from "vitest";
import { isPasswordRecoveryReturnOrigin } from "./password-recovery-return";

describe("retorno tokenless da recuperação Web", () => {
  it("aceita somente a origem pública aprovada", () => {
    expect(isPasswordRecoveryReturnOrigin("recuperacao-senha")).toBe(true);
    expect(isPasswordRecoveryReturnOrigin(undefined)).toBe(false);
    expect(isPasswordRecoveryReturnOrigin("valor-invalido")).toBe(false);
    expect(isPasswordRecoveryReturnOrigin(["recuperacao-senha", "outra"])).toBe(
      false,
    );
  });
});
