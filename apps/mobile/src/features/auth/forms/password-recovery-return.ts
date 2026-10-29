export const PASSWORD_RECOVERY_RETURN_ORIGIN = "recuperacao-senha";

export function isPasswordRecoveryReturnOrigin(
  value: string | string[] | undefined,
): boolean {
  return value === PASSWORD_RECOVERY_RETURN_ORIGIN;
}
