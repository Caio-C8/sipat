import { Lucide } from "@react-native-vector-icons/lucide";
import type { ListarItensInventarioResponse } from "@repo/contracts";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileInventarios, radii, spacing } from "../../../theme/tokens";
import { Pagination } from "../inventario-components";

export function PendenciasCorrecao({
  inventarioId,
  items,
  mutable,
  onPage,
}: Readonly<{
  inventarioId: string;
  items: ListarItensInventarioResponse;
  mutable: boolean;
  onPage: (page: number) => void;
}>) {
  const router = useRouter();
  if (items.meta.total === 0) return null;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Ocorrências com correção pendente
      </Text>
      <Text style={styles.subtitle}>
        {items.meta.total.toLocaleString("pt-BR")} ocorrência(s) permanecem
        registradas no inventário.
      </Text>
      {items.dados.map((item) => {
        const localizacaoPosterior = item.localizacaoPosterior;
        const pendente =
          item.situacao === "DIVERGENCIA" ||
          (item.situacao === "NAO_LOCALIZADO" &&
            localizacaoPosterior?.statusCorrecao === "PENDENTE");
        const setorEncontrado =
          item.situacao === "DIVERGENCIA"
            ? item.setorEncontrado
            : localizacaoPosterior?.setorEncontrado;
        return pendente && setorEncontrado ? (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.badge}>
                {item.situacao === "NAO_LOCALIZADO"
                  ? "ENCONTRADO POSTERIORMENTE"
                  : "SETOR INCORRETO"}
              </Text>
              <Text style={styles.itemTitle}>{item.patrimonio.descricao}</Text>
              <Text style={styles.itemMeta}>
                {item.patrimonio.numeroPatrimonio} · {item.setorEsperado.nome} →{" "}
                {setorEncontrado.nome}
              </Text>
            </View>
            {mutable ? (
              <Pressable
                accessibilityHint="Abre a correção desta divergência"
                accessibilityRole="button"
                onPress={() =>
                  router.push(
                    `/inventarios/${inventarioId}/itens/${item.id}/correcao` as Href,
                  )
                }
                style={styles.action}
              >
                <Text style={styles.actionText}>Corrigir</Text>
                <Lucide
                  accessible={false}
                  color={mobileInventarios.action}
                  name="chevron-right"
                  size={18}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null;
      })}
      <Pagination
        lastPage={items.meta.ultimaPagina}
        onPage={onPage}
        page={items.meta.pagina}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  title: { color: mobileInventarios.text, fontSize: 18, fontWeight: "800" },
  subtitle: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.sm,
    minHeight: 92,
    padding: spacing.md,
  },
  cardBody: { flex: 1, minWidth: 0 },
  badge: { color: mobileInventarios.warning, fontSize: 10, fontWeight: "800" },
  itemTitle: {
    color: mobileInventarios.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  itemMeta: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  action: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 48,
    paddingLeft: spacing.md,
  },
  actionText: {
    color: mobileInventarios.action,
    fontSize: 12,
    fontWeight: "800",
  },
});
