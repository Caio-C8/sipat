import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import crest from "../../../assets/brasao.png";
import { layout, mobileShell, spacing } from "../../theme/tokens";

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
    backgroundColor: mobileShell.header,
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    minHeight: 76,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  contentWide: {
    minHeight: 84,
    paddingHorizontal: spacing.xxxl,
  },
  crest: {
    borderRadius: 8,
    height: 36,
    width: 36,
  },
  crestWide: {
    height: 44,
    width: 44,
  },
  wordmark: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    flexShrink: 1,
    justifyContent: "space-between",
  },
  title: {
    color: mobileShell.headerText,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: mobileShell.headerTextMuted,
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 13,
    maxWidth: 104,
    textAlign: "right",
  },
});
