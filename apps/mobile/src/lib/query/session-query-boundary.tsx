import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useSession } from "../../features/auth/session/session-context";
import {
  SessionQueryIsolation,
  type SessionIdentityKey,
} from "./session-query-isolation";

type SessionQueryTransitionProps = Readonly<
  PropsWithChildren<{
    identity: SessionIdentityKey;
    isolation: SessionQueryIsolation;
  }>
>;

function SessionQueryTransition({
  children,
  identity,
  isolation,
}: SessionQueryTransitionProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    void isolation.synchronize(identity).then(() => {
      if (!disposed) setReady(true);
    });

    return () => {
      disposed = true;
    };
  }, [identity, isolation]);

  return ready ? children : null;
}

export function SessionQueryBoundary({
  children,
}: Readonly<PropsWithChildren>) {
  const { state } = useSession();
  const queryClient = useQueryClient();
  const isolation = useMemo(
    () => new SessionQueryIsolation(queryClient),
    [queryClient],
  );
  const identity = state.status === "authenticated" ? state.identity.id : null;

  return (
    <SessionQueryTransition
      key={identity ?? "anonymous"}
      identity={identity}
      isolation={isolation}
    >
      {children}
    </SessionQueryTransition>
  );
}
