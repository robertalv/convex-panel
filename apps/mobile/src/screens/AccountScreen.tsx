import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
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
    <SafeAreaView 
      edges={[]}
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Profile Information Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Profile information
          </Text>
          
          <View style={styles.nameSection}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Name
            </Text>
            <View style={styles.nameInputContainer}>
              <TextInput
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
              <TouchableOpacity
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
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            {name && name.length > 128 && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Name must be at most 128 characters long.
              </Text>
            )}
          </View>
        </View>

        {/* Emails Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Emails
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            The emails associated with your account are used to accept team invitations. Account-related communications will be sent to your primary email.
          </Text>
          {isLoadingEmails ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
          ) : emails && emails.length > 0 ? (
            <View style={styles.listContainer}>
              {emails
                .sort((a: any, b: any) => {
                  if (a.isPrimary) return -1;
                  if (b.isPrimary) return 1;
                  if (a.isVerified && !b.isVerified) return -1;
                  if (!a.isVerified && b.isVerified) return 1;
                  return 0;
                })
                .map((email: any) => (
                  <View
                    key={email.id}
                    style={[
                      styles.listItem,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    ]}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={[styles.listItemText, { color: theme.colors.text }]}>
                        {email.email}
                      </Text>
                      <View style={styles.badges}>
                        {email.isPrimary && (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: theme.colors.primary + '20' },
                            ]}
                          >
                            <Text
                              style={[styles.badgeText, { color: theme.colors.primary }]}
                            >
                              Primary
                            </Text>
                          </View>
                        )}
                        {email.isVerified ? (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: theme.colors.success + '20' },
                            ]}
                          >
                            <Text
                              style={[styles.badgeText, { color: theme.colors.success }]}
                            >
                              Verified
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: theme.colors.warning + '20' },
                            ]}
                          >
                            <Text
                              style={[styles.badgeText, { color: theme.colors.warning }]}
                            >
                              Unverified
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No emails found
            </Text>
          )}
        </View>

        {/* Identities Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Identities
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            These are the identities associated with your account. Identities are used to login to Convex, and are distinct from the emails connected to your account for communication purposes.
          </Text>
          {isLoadingIdentities ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
          ) : identities && identities.length > 0 ? (
            <View style={styles.listContainer}>
              {identities.map((identity: any) => (
                <View
                  key={identity.id}
                  style={[
                    styles.listItem,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                  ]}
                >
                  <View style={styles.listItemContent}>
                    <View style={styles.identityInfo}>
                      <Text style={[styles.listItemText, { color: theme.colors.text }]}>
                        {identity.email || identity.id}
                      </Text>
                      <View style={styles.providersContainer}>
                        {identity.providers?.map((provider: string) => (
                          <View
                            key={provider}
                            style={[
                              styles.providerBadge,
                              { backgroundColor: theme.colors.background },
                              { borderColor: theme.colors.border },
                            ]}
                          >
                            <Text
                              style={[styles.providerText, { color: theme.colors.textSecondary }]}
                            >
                              {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No identities found
            </Text>
          )}
        </View>

        {/* Sign Out Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.error,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.logoutButtonText, { color: '#ffffff' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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

