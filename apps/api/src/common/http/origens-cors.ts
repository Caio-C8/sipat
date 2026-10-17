export function parsearOrigensCors(
  origensConfiguradas: string,
): readonly string[] {
  return origensConfiguradas
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);
}
