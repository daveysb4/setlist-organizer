import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  Text as DefaultText,
  View as DefaultView,
} from "react-native";

type Theme = "light" | "dark";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];

function useThemeColor(
  props: ThemeProps,
  colorName: keyof (typeof Colors)["light"]
) {
  const theme = (useColorScheme() ?? "light") as Theme;
  const colorFromProps = theme === "light" ? props.lightColor : props.darkColor;

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ lightColor, darkColor }, "text");

  return (
    <DefaultText
      style={[
        {
          color,
          fontFamily: "System",
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { lightColor, darkColor },
    "background"
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}