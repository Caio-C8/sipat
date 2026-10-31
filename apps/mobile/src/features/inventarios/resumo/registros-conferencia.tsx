import type { ListarItensInventarioResponse } from "@repo/contracts";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileInventarios, radii, spacing } from "../../../theme/tokens";
import { formatPatrimonioNumber } from "../../patrimonios/patrimonio-formatters";
import { Pagination } from "../inventario-components";
import type { ContextoRegistrosSetor } from "../use-inventarios";

function numberLabel(value: string) {
  return formatPatrimonioNumber(
    value,
    value.startsWith("SP-") ? "SEM_NUMERO_OFICIAL" : "OFICIAL",
  );
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function resultLabel(
  item: ListarItensInventarioResponse["dados"][number],
  encontradoAqui: boolean,
) {
  if (encontradoAqui) return "Encontrado aqui";
  if (item.situacao === "CORRETO") return "Correto";
  if (item.situacao === "NAO_LOCALIZADO") return "Não localizado";
  if (item.situacao === "DIVERGENCIA") {
    return item.statusCorrecao === "CORRIGIDO"
      ? "Divergência corrigida"
      : "Divergência pendente";
  }
  return "Pendente";
}

function correctionLabel(
  localizacao: NonNullable<
    ListarItensInventarioResponse["dados"][number]["localizacaoPosterior"]
  >,
) {
  if (localizacao.statusCorrecao === "PENDENTE") return "Correção pendente";
  return localizacao.tipoCorrecao === "TRANSFERENCIA_CADASTRAL"
    ? `Cadastro transferido para ${localizacao.setorEncontrado.nome}`
    : "Retorno ao setor original registrado";
}

function divergenceCorrectionLabel(item: Item) {
  if (item.situacao !== "DIVERGENCIA") return null;
  if (item.statusCorrecao === "PENDENTE") return "Correção pendente";
  return item.tipoCorrecao === "TRANSFERENCIA_CADASTRAL"
    ? `Cadastro transferido para ${item.setorEncontrado.nome}`
    : "Retorno ao setor original registrado";
}

type Item = ListarItensInventarioResponse["dados"][number];

function RegistroCard({
  encontradoAqui,
  item,
}: Readonly<{ encontradoAqui: boolean; item: Item }>) {
  const correcaoDivergencia = divergenceCorrectionLabel(item);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeading}>
        <Text style={styles.itemTitle}>{item.patrimonio.descricao}</Text>
        <Text style={[styles.badge, encontradoAqui && styles.foundBadge]}>
          {resultLabel(item, encontradoAqui)}
        </Text>
      </View>
      <Text style={styles.number}>
        {numberLabel(item.patrimonio.numeroPatrimonio)}
      </Text>
      {item.situacao === "DIVERGENCIA" ? (
        <Text style={styles.meta}>
          Setor original: {item.setorEsperado.nome} · Encontrado em{" "}
          {item.setorEncontrado.nome}
        </Text>
      ) : null}
      {correcaoDivergencia ? (
        <Text style={styles.correction}>{correcaoDivergencia}</Text>
      ) : null}
      {item.localizacaoPosterior ? (
        <>
          <Text style={styles.meta}>
            Setor original: {item.setorEsperado.nome}
          </Text>
          <Text style={styles.meta}>
            Encontrado posteriormente em{" "}
            {item.localizacaoPosterior.setorEncontrado.nome}
          </Text>
          <Text style={styles.correction}>
            {correctionLabel(item.localizacaoPosterior)}
          </Text>
        </>
      ) : null}
      {item.dataVerificacao ? (
        <Text style={styles.meta}>
          Verificado em {dateTimeLabel(item.dataVerificacao)}
        </Text>
      ) : null}
    </View>
  );
}

export function RegistrosConferencia({
  items,
  contexto,
  onContexto,
  onPage,
  setorId,
  totais,
}: Readonly<{
  items: ListarItensInventarioResponse;
  contexto: ContextoRegistrosSetor;
  onContexto: (contexto: ContextoRegistrosSetor) => void;
  onPage: (page: number) => void;
  setorId: string;
  totais: Readonly<{ previstos: number; encontradosAqui: number }>;
}>) {
  const isEncontradoAqui = (item: Item) =>
    item.setorEsperado.id !== setorId &&
    (item.setorEncontrado?.id === setorId ||
      item.localizacaoPosterior?.setorEncontrado.id === setorId);
  const previstos = items.dados.filter((item) => !isEncontradoAqui(item));
  const encontrados = items.dados.filter(isEncontradoAqui);
  const tabs: readonly (readonly [ContextoRegistrosSetor, string, number])[] = [
    ["PREVISTO", "Do setor", totais.previstos],
    ["ENCONTRADO_NO_SETOR", "Encontrados aqui", totais.encontradosAqui],
    ["TODOS", "Todos", totais.previstos + totais.encontradosAqui],
  ];

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Registros da conferência
      </Text>
      <Text style={styles.subtitle}>
        Separe os itens previstos dos bens de outros setores encontrados aqui.
      </Text>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {tabs.map(([value, label, total]) => {
          const selected = contexto === value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={value}
              onPress={() => onContexto(value)}
              style={[styles.tab, selected && styles.selectedTab]}
            >
              <Text
                style={[styles.tabText, selected && styles.selectedTabText]}
              >
                {label} ({total.toLocaleString("pt-BR")})
              </Text>
            </Pressable>
          );
        })}
      </View>
      {items.dados.length === 0 ? (
        <View accessibilityLiveRegion="polite" style={styles.empty}>
          <Text style={styles.emptyText}>
            Nenhum item foi encontrado neste filtro.
          </Text>
        </View>
      ) : (
        <>
          {contexto === "TODOS" && previstos.length > 0 ? (
            <Text style={styles.groupTitle}>
              Itens previstos para este setor
            </Text>
          ) : null}
          {previstos.map((item) => (
            <RegistroCard encontradoAqui={false} item={item} key={item.id} />
          ))}
          {contexto === "TODOS" && encontrados.length > 0 ? (
            <Text style={styles.groupTitle}>
              Itens de outros setores encontrados aqui
            </Text>
          ) : null}
          {encontrados.map((item) => (
            <RegistroCard encontradoAqui item={item} key={item.id} />
          ))}
        </>
      )}
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
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  selectedTab: {
    backgroundColor: mobileInventarios.actionSurface,
    borderColor: mobileInventarios.action,
  },
  tabText: {
    color: mobileInventarios.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  selectedTabText: { color: mobileInventarios.action },
  groupTitle: {
    color: mobileInventarios.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  empty: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyText: { color: mobileInventarios.textMuted, fontSize: 13 },
  card: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  itemTitle: {
    color: mobileInventarios.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  badge: {
    color: mobileInventarios.action,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  foundBadge: { color: mobileInventarios.success },
  number: {
    color: mobileInventarios.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  meta: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  correction: {
    color: mobileInventarios.action,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});
