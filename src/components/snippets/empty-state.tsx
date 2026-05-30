import { Text, View } from "react-native";
import { useTheme, panelStyle } from "@/components/ui";

export function EmptyState({ text }: { text: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        panelStyle,
        {
          borderStyle: "dashed",
          borderColor: colors.line,
          backgroundColor: colors.panel,
          paddingVertical: 24,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
      ]}
    >
      <Text style={{ fontSize: 24, marginBottom: 2 }}>📂</Text>
      <Text
        style={{
          color: colors.muted,
          lineHeight: 20,
          fontSize: 14,
          textAlign: "center",
          fontWeight: "500",
        }}
        selectable
      >
        {text}
      </Text>
    </View>
  );
}

