import { isApiError } from "../../../lib/api/api-error";

type AttemptOutcome = "pristine" | "uncertain" | "conclusive";

export function isConclusivePatrimonioCreationError(error: unknown) {
  return (
    isApiError(error) &&
    error.kind === "http" &&
    error.code !== "OPERACAO_EM_PROCESSAMENTO"
  );
}

export class PatrimonioCreationAttempt {
  private key: string | undefined;
  private outcome: AttemptOutcome = "pristine";
  private pending = false;

  start(generateKey: () => string): string | null {
    if (this.pending) return null;
    this.pending = true;
    this.key ??= generateKey();
    return this.key;
  }

  fail(error: unknown) {
    this.pending = false;
    this.outcome = isConclusivePatrimonioCreationError(error)
      ? "conclusive"
      : "uncertain";
  }

  payloadChanged() {
    if (this.outcome !== "conclusive") return;
    this.key = undefined;
    this.outcome = "pristine";
  }

  complete() {
    this.pending = false;
    this.key = undefined;
    this.outcome = "pristine";
  }
}
