import type {
  CredenciaisMobile,
  IdentidadeAutenticada,
  MobileConcluirPrimeiroAcessoBody,
  MobileLoginBody,
} from "@repo/contracts";
import { ApiError, isApiError } from "../../../lib/api/api-error";
import type { AuthOperations } from "../api/auth-operations";
import type { RefreshTokenStorage } from "../storage/refresh-token-storage";

export type SessionState =
  | Readonly<{ status: "restoring" }>
  | Readonly<{ status: "anonymous" }>
  | Readonly<{
      status: "authenticated";
      identity: IdentidadeAutenticada;
      firstAccessJustCompleted?: boolean;
    }>
  | Readonly<{ status: "temporarily-unavailable" }>
  | Readonly<{
      status: "storage-error";
      operation: "read" | "write" | "remove";
    }>;

type Listener = () => void;

export class SessionManager {
  private state: SessionState = { status: "restoring" };
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private refreshPromise: Promise<void> | null = null;
  private listeners = new Set<Listener>();

  constructor(
    private readonly operations: AuthOperations,
    private readonly storage: RefreshTokenStorage,
  ) {}

  getSnapshot = () => this.state;
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(state: SessionState) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  private setMemory(
    credentials: CredenciaisMobile,
    identity: IdentidadeAutenticada,
    firstAccessJustCompleted = false,
  ) {
    this.accessToken = credentials.accessToken;
    this.accessTokenExpiresAt = Date.parse(credentials.accessTokenExpiraEm);
    this.publish({
      status: "authenticated",
      identity,
      firstAccessJustCompleted,
    });
  }

  private clearMemory() {
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
  }

  private async removeLocalCredential() {
    this.clearMemory();
    try {
      await this.storage.remove();
      this.publish({ status: "anonymous" });
    } catch {
      this.publish({ status: "storage-error", operation: "remove" });
    }
  }

  private async persistPair(
    credentials: CredenciaisMobile,
    identity: IdentidadeAutenticada,
    firstAccessJustCompleted = false,
  ) {
    try {
      await this.storage.write(credentials.refreshToken);
    } catch (cause) {
      await this.handleSecureWriteFailure(credentials.refreshToken);
      throw cause;
    }
    this.setMemory(credentials, identity, firstAccessJustCompleted);
  }

  private async handleSecureWriteFailure(refreshToken: string) {
    try {
      await this.operations.logout(refreshToken);
    } catch {
      // A falha de revogação não torna seguro manter a credencial local.
    }
    this.clearMemory();
    try {
      await this.storage.remove();
    } catch {
      // O estado publicado abaixo informa que a limpeza precisa de atenção.
    }
    this.publish({ status: "storage-error", operation: "write" });
  }

  async restore() {
    this.publish({ status: "restoring" });
    let refreshToken: string | null;
    try {
      refreshToken = await this.storage.read();
    } catch {
      this.publish({ status: "storage-error", operation: "read" });
      return;
    }
    if (!refreshToken) {
      this.publish({ status: "anonymous" });
      return;
    }

    try {
      const credentials = await this.operations.refresh(refreshToken);
      try {
        await this.storage.write(credentials.refreshToken);
      } catch (cause) {
        await this.handleSecureWriteFailure(credentials.refreshToken);
        throw cause;
      }
      this.accessToken = credentials.accessToken;
      this.accessTokenExpiresAt = Date.parse(credentials.accessTokenExpiraEm);
      const identity = await this.operations.me(credentials.accessToken);
      this.publish({ status: "authenticated", identity });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        await this.removeLocalCredential();
        return;
      }
      if (
        isApiError(error) &&
        (error.kind === "network" || error.kind === "timeout")
      ) {
        this.clearMemory();
        this.publish({ status: "temporarily-unavailable" });
        return;
      }
      this.clearMemory();
      this.publish({ status: "storage-error", operation: "write" });
    }
  }

  async login(body: MobileLoginBody) {
    const result = await this.operations.login(body);
    await this.persistPair(result.credenciais, result.identidade);
    return result.identidade;
  }

  async completeFirstAccess(body: MobileConcluirPrimeiroAcessoBody) {
    const token = await this.validAccessToken();
    try {
      const result = await this.operations.completeFirstAccess(token, body);
      await this.persistPair(result.credenciais, result.identidade, true);
      return result.identidade;
    } catch (error) {
      if (isApiError(error) && error.status === 401)
        await this.removeLocalCredential();
      throw error;
    }
  }

  async revalidate() {
    if (this.state.status !== "authenticated") return;
    try {
      await this.validAccessToken();
      const identity = await this.operations.me(this.accessToken!);
      this.publish({ status: "authenticated", identity });
    } catch (error) {
      if (isApiError(error) && error.status === 401)
        await this.removeLocalCredential();
    }
  }

  acknowledgeFirstAccessCompletion() {
    if (this.state.status === "authenticated") {
      this.publish({ status: "authenticated", identity: this.state.identity });
    }
  }

  async authorizedRequest<T>(
    operation: (accessToken: string) => Promise<T>,
    retrySafe = false,
  ): Promise<T> {
    const token = await this.validAccessToken();
    try {
      return await operation(token);
    } catch (error) {
      if (!retrySafe || !isApiError(error) || error.status !== 401) throw error;
    }

    await this.refresh();
    try {
      return await operation(this.accessToken!);
    } catch (error) {
      if (isApiError(error) && error.status === 401)
        await this.removeLocalCredential();
      throw error;
    }
  }

  private async validAccessToken() {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - 5_000) {
      return this.accessToken;
    }
    await this.refresh();
    if (!this.accessToken) throw new ApiError("http", 401);
    return this.accessToken;
  }

  private async refresh() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async performRefresh() {
    const refreshToken = await this.storage.read();
    if (!refreshToken) {
      this.clearMemory();
      this.publish({ status: "anonymous" });
      throw new ApiError("http", 401);
    }
    try {
      const credentials = await this.operations.refresh(refreshToken);
      try {
        await this.storage.write(credentials.refreshToken);
      } catch (cause) {
        await this.handleSecureWriteFailure(credentials.refreshToken);
        throw cause;
      }
      this.accessToken = credentials.accessToken;
      this.accessTokenExpiresAt = Date.parse(credentials.accessTokenExpiraEm);
    } catch (error) {
      if (isApiError(error) && error.status === 401)
        await this.removeLocalCredential();
      throw error;
    }
  }

  async logout(): Promise<"remote-revoked" | "local-only"> {
    let refreshToken: string | null = null;
    let remoteRevoked = false;
    try {
      refreshToken = await this.storage.read();
      if (refreshToken) {
        await this.operations.logout(refreshToken);
        remoteRevoked = true;
      }
    } catch {
      // Logout local continua obrigatório quando offline ou a API falha.
    } finally {
      await this.removeLocalCredential();
    }
    return remoteRevoked ? "remote-revoked" : "local-only";
  }
}
