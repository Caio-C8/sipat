import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import crest from "../../../assets/brasao.png";
import { colors, layout, spacing, typography } from "../../theme/tokens";

const TABLET_MIN_WIDTH = 768;

export function AppTopbar() {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_MIN_WIDTH;

  return (
    <View style={styles.background}>
      <View
        accessibilityLabel="SIPAT, Câmara Municipal de Patos de Minas"
        accessibilityRole="header"
        style={[styles.content, isWide && styles.contentWide]}
      >
        <Image
          accessible={false}
          resizeMode="contain"
          source={crest}
          style={[styles.crest, isWide && styles.crestWide]}
        />

        <View style={styles.wordmark}>
          <Text style={styles.title}>SIPAT</Text>
          <Text style={styles.subtitle}>
            Câmara Municipal de Patos de Minas
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.md,
    maxWidth: layout.contentMaxWidth,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    width: "100%",
  },
  contentWide: {
    minHeight: 84,
    paddingHorizontal: spacing.xxxl,
  },
  crest: {
    height: 44,
    width: 44,
  },
  crestWide: {
    height: 52,
    width: 52,
  },
  wordmark: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
});
