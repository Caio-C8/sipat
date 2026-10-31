import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

type Reload = () => void | Promise<unknown>;

/**
 * Recarrega os dados quando uma rota montada volta a receber foco.
 * A primeira entrada fica a cargo do hook de dados da própria tela.
 */
export function useReloadOnReturn(reload: Reload) {
  const reloadRef = useRef(reload);
  const focusedOnce = useRef(false);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void reloadRef.current();
      else focusedOnce.current = true;
    }, []),
  );
}
