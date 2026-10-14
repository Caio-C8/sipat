import assert from "node:assert/strict";
import type * as z from "zod";

export function parseValido<TSchema extends z.ZodType>(
  schema: TSchema,
  entrada: unknown,
): z.output<TSchema> {
  const resultado = schema.safeParse(entrada);

  if (!resultado.success) {
    assert.fail(JSON.stringify(resultado.error.issues, null, 2));
  }

  return resultado.data;
}

export function esperaInvalido(
  schema: z.ZodType,
  entrada: unknown,
  caminho?: string,
): void {
  const resultado = schema.safeParse(entrada);

  if (resultado.success) {
    assert.fail("Era esperado que a validação falhasse.");
  }

  if (caminho !== undefined) {
    assert.ok(
      resultado.error.issues.some((issue) => issue.path.join(".") === caminho),
      `Nenhum erro encontrado no caminho "${caminho}":\n${JSON.stringify(
        resultado.error.issues,
        null,
        2,
      )}`,
    );
  }
}

export function esperaInvalidos(
  schema: z.ZodType,
  entradas: readonly unknown[],
): void {
  for (const entrada of entradas) {
    esperaInvalido(schema, entrada);
  }
}
