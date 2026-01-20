import React, { useMemo } from "react";
import { StyleSheet, Dimensions, View, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../../contexts/ThemeContext";

export interface TimeSeriesDataPoint {
  /** Timestamp in milliseconds or seconds */
  time: number;
  /** Metric value */
  value: number | null;
}

interface MetricChartProps {
  /** Time series data points */
  data: TimeSeriesDataPoint[];
  /** Chart color variant */
  color?: "brand" | "success" | "warning" | "error" | "info";
  /** Height of the chart */
  height?: number;
  /** Whether to show the X axis */
  showXAxis?: boolean;
  /** Format function for Y axis values */
  formatValue?: (value: number) => string;
  /** Format function for tooltip values */
  formatTooltipValue?: (value: number) => string;
}

/**
 * Time series chart component using react-native-chart-kit.
 * Styled with theme colors for mobile dashboard.
 */
export function MetricChart({
  data,
  color = "brand",
  height = 100,
  showXAxis = false,
  formatValue,
  formatTooltipValue,
}: MetricChartProps) {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width - 32; // Account for padding

  // Color mapping
  const colorMap = {
    brand: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
  };

  const chartColor = colorMap[color];

  // Transform data for chart-kit
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const validData = data
      .filter((d) => d.value !== null)
      .map((d) => ({
        time: d.time > 1e12 ? d.time : d.time * 1000, // Ensure milliseconds
        value: d.value ?? 0,
      }))
      .sort((a, b) => a.time - b.time);

    if (validData.length === 0) return null;

    // Downsample if too many points for better performance
    let displayData = validData;
    if (validData.length > 60) {
      const step = Math.ceil(validData.length / 60);
      displayData = validData.filter((_, index) => index % step === 0);
    }

    return {
      labels: displayData.map(() => ""),
      datasets: [
        {
          data: displayData.map((d) => d.value),
        },
      ],
    };
  }, [data, chartColor]);

  const defaultFormatValue = formatValue || ((v) => v.toFixed(1));
  const defaultFormatTooltip = formatTooltipValue || defaultFormatValue;

  if (!chartData) {
    return (
      <View style={[styles.container, { height }]}>
        <Text
          style={[styles.noDataText, { color: theme.colors.textSecondary }]}
        >
          No data available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={height}
        withDots={false}
        withShadow={false}
        withVerticalLines={false}
        withHorizontalLines={!showXAxis}
        withInnerLines={false}
        withOuterLines={false}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => {
            // Convert hex color to rgba for react-native-chart-kit
            const hex = chartColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          },
          labelColor: (opacity = 1) => {
            // Convert hex color to rgba for react-native-chart-kit
            const hex = theme.colors.textSecondary.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          },
          style: {
            borderRadius: 12,
          },
          propsForDots: {
            r: "2",
            strokeWidth: "0",
            stroke: chartColor,
          },
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: theme.colors.border,
            strokeWidth: 1,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 12,
        }}
        formatYLabel={(yValue: string) => defaultFormatValue(Number(yValue))}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={height}
        withDots={false}
        withShadow={false}
        withVerticalLines={false}
        withHorizontalLines={!showXAxis}
        withInnerLines={false}
        withOuterLines={false}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => {
            // Convert hex color to rgba for react-native-chart-kit
            const hex = chartColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          },
          labelColor: (opacity = 1) => {
            // Convert hex color to rgba for react-native-chart-kit
            const hex = theme.colors.textSecondary.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          },
          style: {
            borderRadius: 12,
          },
          propsForDots: {
            r: "2",
            strokeWidth: "0",
            stroke: chartColor,
          },
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: theme.colors.border,
            strokeWidth: 1,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 12,
        }}
        formatYLabel={(yValue: string) => defaultFormatValue(Number(yValue))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 12,
    textAlign: "center",
  },
});
