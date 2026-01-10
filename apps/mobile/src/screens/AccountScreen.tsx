/**
 * Account Screen
 * 
 * Account management screen with user info and logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';

// Type assertions to fix React 18/19 types compatibility
const SafeAreaViewTyped = SafeAreaView as any;
const ScrollViewTyped = ScrollView as any;
const ViewTyped = View as any;
const TextTyped = Text as any;
const TouchableOpacityTyped = TouchableOpacity as any;
const TextInputTyped = TextInput as any;
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDeployment } from '../contexts/DeploymentContext';
import {
  useProfile,
  useProfileEmails,
  useIdentities,
  useUpdateProfileName,
} from '../hooks/useBigBrain';

export default function AccountScreen() {
  const { theme } = useTheme();
  const { session, logout } = useAuth();
  const { clearSelection } = useDeployment();
  const accessToken = session?.accessToken ?? null;

  const { data: profile, isLoading: isLoadingProfile } = useProfile(accessToken);
  const { data: emails, isLoading: isLoadingEmails } = useProfileEmails(accessToken);
  const { data: identities, isLoading: isLoadingIdentities } = useIdentities(accessToken);
  const updateProfileName = useUpdateProfileName(accessToken);

  const [name, setName] = useState(profile?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Update name when profile loads
  React.useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleSaveName = async () => {
    if (!name || name === profile?.name || name.length > 128) return;
    
    setIsSavingName(true);
    try {
      await updateProfileName.mutateAsync(name);
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              clearSelection();
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const isLoading = isLoadingProfile || isLoadingEmails || isLoadingIdentities;

  return (
    <SafeAreaViewTyped style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollViewTyped
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Profile Information Section */}
        <ViewTyped style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <TextTyped style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Profile information
          </TextTyped>
          
          <ViewTyped style={styles.nameSection}>
            <TextTyped style={[styles.label, { color: theme.colors.textSecondary }]}>
              Name
            </TextTyped>
            <ViewTyped style={styles.nameInputContainer}>
              <TextInputTyped
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={128}
              />
              <TouchableOpacityTyped
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity:
                      name === profile?.name || !name || name.length > 128 || isSavingName
                        ? 0.5
                        : 1,
                  },
                ]}
                onPress={handleSaveName}
                disabled={
                  name === profile?.name || !name || name.length > 128 || isSavingName
                }
                activeOpacity={0.7}
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <TextTyped style={styles.saveButtonText}>Save</TextTyped>
                )}
              </TouchableOpacityTyped>
            </ViewTyped>
            {name && name.length > 128 && (
              <TextTyped style={[styles.errorText, { color: theme.colors.error }]}>
                Name must be at most 128 characters long.
              </TextTyped>
            )}
          </ViewTyped>
        </ViewTyped>

        {/* Emails Section */}
        <ViewTyped style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <TextTyped style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Emails
          </TextTyped>
          <TextTyped style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            The emails associated with your account are used to accept team invitations. Account-related communications will be sent to your primary email.
          </TextTyped>
          {isLoadingEmails ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
          ) : emails && emails.length > 0 ? (
            <ViewTyped style={styles.listContainer}>
              {emails
                .sort((a: any, b: any) => {
                  if (a.isPrimary) return -1;
                  if (b.isPrimary) return 1;
                  if (a.isVerified && !b.isVerified) return -1;
                  if (!a.isVerified && b.isVerified) return 1;
                  return 0;
                })
                .map((email: any) => (
                  <ViewTyped
                    key={email.id}
                    style={[
                      styles.listItem,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    ]}
                  >
                    <ViewTyped style={styles.listItemContent}>
                      <TextTyped style={[styles.listItemText, { color: theme.colors.text }]}>
                        {email.email}
                      </TextTyped>
                      <ViewTyped style={styles.badges}>
                        {email.isPrimary && (
                          <ViewTyped
                            style={[
                              styles.badge,
                              { backgroundColor: theme.colors.primary + '20' },
                            ]}
                          >
                            <TextTyped
                              style={[styles.badgeText, { color: theme.colors.primary }]}
                            >
                              Primary
                            </TextTyped>
                          </ViewTyped>
                        )}
                        {email.isVerified ? (
                          <ViewTyped
                            style={[
                              styles.badge,
                              { backgroundColor: theme.colors.success + '20' },
                            ]}
                          >
                            <TextTyped
                              style={[styles.badgeText, { color: theme.colors.success }]}
                            >
                              Verified
                            </TextTyped>
                          </ViewTyped>
                        ) : (
                          <ViewTyped
                            style={[
                              styles.badge,
                              { backgroundColor: theme.colors.warning + '20' },
                            ]}
                          >
                            <TextTyped
                              style={[styles.badgeText, { color: theme.colors.warning }]}
                            >
                              Unverified
                            </TextTyped>
                          </ViewTyped>
                        )}
                      </ViewTyped>
                    </ViewTyped>
                  </ViewTyped>
                ))}
            </ViewTyped>
          ) : (
            <TextTyped style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No emails found
            </TextTyped>
          )}
        </ViewTyped>

        {/* Identities Section */}
        <ViewTyped style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <TextTyped style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Identities
          </TextTyped>
          <TextTyped style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            These are the identities associated with your account. Identities are used to login to Convex, and are distinct from the emails connected to your account for communication purposes.
          </TextTyped>
          {isLoadingIdentities ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
          ) : identities && identities.length > 0 ? (
            <ViewTyped style={styles.listContainer}>
              {identities.map((identity: any) => (
                <ViewTyped
                  key={identity.id}
                  style={[
                    styles.listItem,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                  ]}
                >
                  <ViewTyped style={styles.listItemContent}>
                    <ViewTyped style={styles.identityInfo}>
                      <TextTyped style={[styles.listItemText, { color: theme.colors.text }]}>
                        {identity.email || identity.id}
                      </TextTyped>
                      <ViewTyped style={styles.providersContainer}>
                        {identity.providers?.map((provider: string) => (
                          <ViewTyped
                            key={provider}
                            style={[
                              styles.providerBadge,
                              { backgroundColor: theme.colors.background },
                              { borderColor: theme.colors.border },
                            ]}
                          >
                            <TextTyped
                              style={[styles.providerText, { color: theme.colors.textSecondary }]}
                            >
                              {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </TextTyped>
                          </ViewTyped>
                        ))}
                      </ViewTyped>
                    </ViewTyped>
                  </ViewTyped>
                </ViewTyped>
              ))}
            </ViewTyped>
          ) : (
            <TextTyped style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No identities found
            </TextTyped>
          )}
        </ViewTyped>

        {/* Sign Out Section */}
        <ViewTyped style={styles.actionsSection}>
          <TouchableOpacityTyped
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.error,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <TextTyped style={[styles.logoutButtonText, { color: '#ffffff' }]}>
              Sign Out
            </TextTyped>
          </TouchableOpacityTyped>
        </ViewTyped>
      </ScrollViewTyped>
    </SafeAreaViewTyped>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  nameSection: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  nameInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  identityInfo: {
    flex: 1,
  },
  providersContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  providerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  loader: {
    paddingVertical: 16,
  },
  actionsSection: {
    marginTop: 8,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

