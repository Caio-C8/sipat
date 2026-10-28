export interface RefreshTokenStorage {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  remove(): Promise<void>;
}

export class RefreshTokenStorageError extends Error {
  constructor(
    readonly operation: "read" | "write" | "remove",
    options?: ErrorOptions,
  ) {
    super(`Não foi possível ${operation} a credencial segura.`, options);
    this.name = "RefreshTokenStorageError";
  }
}

export function createRefreshTokenStorage(
  driver: Readonly<{
    get(): Promise<string | null>;
    set(token: string): Promise<void>;
    delete(): Promise<void>;
  }>,
): RefreshTokenStorage {
  return {
    async read() {
      try {
        return await driver.get();
      } catch (cause) {
        throw new RefreshTokenStorageError("read", { cause });
      }
    },
    async write(token) {
      try {
        await driver.set(token);
      } catch (cause) {
        throw new RefreshTokenStorageError("write", { cause });
      }
    },
    async remove() {
      try {
        await driver.delete();
      } catch (cause) {
        throw new RefreshTokenStorageError("remove", { cause });
      }
    },
  };
}
