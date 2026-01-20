import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useDeployment } from "../../../contexts/deployment-context";
import {
  updateProfileName,
  getProfile,
  getProfileEmails,
  getIdentities,
  unlinkIdentity,
  getDiscordAccounts,
  unlinkDiscordAccount,
  type ProfileEmail,
  type Identity,
  type DiscordAccount,
} from "@convex-panel/shared/api";
import { useProfileCache } from "../hooks/useProfileCache";
import { ConfirmDialog } from "../../data/components/ConfirmDialog";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export interface ProfileSettingsProps {
  user: {
    name: string;
    email: string;
    profilePictureUrl?: string | null;
  } | null;
}

// ============================================================================
// Section Container Component
// ============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-4 rounded-xl border border-border-base bg-surface-raised p-4">
      <h3 className="m-0 mb-3 text-sm font-semibold text-text-base">{title}</h3>
      {children}
    </div>
  );
}

// ============================================================================
// Profile Name Form Component
// ============================================================================

interface ProfileNameFormProps {
  currentName: string;
  onSave: (name: string) => Promise<void>;
}

function ProfileNameForm({ currentName, onSave }: ProfileNameFormProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when currentName prop changes
  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name === currentName) return;

    if (name.length > 128) {
      setError("Name must be at most 128 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <label
            htmlFor="profile-name"
            className="mb-1 block text-xs font-medium text-text-muted"
          >
            Name
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!error}
            className="w-full"
          />
          {error && <p className="m-0 mt-1 text-xs text-error-base">{error}</p>}
        </div>
        <Button
          type="submit"
          disabled={name === currentName || name.length > 128 || isLoading}
          className="mt-5"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Save"}
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// Emails Section Component
// ============================================================================

interface EmailsSectionProps {
  emails: ProfileEmail[];
  isLoading: boolean;
}

function EmailsSection({ emails, isLoading }: EmailsSectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <Loader2 size={14} className="animate-spin" />
        <span>Loading emails...</span>
      </div>
    );
  }

  const sortedEmails = [...emails].sort((a, b) => {
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return 0;
  });

  return (
    <div>
      <p className="m-0 mb-3 text-xs text-text-muted">
        Your emails are used for team invitations and communications.
      </p>

      <div className="flex flex-col gap-2">
        {sortedEmails.map((email) => (
          <div
            key={email.email}
            className="flex items-center justify-between rounded-lg border border-border-base bg-surface-base px-3 py-2"
          >
            <span className="text-[13px] text-text-base">{email.email}</span>
            <div className="flex gap-2">
              {email.primary && (
                <span className="rounded bg-brand-base/10 px-2 py-0.5 text-[11px] font-medium text-brand-base">
                  Primary
                </span>
              )}
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  email.verified
                    ? "bg-success-base/10 text-success-base"
                    : "bg-warning-base/10 text-warning-base"
                }`}
              >
                {email.verified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <a
        href="https://dashboard.convex.dev/profile"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-brand-base no-underline hover:underline"
      >
        Manage emails on dashboard
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

// ============================================================================
// Connected Identities Section Component
// ============================================================================

interface ConnectedIdentitiesSectionProps {
  identities: Identity[];
  isLoading: boolean;
  onUnlink: (provider: "google" | "github" | "vercel") => Promise<void>;
}

const PROVIDER_INFO: Record<string, { name: string; color: string }> = {
  google: { name: "Google", color: "#4285f4" },
  github: { name: "GitHub", color: "#333" },
  vercel: { name: "Vercel", color: "#000" },
};

function getProviderInfo(provider: string | undefined | null): {
  name: string;
  color: string;
} {
  if (!provider) {
    return { name: "Unknown", color: "#666" };
  }
  return (
    PROVIDER_INFO[provider] || {
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      color: "#666",
    }
  );
}

// Flatten identities into individual provider entries for display
interface ProviderEntry {
  provider: "google" | "github" | "vercel";
  email?: string | null;
  identityId: string;
}

function ConnectedIdentitiesSection({
  identities,
  isLoading,
  onUnlink,
}: ConnectedIdentitiesSectionProps) {
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(
    null,
  );
  const [confirmUnlink, setConfirmUnlink] = useState<ProviderEntry | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <Loader2 size={14} className="animate-spin" />
        <span>Loading identities...</span>
      </div>
    );
  }

  // Flatten identities - each identity can have multiple providers
  const providerEntries: ProviderEntry[] = [];
  if (Array.isArray(identities)) {
    for (const identity of identities) {
      if (identity && Array.isArray(identity.providers)) {
        for (const provider of identity.providers) {
          providerEntries.push({
            provider,
            email: identity.email,
            identityId: identity.id,
          });
        }
      }
    }
  }

  if (providerEntries.length === 0) {
    return (
      <p className="m-0 text-xs text-text-muted">
        No connected identities found.
      </p>
    );
  }

  const handleUnlink = async () => {
    if (!confirmUnlink) return;

    setUnlinkingProvider(confirmUnlink.provider);
    try {
      await onUnlink(confirmUnlink.provider);
    } finally {
      setUnlinkingProvider(null);
      setConfirmUnlink(null);
    }
  };

  // Can only unlink if there's more than one provider
  const canUnlink = providerEntries.length > 1;

  return (
    <div>
      <p className="m-0 mb-3 text-xs text-text-muted">
        Connected accounts allow you to sign in with different providers.
      </p>

      <div className="flex flex-col gap-2">
        {providerEntries.map((entry) => {
          const info = getProviderInfo(entry.provider);
          return (
            <div
              key={`${entry.identityId}-${entry.provider}`}
              className="flex items-center justify-between rounded-lg border border-border-base bg-surface-base px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: info.color }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold text-white"
                >
                  {info.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-text-base">
                    {info.name}
                  </div>
                  {entry.email && (
                    <div className="text-[11px] text-text-muted">
                      {entry.email}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!canUnlink || unlinkingProvider === entry.provider}
                onClick={() => setConfirmUnlink(entry)}
                title={
                  !canUnlink
                    ? "Cannot unlink last identity"
                    : `Unlink ${info.name}`
                }
              >
                {unlinkingProvider === entry.provider ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Unlink"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {confirmUnlink && confirmUnlink.provider && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmUnlink(null)}
          onConfirm={handleUnlink}
          title={`Unlink ${getProviderInfo(confirmUnlink.provider).name}?`}
          message={
            <>
              <p>
                After unlinking, you will be logged out and will need to sign in
                with a different provider.
              </p>
              <p style={{ marginTop: "8px" }}>
                To prevent re-login with this provider, you should also delete
                the associated email from your profile.
              </p>
            </>
          }
          confirmLabel="Unlink"
          variant="warning"
          isLoading={unlinkingProvider === confirmUnlink.provider}
        />
      )}
    </div>
  );
}

// ============================================================================
// Discord Accounts Section Component
// ============================================================================

interface DiscordAccountsSectionProps {
  accounts: DiscordAccount[];
  isLoading: boolean;
  onUnlink: (discordUserId: string) => Promise<void>;
}

function DiscordAccountsSection({
  accounts,
  isLoading,
  onUnlink,
}: DiscordAccountsSectionProps) {
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Ensure accounts is an array and filter out invalid entries
  const validAccounts = Array.isArray(accounts)
    ? accounts.filter((a) => a && a.id)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <Loader2 size={14} className="animate-spin" />
        <span>Loading Discord accounts...</span>
      </div>
    );
  }

  if (validAccounts.length === 0) {
    return (
      <div>
        <p className="m-0 mb-3 text-xs text-text-muted">
          Link your Discord account to access the Convex community features.
        </p>
        <a
          href="https://discord.gg/convex"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-base no-underline hover:underline"
        >
          Join Convex Discord
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  const handleUnlink = async (discordUserId: string) => {
    setUnlinkingId(discordUserId);
    try {
      await onUnlink(discordUserId);
    } finally {
      setUnlinkingId(null);
    }
  };

  const getDiscordDisplayName = (account: DiscordAccount) => {
    const details = account.details;
    // Prefer global_name (display name), fall back to username with discriminator
    if (details.global_name) {
      return details.global_name;
    }
    // Handle both old discriminator system and new username system
    if (details.discriminator && details.discriminator !== "0") {
      return `${details.username}#${details.discriminator}`;
    }
    return details.username;
  };

  const getDiscordAvatarUrl = (account: DiscordAccount) => {
    const details = account.details;
    if (details.avatar) {
      return `https://cdn.discordapp.com/avatars/${account.id}/${details.avatar}.png?size=64`;
    }
    // Default Discord avatar
    const defaultIndex = parseInt(account.id) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  };

  return (
    <div>
      <p className="m-0 mb-3 text-xs text-text-muted">
        Your linked Discord accounts for the Convex community.
      </p>

      <div className="flex flex-col gap-2">
        {validAccounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between rounded-lg border border-border-base bg-surface-base px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={getDiscordAvatarUrl(account)}
                alt={account.details.username}
                className="h-7 w-7 rounded-full"
              />
              <span className="text-[13px] font-medium text-text-base">
                {getDiscordDisplayName(account)}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={unlinkingId === account.id}
              onClick={() => handleUnlink(account.id)}
            >
              {unlinkingId === account.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Unlink"
              )}
            </Button>
          </div>
        ))}
      </div>

      <a
        href="https://discord.gg/convex"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-brand-base no-underline hover:underline"
      >
        Join Convex Discord
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

// ============================================================================
// Main ProfileSettings Component
// ============================================================================

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { accessToken, fetchFn } = useDeployment();
  const cache = useProfileCache(accessToken);

  // State for API data
  const [emails, setEmails] = useState<ProfileEmail[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [discordAccounts, setDiscordAccounts] = useState<DiscordAccount[]>([]);

  // Loading states
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [identitiesLoading, setIdentitiesLoading] = useState(true);
  const [discordLoading, setDiscordLoading] = useState(true);

  // Current user name (may be updated) - fetch from profile API
  const [currentName, setCurrentName] = useState(user?.name || "");

  // Debug logging
  useEffect(() => {
    console.log("ProfileSettings - user:", user);
    console.log(
      "ProfileSettings - accessToken:",
      accessToken ? "present" : "missing",
    );
  }, [user, accessToken]);

  // Fetch profile data on mount with caching
  useEffect(() => {
    if (!accessToken) return;

    // Fetch profile for name
    const loadProfile = async () => {
      try {
        // Check cache first
        const cachedProfile = cache.getCached<{ name: string }>("profile");
        if (cachedProfile) {
          console.log("[ProfileSettings] Using cached profile");
          setCurrentName(cachedProfile.name);
          return;
        }

        const data = await getProfile(accessToken, fetchFn);
        console.log("Profile API response:", data);
        if (data?.name) {
          setCurrentName(data.name);
          cache.setCached("profile", { name: data.name });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    const loadEmails = async () => {
      try {
        // Check cache first
        const cachedEmails = cache.getCached<ProfileEmail[]>("emails");
        if (cachedEmails) {
          console.log("[ProfileSettings] Using cached emails");
          setEmails(cachedEmails);
          setEmailsLoading(false);
          return;
        }

        const data = await getProfileEmails(accessToken, fetchFn);
        console.log("Emails API response:", data);
        // Handle case where API returns object with emails property
        const emailsArray = Array.isArray(data)
          ? data
          : ((data as unknown as { emails?: ProfileEmail[] })?.emails ?? []);
        setEmails(emailsArray);
        cache.setCached("emails", emailsArray);
      } catch (err) {
        console.error("Failed to load emails:", err);
      } finally {
        setEmailsLoading(false);
      }
    };

    const loadIdentities = async () => {
      try {
        // Check cache first
        const cachedIdentities = cache.getCached<Identity[]>("identities");
        if (cachedIdentities) {
          console.log("[ProfileSettings] Using cached identities");
          setIdentities(cachedIdentities);
          setIdentitiesLoading(false);
          return;
        }

        const data = await getIdentities(accessToken, fetchFn);
        console.log("Identities API response:", data);
        // Handle case where API returns object with identities property
        const identitiesArray = Array.isArray(data)
          ? data
          : ((data as unknown as { identities?: Identity[] })?.identities ??
            []);
        setIdentities(identitiesArray);
        cache.setCached("identities", identitiesArray);
      } catch (err) {
        console.error("Failed to load identities:", err);
      } finally {
        setIdentitiesLoading(false);
      }
    };

    const loadDiscord = async () => {
      try {
        // Check cache first
        const cachedDiscord = cache.getCached<DiscordAccount[]>("discord");
        if (cachedDiscord) {
          console.log("[ProfileSettings] Using cached Discord accounts");
          setDiscordAccounts(cachedDiscord);
          setDiscordLoading(false);
          return;
        }

        const data = await getDiscordAccounts(accessToken, fetchFn);
        console.log("Discord API response:", data);
        // Already handled in API function, but ensure it's an array
        const discordArray = Array.isArray(data) ? data : [];
        setDiscordAccounts(discordArray);
        cache.setCached("discord", discordArray);
      } catch (err) {
        console.error("Failed to load Discord accounts:", err);
      } finally {
        setDiscordLoading(false);
      }
    };

    loadProfile();
    loadEmails();
    loadIdentities();
    loadDiscord();
  }, [accessToken, fetchFn, cache]);

  // Update current name when user prop changes (fallback if profile API fails)
  useEffect(() => {
    if (user?.name && !currentName) {
      setCurrentName(user.name);
    }
  }, [user?.name, currentName]);

  // Handlers
  const handleSaveName = useCallback(
    async (name: string) => {
      if (!accessToken) throw new Error("Not authenticated");
      await updateProfileName(accessToken, name, fetchFn);
      setCurrentName(name);
      // Invalidate profile cache after update
      cache.clearCache("profile");
    },
    [accessToken, fetchFn, cache],
  );

  const handleUnlinkIdentity = useCallback(
    async (provider: "google" | "github" | "vercel") => {
      if (!accessToken) throw new Error("Not authenticated");
      await unlinkIdentity(accessToken, provider, fetchFn);
      // Remove the provider from the identity's providers array
      setIdentities((prev) =>
        prev
          .map((i) => ({
            ...i,
            providers: i.providers.filter((p) => p !== provider),
          }))
          .filter((i) => i.providers.length > 0),
      );
      // Invalidate identities cache after update
      cache.clearCache("identities");
    },
    [accessToken, fetchFn, cache],
  );

  const handleUnlinkDiscord = useCallback(
    async (discordUserId: string) => {
      if (!accessToken) throw new Error("Not authenticated");
      await unlinkDiscordAccount(accessToken, discordUserId, fetchFn);
      setDiscordAccounts((prev) => prev.filter((a) => a.id !== discordUserId));
      // Invalidate discord cache after update
      cache.clearCache("discord");
    },
    [accessToken, fetchFn, cache],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Content */}
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="w-full max-w-[600px]">
          {/* Profile Information */}
          <Section title="Profile Information">
            <ProfileNameForm
              currentName={currentName}
              onSave={handleSaveName}
            />
          </Section>

          {/* Emails */}
          <Section title="Emails">
            <EmailsSection emails={emails} isLoading={emailsLoading} />
          </Section>

          {/* Connected Identities */}
          <Section title="Connected Identities">
            <ConnectedIdentitiesSection
              identities={identities}
              isLoading={identitiesLoading}
              onUnlink={handleUnlinkIdentity}
            />
          </Section>

          {/* Discord */}
          <Section title="Discord">
            <DiscordAccountsSection
              accounts={discordAccounts}
              isLoading={discordLoading}
              onUnlink={handleUnlinkDiscord}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
