import { describe, expect, it } from "vitest";
import type { SessionManager } from "../../features/auth/session/session-manager";
import { currentSessionIdentity, isCurrentSession } from "./session-mutation";

const IDENTITY_ID = "11111111-1111-4111-8111-111111111111";

function managerWithSnapshot(snapshot: unknown) {
  return {
    getSnapshot: () => snapshot,
  } as SessionManager;
}

describe("guarda de sessão para mutations", () => {
  it("aceita a mesma identidade autenticada", () => {
    const manager = managerWithSnapshot({
      status: "authenticated",
      identity: { id: IDENTITY_ID },
    });

    expect(currentSessionIdentity(manager)).toBe(IDENTITY_ID);
    expect(isCurrentSession(manager, IDENTITY_ID)).toBe(true);
  });

  it.each([
    [{ status: "anonymous" }, IDENTITY_ID],
    [
      {
        status: "authenticated",
        identity: { id: "22222222-2222-4222-8222-222222222222" },
      },
      IDENTITY_ID,
    ],
    [{ status: "authenticated", identity: { id: IDENTITY_ID } }, null],
  ])(
    "bloqueia reconciliação depois de logout ou troca",
    (snapshot, expected) => {
      expect(isCurrentSession(managerWithSnapshot(snapshot), expected)).toBe(
        false,
      );
    },
  );
});
