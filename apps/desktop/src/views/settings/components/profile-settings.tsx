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
} from "../../../api/bigbrain";
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
    <div
      style={{
        padding: "16px",
        backgroundColor: "var(--color-surface-raised)",
        borderRadius: "12px",
        border: "1px solid var(--color-border-base)",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text-base)",
          marginBottom: "12px",
          margin: 0,
          marginBlockEnd: "12px",
        }}
      >
        {title}
      </h3>
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
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="profile-name"
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}
          >
            Name
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!error}
            style={{ width: "100%" }}
          />
          {error && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-error-base)",
                marginTop: "4px",
                margin: 0,
                marginBlockStart: "4px",
              }}
            >
              {error}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={name === currentName || name.length > 128 || isLoading}
          style={{ marginTop: "20px" }}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--color-text-muted)",
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span style={{ fontSize: "13px" }}>Loading emails...</span>
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

  console.log("sortedEmails", sortedEmails);
  console.log("emails", emails);

  return (
    <div>
      <p
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          marginBottom: "12px",
          margin: 0,
          marginBlockEnd: "12px",
        }}
      >
        Your emails are used for team invitations and communications.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sortedEmails.map((email) => (
          <div
            key={email.email}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: "var(--color-surface-base)",
              borderRadius: "8px",
              border: "1px solid var(--color-border-base)",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--color-text-base)" }}>
              {email.email}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {email.primary && (
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-brand-base-alpha)",
                    color: "var(--color-brand-base)",
                    fontWeight: 500,
                  }}
                >
                  Primary
                </span>
              )}
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: email.verified
                    ? "var(--color-success-base-alpha, rgba(34, 197, 94, 0.1))"
                    : "var(--color-warning-base-alpha, rgba(234, 179, 8, 0.1))",
                  color: email.verified
                    ? "var(--color-success-base, #22c55e)"
                    : "var(--color-warning-base, #eab308)",
                  fontWeight: 500,
                }}
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "12px",
          fontSize: "12px",
          color: "var(--color-brand-base)",
          textDecoration: "none",
        }}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--color-text-muted)",
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span style={{ fontSize: "13px" }}>Loading identities...</span>
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
      <p
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          margin: 0,
        }}
      >
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
      <p
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          marginBottom: "12px",
          margin: 0,
          marginBlockEnd: "12px",
        }}
      >
        Connected accounts allow you to sign in with different providers.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {providerEntries.map((entry) => {
          const info = getProviderInfo(entry.provider);
          return (
            <div
              key={`${entry.identityId}-${entry.provider}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "var(--color-surface-base)",
                borderRadius: "8px",
                border: "1px solid var(--color-border-base)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    backgroundColor: info.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {info.name[0]}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--color-text-base)",
                    }}
                  >
                    {info.name}
                  </div>
                  {entry.email && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                      }}
                    >
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--color-text-muted)",
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span style={{ fontSize: "13px" }}>Loading Discord accounts...</span>
      </div>
    );
  }

  if (validAccounts.length === 0) {
    return (
      <div>
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            marginBottom: "12px",
            margin: 0,
            marginBlockEnd: "12px",
          }}
        >
          Link your Discord account to access the Convex community features.
        </p>
        <a
          href="https://discord.gg/convex"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--color-brand-base)",
            textDecoration: "none",
          }}
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
      <p
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          marginBottom: "12px",
          margin: 0,
          marginBlockEnd: "12px",
        }}
      >
        Your linked Discord accounts for the Convex community.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {validAccounts.map((account) => (
          <div
            key={account.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              backgroundColor: "var(--color-surface-base)",
              borderRadius: "8px",
              border: "1px solid var(--color-border-base)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={getDiscordAvatarUrl(account)}
                alt={account.details.username}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text-base)",
                }}
              >
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "12px",
          fontSize: "12px",
          color: "var(--color-brand-base)",
          textDecoration: "none",
        }}
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
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-background-base)",
      }}
    >
      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "600px", width: "100%" }}>
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
