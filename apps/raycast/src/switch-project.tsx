/**
 * Switch Convex Project Command
 *
 * Allows users to switch between their Convex projects and deployments.
 * This is the foundational command that sets the active deployment for other commands.
 */

import {
  Action,
  ActionPanel,
  Icon,
  List,
  showToast,
  Toast,
  openExtensionPreferences,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { useConvexAuth } from "./hooks/useConvexAuth";
import { useAuthenticatedListGuard } from "./components/AuthenticatedListGuard";
import {
  useTeams,
  useProjects,
  useDeployments,
  useProfile,
} from "./hooks/useConvexData";
import type { Team, Project, Deployment } from "./hooks/useConvexData";

type ViewState = "teams" | "projects" | "deployments";

export default function SwitchProjectCommand() {
  const { session, logout, selectedContext, setSelectedContext } =
    useConvexAuth();

  const [viewState, setViewState] = useState<ViewState>("teams");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const accessToken = session?.accessToken ?? null;

  const { data: profile } = useProfile(accessToken);
  const { data: teams, isLoading: teamsLoading } = useTeams(accessToken);
  const { data: projects, isLoading: projectsLoading } = useProjects(
    accessToken,
    selectedTeam?.id ?? null,
  );
  const { data: deployments, isLoading: deploymentsLoading } = useDeployments(
    accessToken,
    selectedProject?.id ?? null,
  );

  // Restore selection from context
  useEffect(() => {
    if (teams && selectedContext.teamId) {
      const team = teams.find((t) => t.id === selectedContext.teamId);
      if (team) {
        setSelectedTeam(team);
        setViewState("projects");
      }
    }
  }, [teams, selectedContext.teamId]);

  useEffect(() => {
    if (projects && selectedContext.projectId) {
      const project = projects.find((p) => p.id === selectedContext.projectId);
      if (project) {
        setSelectedProject(project);
        setViewState("deployments");
      }
    }
  }, [projects, selectedContext.projectId]);

  // Handle authentication
  const authGuard = useAuthenticatedListGuard(
    "Connect your Convex account to manage your projects",
  );
  if (authGuard) return authGuard;

  // Loading state
  const isLoading =
    viewState === "teams"
      ? teamsLoading
      : viewState === "projects"
        ? projectsLoading
        : deploymentsLoading;

  // Handle team selection
  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setSelectedProject(null);
    setViewState("projects");
    setSelectedContext({
      teamId: team.id,
      projectId: null,
      deploymentName: null,
    });
  };

  // Handle project selection
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setViewState("deployments");
    setSelectedContext({
      teamId: selectedTeam?.id ?? selectedContext.teamId,
      projectId: project.id,
      deploymentName: null,
    });
  };

  // Handle deployment selection
  const handleSelectDeployment = async (deployment: Deployment) => {
    await setSelectedContext({ deploymentName: deployment.name });
    await showToast({
      style: Toast.Style.Success,
      title: "Deployment Selected",
      message: `${selectedProject?.name} / ${deployment.deploymentType}`,
    });
  };

  // Handle going back
  const handleGoBack = () => {
    if (viewState === "deployments") {
      setSelectedProject(null);
      setViewState("projects");
    } else if (viewState === "projects") {
      setSelectedTeam(null);
      setViewState("teams");
    }
  };

  // Navigation title
  const navigationTitle =
    viewState === "teams"
      ? "Select Team"
      : viewState === "projects"
        ? `${selectedTeam?.name} - Projects`
        : `${selectedProject?.name} - Deployments`;

  // Current selection subtitle
  const currentSelection = selectedContext.deploymentName
    ? `Current: ${selectedContext.deploymentName}`
    : "No deployment selected";

  return (
    <List
      isLoading={isLoading}
      navigationTitle={navigationTitle}
      searchBarPlaceholder={
        viewState === "teams"
          ? "Search teams..."
          : viewState === "projects"
            ? "Search projects..."
            : "Search deployments..."
      }
    >
      {/* Show current selection */}
      {selectedContext.deploymentName && viewState === "teams" && (
        <List.Section title="Current Selection">
          <List.Item
            title={selectedContext.deploymentName}
            subtitle={currentSelection}
            icon={Icon.CheckCircle}
            accessories={[{ text: "Active" }]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title="Sign Out"
                    icon={Icon.Logout}
                    style={Action.Style.Destructive}
                    onAction={async () => {
                      await logout();
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Signed out",
                      });
                    }}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        </List.Section>
      )}

      {/* Account section - always visible in teams view */}
      {viewState === "teams" && (
        <List.Section title="Account">
          <List.Item
            title={profile?.email ?? "Signed in"}
            subtitle={profile?.name}
            icon={Icon.Person}
            accessories={[{ text: "Sign Out", icon: Icon.Logout }]}
            actions={
              <ActionPanel>
                <Action
                  title="Sign Out"
                  icon={Icon.Logout}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    await logout();
                    await showToast({
                      style: Toast.Style.Success,
                      title: "Signed out",
                    });
                  }}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}

      {/* Teams view */}
      {viewState === "teams" && teams && (
        <List.Section title="Your Teams">
          {teams.map((team) => (
            <List.Item
              key={team.id}
              title={team.name}
              subtitle={team.slug}
              icon={Icon.TwoPeople}
              accessories={[
                team.id === selectedContext.teamId ? { icon: Icon.Check } : {},
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Select Team"
                    icon={Icon.ArrowRight}
                    onAction={() => handleSelectTeam(team)}
                  />
                  <ActionPanel.Section>
                    <Action
                      title="Sign Out"
                      icon={Icon.XMarkCircle}
                      onAction={logout}
                    />
                    <Action
                      title="Preferences"
                      icon={Icon.Gear}
                      onAction={openExtensionPreferences}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {/* Projects view */}
      {viewState === "projects" && (
        <>
          {/* Back navigation item */}
          <List.Section title="Navigation">
            <List.Item
              title="Back to Teams"
              subtitle={`Currently in: ${selectedTeam?.name}`}
              icon={Icon.ArrowLeft}
              actions={
                <ActionPanel>
                  <Action
                    title="Go Back to Teams"
                    icon={Icon.ArrowLeft}
                    onAction={handleGoBack}
                  />
                </ActionPanel>
              }
            />
          </List.Section>

          {projects && projects.length > 0 && (
            <List.Section title={`Projects in ${selectedTeam?.name}`}>
              {projects.map((project) => (
                <List.Item
                  key={project.id}
                  title={project.name}
                  subtitle={project.slug}
                  icon={Icon.Box}
                  accessories={[
                    project.id === selectedContext.projectId
                      ? { icon: Icon.Check }
                      : {},
                  ]}
                  actions={
                    <ActionPanel>
                      <Action
                        title="Select Project"
                        icon={Icon.ArrowRight}
                        onAction={() => handleSelectProject(project)}
                      />
                      <Action
                        title="Go Back to Teams"
                        icon={Icon.ArrowLeft}
                        onAction={handleGoBack}
                        shortcut={{ modifiers: ["cmd"], key: "[" }}
                      />
                      <ActionPanel.Section>
                        <Action
                          title="Sign Out"
                          icon={Icon.XMarkCircle}
                          onAction={logout}
                        />
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}
        </>
      )}

      {/* Deployments view */}
      {viewState === "deployments" && (
        <>
          {/* Back navigation item */}
          <List.Section title="Navigation">
            <List.Item
              title="Back to Projects"
              subtitle={`Currently in: ${selectedTeam?.name} / ${selectedProject?.name}`}
              icon={Icon.ArrowLeft}
              actions={
                <ActionPanel>
                  <Action
                    title="Go Back to Projects"
                    icon={Icon.ArrowLeft}
                    onAction={handleGoBack}
                  />
                  <Action
                    title="Go Back to Teams"
                    icon={Icon.ArrowLeftCircle}
                    onAction={() => {
                      setSelectedProject(null);
                      setSelectedTeam(null);
                      setViewState("teams");
                    }}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "[" }}
                  />
                </ActionPanel>
              }
            />
          </List.Section>

          {deployments && deployments.length > 0 && (
            <List.Section title={`Deployments for ${selectedProject?.name}`}>
              {deployments.map((deployment) => (
                <List.Item
                  key={deployment.id}
                  title={
                    deployment.deploymentType === "prod"
                      ? "Production"
                      : deployment.deploymentType === "dev"
                        ? "Development"
                        : "Preview"
                  }
                  subtitle={deployment.name}
                  icon={
                    deployment.deploymentType === "prod"
                      ? Icon.Globe
                      : deployment.deploymentType === "dev"
                        ? Icon.Code
                        : Icon.Eye
                  }
                  accessories={[
                    deployment.name === selectedContext.deploymentName
                      ? { icon: Icon.Check, text: "Active" }
                      : {},
                  ]}
                  actions={
                    <ActionPanel>
                      <Action
                        title="Select Deployment"
                        icon={Icon.CheckCircle}
                        onAction={() => handleSelectDeployment(deployment)}
                      />
                      <Action
                        title="Go Back to Projects"
                        icon={Icon.ArrowLeft}
                        onAction={handleGoBack}
                        shortcut={{ modifiers: ["cmd"], key: "[" }}
                      />
                      <ActionPanel.Section>
                        <Action.OpenInBrowser
                          title="Open in Dashboard"
                          url={`https://dashboard.convex.dev/t/${selectedTeam?.slug}/${selectedProject?.slug}/${deployment.deploymentType}`}
                        />
                      </ActionPanel.Section>
                      <ActionPanel.Section>
                        <Action
                          title="Sign Out"
                          icon={Icon.XMarkCircle}
                          onAction={logout}
                        />
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}
        </>
      )}

      {/* Empty states */}
      {viewState === "teams" && teams?.length === 0 && (
        <List.EmptyView
          title="No Teams Found"
          description="You don't have access to any Convex teams"
          icon={Icon.TwoPeople}
        />
      )}

      {viewState === "projects" && projects?.length === 0 && (
        <List.EmptyView
          title="No Projects Found"
          description={`No projects in ${selectedTeam?.name}`}
          icon={Icon.Box}
          actions={
            <ActionPanel>
              <Action
                title="Go Back"
                icon={Icon.ArrowLeft}
                onAction={handleGoBack}
              />
            </ActionPanel>
          }
        />
      )}

      {viewState === "deployments" && deployments?.length === 0 && (
        <List.EmptyView
          title="No Deployments Found"
          description={`No deployments for ${selectedProject?.name}`}
          icon={Icon.Cloud}
          actions={
            <ActionPanel>
              <Action
                title="Go Back"
                icon={Icon.ArrowLeft}
                onAction={handleGoBack}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
