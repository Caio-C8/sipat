import type { QueryClient } from "@tanstack/react-query";

export type SessionIdentityKey = string | null;

const uninitializedSession = Symbol("uninitialized-session");

export class SessionQueryIsolation {
  private identity: SessionIdentityKey | typeof uninitializedSession =
    uninitializedSession;
  private cleanup = Promise.resolve();

  constructor(private readonly queryClient: QueryClient) {}

  synchronize(identity: SessionIdentityKey) {
    if (this.identity === identity) return this.cleanup;

    this.identity = identity;
    this.cleanup = this.cleanup.then(async () => {
      await this.queryClient.cancelQueries();
      this.queryClient.clear();
    });
    return this.cleanup;
  }
}
