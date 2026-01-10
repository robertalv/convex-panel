/**
 * Deployment Selector Bottom Sheet
 *
 * Bottom sheet component for selecting team, project, and deployment
 */

import React, { useCallback, useMemo } from "react";
import {
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from "react-native-svg";
import { Icon } from "./ui/Icon";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useTeams, useProjects, useDeployments } from "../hooks/useBigBrain";
import type { Team, Project, Deployment } from "../types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DeploymentSelectorSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  onClose?: () => void;
}

type SelectionStep = "team" | "project" | "deployment";

export function DeploymentSelectorSheet({
  sheetRef,
  onClose,
}: DeploymentSelectorSheetProps) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const { team, project, deployment, setTeam, setProject, setDeployment } =
    useDeployment();
  const [currentStep, setCurrentStep] = React.useState<SelectionStep>("team");
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(
    team?.id ?? null,
  );
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    number | null
  >(project?.id ?? null);

  const accessToken = session?.accessToken ?? null;

  // Fetch data based on current selection
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useTeams(accessToken);
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useProjects(accessToken, selectedTeamId);
  const {
    data: deployments = [],
    isLoading: isLoadingDeployments,
    error: deploymentsError,
  } = useDeployments(accessToken, selectedProjectId);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ["75%", "90%"], []);

  // Handle backdrop press
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  // Reset step when sheet closes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setCurrentStep("team");
        setSelectedTeamId(team?.id ?? null);
        setSelectedProjectId(project?.id ?? null);
        onClose?.();
      }
    },
    [team, project, onClose],
  );

  // Handle team selection
  const handleSelectTeam = useCallback(
    (selectedTeam: Team) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedTeamId(selectedTeam.id);
      setSelectedProjectId(null);
      setTeam(selectedTeam);
      setCurrentStep("project");
    },
    [setTeam],
  );

  // Handle project selection
  const handleSelectProject = useCallback(
    (selectedProject: Project) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedProjectId(selectedProject.id);
      setProject(selectedProject);
      setCurrentStep("deployment");
    },
    [setProject],
  );

  // Handle deployment selection
  const handleSelectDeployment = useCallback(
    (selectedDeployment: Deployment) => {
      setDeployment(selectedDeployment);
      sheetRef.current?.close();
    },
    [setDeployment, sheetRef],
  );

  // Color schemes matching dashboard Avatar component
  const colorSchemes = [
    ["hsl(255, 60%, 36%)", "hsl(37, 35.7%, 55.5%)", "hsl(346, 100%, 85%)", "hsl(42, 97%, 54%)"],
    ["hsl(3, 100%, 32%)", "hsl(42, 100%, 80%)", "hsl(29, 89%, 54%)", "hsl(0, 0%, 36%)"],
    ["hsl(270, 13%, 27%)", "hsl(220, 56%, 78%)", "hsl(316, 59%, 77%)", "hsl(260, 60%, 51%)"],
    ["hsl(220, 14%, 45%)", "hsl(120, 22%, 62%)", "hsl(6, 100%, 74%)", "hsl(312, 33%, 71%)"],
    ["hsl(220, 14%, 45%)", "hsl(262, 87%, 74%)", "hsl(240, 70%, 42%)", "hsl(210, 66%, 84%)"],
    ["hsl(6, 100%, 74%)", "hsl(40, 80%, 75%)", "hsl(316, 59%, 65%)", "hsl(42, 100%, 80%)"],
  ];

  // Helper to hash a string (matching dashboard implementation)
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  // Helper to convert HSL to RGB for React Native
  const hslToRgb = (h: number, s: number, l: number): string => {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Parse HSL string and convert to RGB
  const parseHslToRgb = (hsl: string): string => {
    const match = hsl.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
    if (!match) return "#000000";
    const h = parseInt(match[1], 10);
    const s = parseFloat(match[2]);
    const l = parseFloat(match[3]);
    return hslToRgb(h, s, l);
  };

  // Get deployment icon name based on type and kind (matching dashboard)
  const getDeploymentIcon = (deployment: Deployment): string => {
    if (deployment.deploymentType === "dev") {
      // Local dev uses code/terminal icon, cloud dev uses globe
      return deployment.kind === "local" ? "code" : "globe";
    } else if (deployment.deploymentType === "prod") {
      return "signal";
    } else if (deployment.deploymentType === "preview") {
      return "pencil";
    }
    return "code";
  };

  // Get deployment colors based on type (matching dashboard)
  const getDeploymentColors = (deploymentType: Deployment["deploymentType"]) => {
    switch (deploymentType) {
      case "prod":
        return {
          backgroundColor: theme.dark ? "rgba(147, 51, 234, 0.3)" : "rgba(147, 51, 234, 0.1)", // purple-100 / purple-700
          borderColor: theme.dark ? "rgba(243, 232, 255, 1)" : "rgba(147, 51, 234, 1)", // purple-600
          textColor: theme.dark ? "rgba(243, 232, 255, 1)" : "rgba(147, 51, 234, 1)", // purple-600
          iconColor: theme.dark ? "rgba(243, 232, 255, 1)" : "rgba(147, 51, 234, 1)", // purple-600
        };
      case "preview":
        return {
          backgroundColor: theme.dark ? "rgba(154, 52, 18, 0.3)" : "rgba(254, 243, 199, 0.5)", // orange-900 / orange-100
          borderColor: theme.dark ? "rgba(251, 146, 60, 1)" : "rgba(234, 88, 12, 1)", // orange-600
          textColor: theme.dark ? "rgba(251, 146, 60, 1)" : "rgba(234, 88, 12, 1)", // orange-600
          iconColor: theme.dark ? "rgba(251, 146, 60, 1)" : "rgba(234, 88, 12, 1)", // orange-600
        };
      case "dev":
        return {
          backgroundColor: theme.dark ? "rgba(20, 83, 45, 0.3)" : "rgba(220, 252, 231, 0.5)", // green-900 / green-100
          borderColor: theme.dark ? "rgba(134, 239, 172, 1)" : "rgba(22, 163, 74, 1)", // green-600
          textColor: theme.dark ? "rgba(134, 239, 172, 1)" : "rgba(22, 163, 74, 1)", // green-600
          iconColor: theme.dark ? "rgba(134, 239, 172, 1)" : "rgba(22, 163, 74, 1)", // green-600
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          textColor: theme.colors.text,
          iconColor: theme.colors.textSecondary,
        };
    }
  };

  const Avatar = ({ 
    name, 
    hashKey, 
    size = 32 
  }: { 
    name: string; 
    hashKey?: string | number;
    size?: number;
  }) => {
    // Use hashKey (team/project ID) if provided, otherwise fall back to name
    const key = hashKey !== undefined ? String(hashKey) : name;
    const hash = hashString(key);
    
    // Determine pattern and color scheme (matching dashboard logic)
    const patternIdx = hash % 4;
    const colorSchemeIdx = Math.floor(hash / 4) % colorSchemes.length;
    const baseColors = colorSchemes[colorSchemeIdx];
    const rotationDeg = hash % 360;

    // Get initial letters (2 letters if name has spaces, otherwise first 2 chars)
    const initial =
      name.split(" ").length > 1
        ? name.split(" ")[0][0] + name.split(" ")[1][0]
        : name.slice(0, 2).toUpperCase();

    // Convert HSL colors to RGB for React Native
    const colors = baseColors.map(parseHslToRgb);

    // Generate gradient definition based on pattern
    const gradientId = `gradient-${hash}`;
    let gradientElement: React.ReactElement;
    
    switch (patternIdx) {
      case 0: {
        // Linear gradient left to right
        const theta = (rotationDeg / 180) * Math.PI;
        const x1 = 0.5 - 0.5 * Math.cos(theta);
        const y1 = 0.5 - 0.5 * Math.sin(theta);
        const x2 = 0.5 + 0.5 * Math.cos(theta);
        const y2 = 0.5 + 0.5 * Math.sin(theta);
        gradientElement = (
          <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </LinearGradient>
        );
        break;
      }
      case 1: {
        // Linear gradient diagonal
        const theta = ((45 + rotationDeg) / 180) * Math.PI;
        const x1 = 0.5 - 0.5 * Math.cos(theta);
        const y1 = 0.5 - 0.5 * Math.sin(theta);
        const x2 = 0.5 + 0.5 * Math.cos(theta);
        const y2 = 0.5 + 0.5 * Math.sin(theta);
        gradientElement = (
          <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <Stop offset="0%" stopColor={colors[2]} />
            <Stop offset="100%" stopColor={colors[3]} />
          </LinearGradient>
        );
        break;
      }
      case 2: {
        // Diagonal multi-stop gradient
        const theta = ((135 + rotationDeg) / 180) * Math.PI;
        const x1 = 0.5 - 0.5 * Math.cos(theta);
        const y1 = 0.5 - 0.5 * Math.sin(theta);
        const x2 = 0.5 + 0.5 * Math.cos(theta);
        const y2 = 0.5 + 0.5 * Math.sin(theta);
        gradientElement = (
          <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <Stop offset="0%" stopColor={colors[2]} />
            <Stop offset="60%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </LinearGradient>
        );
        break;
      }
      case 3: {
        // Radial gradient
        const theta = (rotationDeg / 180) * Math.PI;
        const r = 0.3;
        const cx = 0.5 + r * Math.cos(theta);
        const cy = 0.5 + r * Math.sin(theta);
        gradientElement = (
          <RadialGradient id={gradientId} cx={cx} cy={cy} r="0.5">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="80%" stopColor={colors[1]} />
            <Stop offset="100%" stopColor={colors[2]} />
          </RadialGradient>
        );
        break;
      }
      default: {
        gradientElement = (
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors[0]} />
            <Stop offset="100%" stopColor={colors[1]} />
          </LinearGradient>
        );
      }
    }

    return (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          },
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            {gradientElement}
          </Defs>
          <Rect width={size} height={size} fill={`url(#${gradientId})`} />
        </Svg>
        {/* Overlay for contrast */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
          ]}
        />
        {/* Initial text */}
        <Text
          style={[
            styles.avatarText,
            {
              fontSize: size * 0.4,
              textShadowColor: "rgba(0, 0, 0, 0.5)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 3,
            },
          ]}
        >
          {initial}
        </Text>
      </View>
    );
  };

  // Render header with back button
  const renderHeader = () => {
    const canGoBack = currentStep !== "team";
    const title =
      currentStep === "team"
        ? "Teams"
        : currentStep === "project"
          ? "Projects"
          : "Deployments";

    return (
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            // Remove background/border for cleaner look or keep minimal
            borderBottomWidth: 0,
            paddingBottom: 4,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                if (currentStep === "deployment") {
                  setCurrentStep("project");
                } else if (currentStep === "project") {
                  setCurrentStep("team");
                  setSelectedTeamId(team?.id ?? null);
                  setSelectedProjectId(null);
                }
              }}
              style={styles.backButton}
            >
              <Icon
                name="chevron-back"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <View style={styles.headerRight} />
      </View>
    );
  };

  // Render team list
  const renderTeams = () => {
    if (isLoadingTeams) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (teams.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No teams found
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={teams}
        keyExtractor={(item: Team) => item.id.toString()}
        renderItem={({ item }: { item: Team }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectTeam(item)}
            activeOpacity={0.6}
          >
            <Avatar name={item.name} hashKey={item.id} />
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            {team?.id === item.id ? (
              <Icon
                name="checkmark-circle"
                size={20}
                color={theme.colors.primary}
              />
            ) : (
              <Icon
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  // Render project list
  const renderProjects = () => {
    if (isLoadingProjects) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (projects.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No projects found
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={projects}
        keyExtractor={(item: Project) => item.id.toString()}
        renderItem={({ item }: { item: Project }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectProject(item)}
            activeOpacity={0.6}
          >
            <Avatar name={item.name} hashKey={item.id} />
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Icon
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  // Render deployment list
  const renderDeployments = () => {
    if (isLoadingDeployments) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (deploymentsError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.error }]}>
            Error loading deployments
          </Text>
          <Text
            style={[styles.errorDetail, { color: theme.colors.textSecondary }]}
          >
            {deploymentsError instanceof Error
              ? deploymentsError.message
              : "Unknown error occurred"}
          </Text>
        </View>
      );
    }

    if (deployments.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No deployments found
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={deployments}
        keyExtractor={(item: Deployment) => item.id.toString()}
        renderItem={({ item }: { item: Deployment }) => {
          const colors = getDeploymentColors(item.deploymentType);
          const iconName = getDeploymentIcon(item);
          
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelectDeployment(item)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.deploymentIcon,
                  {
                    backgroundColor: colors.backgroundColor,
                    borderWidth: 1,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Icon
                  name={iconName}
                  size={18}
                  color={colors.iconColor}
                />
              </View>
              <View style={styles.deploymentInfo}>
                <Text style={[styles.itemTitle, { color: colors.textColor }]}>
                  {item.name}
                </Text>
                <View style={styles.deploymentMeta}>
                  <Text
                    style={{
                      color: colors.textColor,
                      fontSize: 12,
                      marginRight: 6,
                      opacity: 0.8,
                    }}
                  >
                    {item.deploymentType.toUpperCase()}
                  </Text>
                </View>
              </View>
              {deployment?.id === item.id && (
                <Icon name="checkmark" size={20} color={colors.iconColor} />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case "team":
        return renderTeams();
      case "project":
        return renderProjects();
      case "deployment":
        return renderDeployments();
      default:
        return null;
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      <BottomSheetView style={styles.container}>
        {renderHeader()}
        <View
          style={[styles.content, { backgroundColor: theme.colors.background }]}
        >
          {renderContent()}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
  },
  deploymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  deploymentInfo: {
    flex: 1,
  },
  deploymentMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  errorDetail: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
