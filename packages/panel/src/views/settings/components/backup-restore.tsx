import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, HardDrive, ExternalLink, Loader2, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ProBadge } from '../../../components/shared/pro-badge';
import { Checkbox } from '../../../components/shared/checkbox';
import { BackupActionsDropdown } from './backup-actions-dropdown';
import { RestoreBackupSheet } from './restore-backup-sheet';
import { DeleteBackupSheet } from './delete-backup-sheet';
import { RestoreDetailsSheet } from './restore-details-sheet';
import { useSheetSafe } from '../../../contexts/sheet-context';
import type { CloudBackupResponse, PeriodicBackupConfig } from '../../../utils/api/types';
import { createBackup, listBackups, getPeriodicBackupConfig, getLatestRestore, confirmSnapshotImport, getBackup, configurePeriodicBackup, disablePeriodicBackup, downloadBackup, restoreBackup, deleteBackup } from '../../../utils/api/backups';
import { getDeploymentIdFromUrl } from '../../../utils/api/deployments';
import { extractDeploymentName, getTeamTokenFromEnv } from '../../../utils/api/utils';
import { fetchProjectInfo, fetchTeams, getTokenDetails } from '../../../utils/api/teams';


const BackupButtonWithTooltip: React.FC<{
  isDisabled: boolean;
  isCreating: boolean;
  onClick: () => void;
}> = ({ isDisabled, isCreating, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current && isDisabled && !isCreating) {
      // Set initial position immediately so tooltip can render
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedWidth = 350;
      const estimatedHeight = 60;
      const margin = 8;

      const initialLeft = rect.left + rect.width / 2 - estimatedWidth / 2;
      const initialTop = rect.top - estimatedHeight - margin - 4;

      setTooltipPosition({
        top: Math.max(margin, initialTop),
        left: Math.max(margin, Math.min(initialLeft, window.innerWidth - estimatedWidth - margin)),
      });

      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const tooltipHeight = tooltipRect?.height || estimatedHeight;
        const tooltipWidth = tooltipRect?.width || estimatedWidth;

        // Position tooltip above the button, centered
        const left = rect.left + rect.width / 2 - tooltipWidth / 2;
        const top = rect.top - tooltipHeight - margin - 4; // 4px for arrow

        setTooltipPosition({
          top: Math.max(margin, top), // Ensure it doesn't go off top edge
          left: Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin)),
        });
      };

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setTooltipPosition(null);
    }
  }, [showTooltip, isDisabled, isCreating]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => {
          if (isDisabled && !isCreating) {
            setShowTooltip(true);
          }
        }}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'inline-flex',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          disabled={isDisabled}
          className="cp-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
            }
          }}
        >
          <HardDrive size={14} />
          {isCreating ? 'Creating Backup...' : 'Backup Now'}
        </button>
      </div>
      {showTooltip && isDisabled && !isCreating && typeof document !== 'undefined' && (
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              top: tooltipPosition ? `${tooltipPosition.top}px` : '-9999px',
              left: tooltipPosition ? `${tooltipPosition.left}px` : '-9999px',
              opacity: tooltipPosition ? 1 : 0,
              padding: '8px 12px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              color: 'var(--color-panel-text)',
              fontSize: '12px',
              borderRadius: '4px',
              transition: 'opacity 0.2s',
              pointerEvents: 'none',
              zIndex: 99999,
              boxShadow: '0 10px 15px -3px var(--color-panel-shadow)',
              minWidth: '192px',
              maxWidth: '350px',
              textAlign: 'center',
              lineHeight: '1.5',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            You can only have up to 2 backups on your current plan. Delete some of your existing backups in this deployment to create a new one.
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                borderBottom: '1px solid var(--color-panel-border)',
                borderRight: '1px solid var(--color-panel-border)',
              }}
            />
          </div>,
          document.body
        )
      )}
    </>
  );
};

export interface BackupRestoreProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
  teamAccessToken?: string;
  teamId?: number;
  deploymentId?: number;
  periodicBackupsEnabled?: boolean;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  adminClient,
  accessToken,
  deploymentUrl: providedDeploymentUrl,
  teamAccessToken,
  teamId,
  deploymentId: providedDeploymentId,
  periodicBackupsEnabled = false,
}) => {
  const [allBackups, setAllBackups] = useState<CloudBackupResponse[]>([]);
  const [periodicConfig, setPeriodicConfig] = useState<PeriodicBackupConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [automaticBackup, setAutomaticBackup] = useState(false);
  const [deploymentId, setDeploymentId] = useState<number | null>(providedDeploymentId || null);
  const [resolvedTeamId, setResolvedTeamId] = useState<number | null>(teamId || null);
  const [resolvedProjectId, ] = useState<number | null>(null);
  
  // Restore status tracking
  const [restoreStatus, setRestoreStatus] = useState<{
    state: 'in_progress' | 'uploaded' | 'waiting_for_confirmation' | 'completed' | 'failed' | null;
    progressMessage?: string;
    checkpointMessages?: string[];
    errorMessage?: string;
    completedTime?: Date;
    restoredRowsCount?: number;
    importId?: string;
    backupId?: number;
    backupInfo?: {
      name?: string;
      timestamp?: number;
      type?: string;
    };
    tableChanges?: Array<{
      schema: string;
      tables: Array<{
        table: string;
        created: number;
        deleted: number;
        total: number;
      }>;
    }>;
  } | null>(null);
  
  
  // Polling interval ref for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const restorePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restorePollingStartTimeRef = useRef<number | null>(null);
  const restoreFoundRef = useRef<boolean>(false);
  
  // Dropdown menu state
  const [dropdownState, setDropdownState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    backup: CloudBackupResponse | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    backup: null,
  });
  
  const { openSheet, closeSheet } = useSheetSafe();

  // Filter backups by current deployment (if deploymentId is available)
  const backups = useMemo(() => {
    if (!deploymentId) {
      // If no deploymentId, show all backups
      return allBackups;
    }
    return allBackups.filter(backup => backup.sourceDeploymentId === deploymentId);
  }, [allBackups, deploymentId]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (restorePollingIntervalRef.current) {
        clearInterval(restorePollingIntervalRef.current);
        restorePollingIntervalRef.current = null;
      }
    };
  }, []);

  // Helper function to decode Convex base64-encoded integers
  const decodeConvexInteger = (encoded: any): number => {
    // Handle null/undefined
    if (encoded === null || encoded === undefined) {
      return 0;
    }
    
    // Handle direct number or bigint
    if (typeof encoded === 'number') {
      return isNaN(encoded) ? 0 : encoded;
    }
    if (typeof encoded === 'bigint') {
      return Number(encoded);
    }
    
    // Handle object with $integer property (Convex encoded format: {"$integer":"base64string"})
    if (encoded && typeof encoded === 'object') {
      if (encoded.$integer !== undefined) {
        return decodeConvexInteger(encoded.$integer);
      }
      // If it's an object but not the $integer format, return 0
      return 0;
    }
    
    // Handle string (could be base64 or numeric string)
    if (typeof encoded === 'string') {
      // First try parsing as a number
      const parsed = parseInt(encoded, 10);
      if (!isNaN(parsed) && parsed.toString() === encoded.trim()) {
        return parsed;
      }
      
      // Try to decode as base64
      try {
        // Base64 decode
        const bytes = atob(encoded);
        if (bytes.length === 0) {
          return 0;
        }
        
        // Convex uses little-endian 64-bit integers
        // Read up to 8 bytes (64 bits)
        let value = 0;
        const maxBytes = Math.min(bytes.length, 8);
        for (let i = 0; i < maxBytes; i++) {
          const byteValue = bytes.charCodeAt(i);
          if (byteValue < 0 || byteValue > 255) {
            return 0;
          }
          value += byteValue * Math.pow(256, i);
        }
        
        // Handle sign extension for negative numbers (if needed)
        // For now, we assume unsigned integers
        return value;
      } catch (err) {
        return 0;
      }
    }
    
    return 0;
  };

  // Function to check restore status
  const checkRestoreStatus = async () => {
    if (!providedDeploymentUrl || !accessToken) {
      return;
    }

    try {
      const latestRestore = await getLatestRestore(adminClient);
      
      if (!latestRestore) {
        // Don't clear status if we already have one - the restore might just not appear yet
        // Only clear if we've been polling for a while (handled by stopping polling after timeout)
        return;
      }

      // Mark that we found a restore
      restoreFoundRef.current = true;

      // Handle different possible state structures
      let state = latestRestore.state?.state;
      if (!state && latestRestore.state && typeof latestRestore.state === 'string') {
        state = latestRestore.state;
      }
      if (!state && latestRestore.state && typeof latestRestore.state === 'object' && 'state' in latestRestore.state) {
        state = (latestRestore.state as any).state;
      }
      
      const progressMessage = latestRestore.state?.progress_message;
      const checkpointMessages = latestRestore.state?.checkpoint_messages || [];
      const errorMessage = latestRestore.state?.error_message;
      
      // Handle timestamp conversion - try different formats
      let completedTime: Date | undefined = undefined;
      if (state === 'completed' && latestRestore.state?.timestamp) {
        try {
          const timestamp = latestRestore.state.timestamp;
          if (typeof timestamp === 'bigint') {
            completedTime = new Date(Number(timestamp / BigInt(1000000)));
          } else if (typeof timestamp === 'number') {
            completedTime = new Date(timestamp);
          } else if (typeof timestamp === 'string') {
            completedTime = new Date(parseInt(timestamp));
          }
        } catch (err) {
          // Ignore timestamp parsing errors
        }
      }
      
      // Handle num_rows_written - try different formats
      let restoredRowsCount: number | undefined = undefined;
      if (latestRestore.state?.num_rows_written !== undefined) {
        try {
          const numRows = latestRestore.state.num_rows_written;
          if (typeof numRows === 'bigint') {
            restoredRowsCount = Number(numRows);
          } else if (typeof numRows === 'number') {
            restoredRowsCount = numRows;
          } else if (typeof numRows === 'string') {
            restoredRowsCount = parseInt(numRows, 10);
          }
        } catch (err) {
          // Ignore num_rows_written parsing errors
        }
      }

      // Normalize state to match our type definition
      let normalizedState: 'in_progress' | 'uploaded' | 'waiting_for_confirmation' | 'completed' | 'failed' | null = null;
      const stateStr = String(state || '').toLowerCase();
      if (stateStr === 'completed') normalizedState = 'completed';
      else if (stateStr === 'failed') normalizedState = 'failed';
      else if (stateStr === 'in_progress') normalizedState = 'in_progress';
      else if (stateStr === 'uploaded') normalizedState = 'uploaded';
      else if (stateStr === 'waiting_for_confirmation') normalizedState = 'waiting_for_confirmation';
      
      // Extract table changes from checkpoints
      let tableChanges: Array<{
        schema: string;
        tables: Array<{
          table: string;
          created: number;
          deleted: number;
          total: number;
        }>;
      }> | undefined = undefined;
      
      if (latestRestore.checkpoints && Array.isArray(latestRestore.checkpoints)) {
        // Group checkpoints by schema (component_path)
        const schemaMap = new Map<string, Array<{
          table: string;
          created: number;
          deleted: number;
          total: number;
        }>>();
        
        for (const checkpoint of latestRestore.checkpoints) {
          const schema = checkpoint.component_path || 'default';
          const tableName = checkpoint.display_table_name || '';
          const created = decodeConvexInteger(checkpoint.num_rows_written);
          const total = decodeConvexInteger(checkpoint.existing_rows_in_table);
          const deleted = decodeConvexInteger(checkpoint.existing_rows_to_delete);
          
          if (!schemaMap.has(schema)) {
            schemaMap.set(schema, []);
          }
          
          schemaMap.get(schema)!.push({
            table: tableName,
            created: isNaN(created) ? 0 : created,
            deleted: isNaN(deleted) ? 0 : deleted,
            total: isNaN(total) ? 0 : total,
          });
        }
        
        // Convert map to array
        tableChanges = Array.from(schemaMap.entries()).map(([schema, tables]) => ({
          schema,
          tables: tables.sort((a, b) => a.table.localeCompare(b.table)),
        }));
      }
      
      const newStatus = {
        state: normalizedState,
        progressMessage,
        checkpointMessages: Array.isArray(checkpointMessages) ? checkpointMessages : [],
        errorMessage,
        completedTime,
        restoredRowsCount: restoredRowsCount ? Number(restoredRowsCount) : undefined,
        importId: latestRestore._id,
        tableChanges,
      };

      setRestoreStatus(newStatus);

      // Automatically confirm when in waiting_for_confirmation state
      if (normalizedState === 'waiting_for_confirmation' && latestRestore._id) {
        try {
          await confirmSnapshotImport(adminClient, providedDeploymentUrl, latestRestore._id, accessToken);
          // Status will be updated on next poll
        } catch (err: any) {
          // Continue polling even if confirmation fails
        }
      }

      // Check if restore is completed - either by state or by having completion indicators
      const isCompleted = normalizedState === 'completed' || 
        (completedTime !== undefined && restoredRowsCount !== undefined) ||
        (normalizedState !== 'failed' && latestRestore.state?.timestamp && latestRestore.state?.num_rows_written);
      const isFailed = normalizedState === 'failed';
      
      if (isCompleted || isFailed) {
        if (restorePollingIntervalRef.current) {
          clearInterval(restorePollingIntervalRef.current);
          restorePollingIntervalRef.current = null;
        }
        restorePollingStartTimeRef.current = null;
        restoreFoundRef.current = false;
        
        // If we detected completion by timestamp/num_rows but state wasn't set, update it
        if (isCompleted && normalizedState !== 'completed') {
          setRestoreStatus(prev => prev ? {
            ...prev,
            state: 'completed',
          } : null);
        }
        
        // Refresh backup list after restore completes
        loadData().catch(() => {
          // Ignore errors refreshing backup list
        });
      } else {
        // Keep polling for in_progress, uploaded, waiting_for_confirmation states
        // Reset the start time since we found a restore (so timeout won't trigger)
        restorePollingStartTimeRef.current = null;
      }
    } catch (err: any) {
      // Continue polling even on error - don't clear status in case it was set before
      // The restore might still be in progress, we just can't check its status right now
    }
  };

  // Start polling restore status
  const startRestorePolling = () => {
    // Clear any existing polling
    if (restorePollingIntervalRef.current) {
      clearInterval(restorePollingIntervalRef.current);
    }

    // Track when we started polling and reset found flag
    restorePollingStartTimeRef.current = Date.now();
    restoreFoundRef.current = false;

    // Wait a moment before first check to give restore time to appear in the list
    // Then check immediately
    setTimeout(() => {
      checkRestoreStatus();
    }, 1000);

    // Then poll every 2 seconds
    restorePollingIntervalRef.current = setInterval(() => {
      // Stop polling if we've been polling for more than 60 seconds without finding a restore
      if (restorePollingStartTimeRef.current && !restoreFoundRef.current && Date.now() - restorePollingStartTimeRef.current > 60000) {
        if (restorePollingIntervalRef.current) {
          clearInterval(restorePollingIntervalRef.current);
          restorePollingIntervalRef.current = null;
        }
        restorePollingStartTimeRef.current = null;
        // Only clear status if we still haven't found a restore after timeout
        setRestoreStatus((prevStatus) => {
          if (prevStatus && !prevStatus.importId) {
            return null;
          }
          return prevStatus;
        });
        return;
      }
      checkRestoreStatus();
    }, 2000);
  };

  useEffect(() => {
    loadData();
    // Check for existing restore status on load
    if (providedDeploymentUrl && accessToken) {
      checkRestoreStatus();
    }
  }, [adminClient, accessToken, teamAccessToken, teamId, deploymentId, providedDeploymentUrl]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // For backup operations, we need a team token (not project token)
      // Try to get team token from: teamAccessToken > env var > accessToken
      let token = teamAccessToken;
      
      // If no teamAccessToken provided, try to get from environment (same as CLI)
      if (!token) {
        const envToken = getTeamTokenFromEnv();
        if (envToken) {
          token = envToken;
        }
      }
      
      // Fallback to accessToken (might be project token, but we'll check it)
      if (!token) {
        token = accessToken;
      }
      
      if (!token) {
        setIsLoading(false);
        setError('No access token available. Please provide a team access token for backup operations.');
        return;
      }

      // Check token type BEFORE making backup calls
      // If it's a project token, we need a team token for backups
      let isProjectToken = false;
      let detectedTeamId: number | null = null;
      try {
        const tokenDetails = await getTokenDetails(token);
        isProjectToken = tokenDetails?.type === 'projectToken';
        
        if (isProjectToken) {
          // Try to get team token from env one more time (in case it's available)
          const envTeamToken = getTeamTokenFromEnv();
          if (envTeamToken && envTeamToken !== token) {
            try {
              const envTokenDetails = await getTokenDetails(envTeamToken);
              if (envTokenDetails?.type !== 'projectToken' && envTokenDetails?.teamId) {
                token = envTeamToken;
                isProjectToken = false;
                detectedTeamId = typeof envTokenDetails.teamId === 'string' 
                  ? parseInt(envTokenDetails.teamId, 10) 
                  : envTokenDetails.teamId;
              }
            } catch {
              // Environment token also failed, continue with error message
            }
          }
          
          // If still a project token, show error immediately with helpful instructions
          if (isProjectToken) {
            setIsLoading(false);
            const envToken = getTeamTokenFromEnv();
            const envTokenAvailable = !!envToken;
            const isNext = typeof window !== 'undefined' && (window as any).__NEXT_DATA__;
            const errorMsg = envTokenAvailable
              ? 'Backup operations require a team access token. A project token was detected. ' +
                'The team token from CONVEX_ACCESS_TOKEN was found in the environment, but it may be a project token instead of a team token. ' +
                `Please ensure CONVEX_ACCESS_TOKEN in your .env file is a team access token (not a project token), or pass a team token via the \`teamAccessToken\` prop to ConvexPanel. ` +
                'Create a team access token at: https://dashboard.convex.dev/t/idylcode/settings'
              : 'Backup operations require a team access token, but a project token is being used. ' +
                `Please provide a team access token by either: (1) Setting CONVEX_ACCESS_TOKEN in your .env file (for ${isNext ? 'Next.js' : 'Vite'} apps), or (2) Passing it via the \`teamAccessToken\` prop to ConvexPanel. ` +
                'Note: CONVEX_ACCESS_TOKEN must be a team access token (not a project token). Create a team access token at: https://dashboard.convex.dev/t/idylcode/settings';
            setError(errorMsg);
            return;
          }
        } else if (tokenDetails?.teamId) {
          detectedTeamId = typeof tokenDetails.teamId === 'string' 
            ? parseInt(tokenDetails.teamId, 10) 
            : tokenDetails.teamId;
        }
      } catch (err) {
        // Continue anyway - we'll see the error from the backup API
      }

      // Always use Bearer token format for backup endpoints (matching CLI script)
      const useBearer = true;
      let currentTeamId = detectedTeamId || resolvedTeamId || teamId;
      let currentDeploymentId = deploymentId;
      
      // Use detected teamId if we found it from token
      if (detectedTeamId) {
        setResolvedTeamId(detectedTeamId);
      }

      // Step 1: Try to get teamId from token details using Bearer token format
      // Note: The token_details endpoint works from browser when using Bearer token format
      if (!currentTeamId && token) {
        try {
          const tokenDetails = await getTokenDetails(token); // Use Bearer format
          
          if (tokenDetails?.teamId) {
            const teamIdNum = typeof tokenDetails.teamId === 'string' 
              ? parseInt(tokenDetails.teamId, 10) 
              : tokenDetails.teamId;
            if (!isNaN(teamIdNum) && teamIdNum > 0) {
              currentTeamId = teamIdNum;
              setResolvedTeamId(currentTeamId);
            }
          }
        } catch (err: any) {
          // Continue to other methods
        }
      }

      // Note: Other V1 API endpoints (/v1/deployments/{name}/team_and_project, /v1/teams)
      // are blocked by CORS when called from the browser. These would need to be called from a backend/proxy.

      // Step 1c: Try to get teamId from system queries directly
      if (!currentTeamId && adminClient && providedDeploymentUrl) {
        try {
          // First, try to query the system function directly to get raw response
          let rawProjectInfo: any = null;
          try {
            rawProjectInfo = await adminClient.query("_system/project:info" as any, {}) as any;
            
            // Check various possible paths for teamId
            const possibleTeamIdPaths = [
              rawProjectInfo?.team?.id,
              rawProjectInfo?.team?.teamId,
              rawProjectInfo?.project?.teamId,
              rawProjectInfo?.teamId,
              rawProjectInfo?.project?.team?.id,
            ];
            
            for (const possibleTeamId of possibleTeamIdPaths) {
              if (!possibleTeamId) continue;
              
              // Try to parse as number regardless of type
              let teamIdNum: number | null = null;
              if (typeof possibleTeamId === 'number') {
                teamIdNum = possibleTeamId;
              } else if (typeof possibleTeamId === 'string') {
                // Try parsing - might be numeric string
                const parsed = parseInt(possibleTeamId, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  teamIdNum = parsed;
                }
              }
              
              if (teamIdNum !== null && teamIdNum > 0) {
                currentTeamId = teamIdNum;
                setResolvedTeamId(currentTeamId);
                break; // Found valid teamId, stop searching
              }
            }
          } catch (sysErr: any) {
            // Direct system query failed, continue to fetchProjectInfo
          }
          
          // Fallback to fetchProjectInfo if direct query didn't work or didn't give us a number
          if (!currentTeamId) {
            const projectInfoData = await fetchProjectInfo(adminClient, providedDeploymentUrl, token);
            
            // Check if we got a numeric team ID
            if (projectInfoData?.team?.id) {
              const teamIdFromProject = projectInfoData.team.id;
              const teamIdNum = typeof teamIdFromProject === 'string' 
                ? parseInt(teamIdFromProject, 10) 
                : teamIdFromProject;
              if (!isNaN(teamIdNum) && teamIdNum > 0) {
                currentTeamId = teamIdNum;
                setResolvedTeamId(currentTeamId);
              } else {
                // team.id is a slug (like "idylcode"), not a numeric ID
                // Try to look up team ID by slug using Dashboard API
                if (typeof teamIdFromProject === 'string' && teamIdFromProject.length > 0) {
                  try {
                    const teams = await fetchTeams(token, useBearer);
                    const matchingTeam = teams.find(t => t.slug === teamIdFromProject || t.slug === projectInfoData?.team?.slug);
                    if (matchingTeam && matchingTeam.id) {
                      currentTeamId = matchingTeam.id;
                      setResolvedTeamId(currentTeamId);
                    }
                  } catch (teamLookupErr: any) {
                    // Could not look up team by slug (this may be expected for service accounts)
                  }
                }
              }
            } else if (projectInfoData?.project?.teamId) {
              const teamIdFromProject = projectInfoData.project.teamId;
              const teamIdNum = typeof teamIdFromProject === 'string' 
                ? parseInt(teamIdFromProject, 10) 
                : teamIdFromProject;
              if (!isNaN(teamIdNum) && teamIdNum > 0) {
                currentTeamId = teamIdNum;
                setResolvedTeamId(currentTeamId);
              }
            } else if (projectInfoData?.team?.slug) {
              // If we have team slug but no numeric ID, try to look it up
              const teamSlug = projectInfoData.team.slug;
              try {
                const teams = await fetchTeams(token, useBearer);
                const matchingTeam = teams.find(t => t.slug === teamSlug);
                if (matchingTeam && matchingTeam.id) {
                  currentTeamId = matchingTeam.id;
                  setResolvedTeamId(currentTeamId);
                }
              } catch (teamLookupErr: any) {
                // Could not look up team by slug (Dashboard API may not be accessible)
              }
            }
          }
        } catch (err: any) {
          // Could not fetch team from project info
        }
      }

      // Step 1b: Skip profile endpoint entirely - it doesn't work for service accounts
      // and we should prefer system queries anyway. If system queries failed and we need
      // teamId, it should be provided as a prop or we'll need to extract it from backups later.

      // Step 1d: Try to list teams and match by slug (skip V1 API - CORS blocked, Dashboard API requires different permissions)
      // The Dashboard API /api/dashboard/teams returns 403 for service accounts
      // V1 API /v1/teams is blocked by CORS from browser
      // These would need to be called from a backend/proxy server
      
      // Step 1e: Final check - if we still don't have teamId
      // Note: We'll show a detailed error message below if teamId is missing

      // Step 2: Skip fetching projects/deployments - they require team tokens and fail with 403 for project tokens
      // We'll get deploymentId from backups instead

      // Step 3: Load backups if we have teamId - this is the primary operation we need
      if (currentTeamId) {
        try {
          const backupList = await listBackups(currentTeamId, token);
          setAllBackups(backupList || []);
          
          // Extract deploymentId from backups (this is more reliable than fetching projects/deployments)
          if (!currentDeploymentId && backupList.length > 0) {
            const deploymentName = extractDeploymentName(providedDeploymentUrl);
            if (deploymentName) {
              // Try to find a backup matching the current deployment name
              const matchingBackup = backupList.find(b => {
                const backupName = b.sourceDeploymentName || '';
                return backupName === deploymentName || 
                       backupName.includes(deploymentName) ||
                       deploymentName.includes(backupName);
              });
              if (matchingBackup?.sourceDeploymentId) {
                currentDeploymentId = matchingBackup.sourceDeploymentId;
                setDeploymentId(currentDeploymentId);
              } else if (backupList[0]?.sourceDeploymentId) {
                // Fallback to first backup's deployment
                currentDeploymentId = backupList[0].sourceDeploymentId;
                setDeploymentId(currentDeploymentId);
              }
            } else if (backupList[0]?.sourceDeploymentId) {
              // If we don't have deployment name, use first backup's deployment
              currentDeploymentId = backupList[0].sourceDeploymentId;
              setDeploymentId(currentDeploymentId);
            }
          }
        } catch (err: any) {
          
          // Check if error is about project token needing team token
          const errorMessage = err?.message || '';
          if (errorMessage.includes('Project service accounts cannot manage teams') || errorMessage.includes('403')) {
            setError(
              `Failed to load backups: Your access token is a project token, but backup operations require a team access token. ` +
              `Please provide a team access token (not a project token) to use backup features. ` +
              `You can create a team access token in the Convex dashboard at: https://dashboard.convex.dev/t/{team-slug}/settings`
            );
          } else {
            setError(`Failed to load backups: ${errorMessage || 'Unknown error'}`);
          }
        }
      } else {
        // Get team slug if available for helpful error message
        let teamSlug: string | undefined;
        try {
          const projectInfoData = await fetchProjectInfo(adminClient, providedDeploymentUrl, token);
          teamSlug = projectInfoData?.team?.slug || projectInfoData?.team?.id;
        } catch (err) {
          // Ignore errors when fetching project info for error message
        }
        
        // Try to detect if token is a projectToken to provide more specific error message
        let tokenType: string | undefined;
        try {
          if (token) {
            const tokenDetails = await getTokenDetails(token);
            tokenType = tokenDetails?.type;
          }
        } catch {
          // Ignore errors when checking token type
        }
        
        const errorMsg = teamSlug 
          ? `Unable to load backups: Team ID is required. ${tokenType === 'projectToken' ? 'Your token is a project token (not a team token), so it doesn\'t include the teamId. ' : ''}Found team slug: "${teamSlug}". To use backups, please either: (1) Use a team access token (which includes teamId), or (2) Provide the numeric teamId as a prop (e.g., teamId={59354}). You can find your teamId by running: node test-backups-cli.js or check the Convex dashboard URL.`
          : `Unable to load backups: Team ID is required but could not be resolved automatically. ${tokenType === 'projectToken' ? 'Your token is a project token (not a team token), so it doesn\'t include the teamId. ' : ''}To use backups, please either: (1) Use a team access token (which includes teamId), or (2) Provide the numeric teamId as a prop. You can find your teamId by running: node test-backups-cli.js or check the Convex dashboard URL.`;
        
        setError(errorMsg);
      }

      // Step 4: Load periodic backup config if we have deploymentId
      if (currentDeploymentId) {
        try {
          const config = await getPeriodicBackupConfig(currentDeploymentId, token);
          setPeriodicConfig(config);
          console.log('periodic config', periodicConfig);
          setAutomaticBackup(config !== null);
        } catch (err: any) {
          // If config doesn't exist or fails, that's okay
          // The function should return null for errors, but catch just in case
          setPeriodicConfig(null);
          setAutomaticBackup(false);
        }
      } else {
        setAutomaticBackup(false);
      }
    } catch (err: any) {
      // Don't set error - just continue without loading
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupNow = async () => {
    const token = accessToken || teamAccessToken;
    const useBearer = !!accessToken;

    if (!token) {
      setError('Access token is required to create backups.');
      return;
    }

    let currentDeploymentId = deploymentId;
    
    // If we don't have deploymentId, try to fetch it
    if (!currentDeploymentId && providedDeploymentUrl) {
      const currentTeamId = resolvedTeamId || teamId;
      try {
        const fetchedId = await getDeploymentIdFromUrl(
          providedDeploymentUrl,
          token,
          currentTeamId || undefined,
          resolvedProjectId || undefined,
          useBearer
        );
        if (fetchedId) {
          currentDeploymentId = fetchedId;
          setDeploymentId(fetchedId);
        }
      } catch (err) {
        // Ignore deployment ID fetch errors
      }
    }

    if (!currentDeploymentId) {
      setError('Deployment ID is required to create backups. Please ensure your deployment URL is correct.');
      return;
    }

    setIsCreatingBackup(true);
    setError(null);

    try {
      const newBackup = await createBackup(currentDeploymentId, token, false);
      
      // Add the new backup to the list immediately
      setAllBackups(prevBackups => [newBackup, ...prevBackups]);
      
      // Poll for backup status updates until it completes, fails, or is canceled
      const maxPollAttempts = 60; // Poll for up to 5 minutes (5s * 60)
      pollAttemptsRef.current = 0;
      
      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          pollAttemptsRef.current++;
          const updatedBackup = await getBackup(newBackup.id, token);
          
          // Update the backup in the list
          setAllBackups(prevBackups =>
            prevBackups.map(backup =>
              backup.id === updatedBackup.id ? updatedBackup : backup
            )
          );
          
          // Stop polling if backup is complete, failed, or canceled
          if (
            updatedBackup.state === 'complete' ||
            updatedBackup.state === 'failed' ||
            updatedBackup.state === 'canceled'
          ) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsCreatingBackup(false);
          } else if (pollAttemptsRef.current >= maxPollAttempts) {
            // Stop polling after max attempts
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsCreatingBackup(false);
          }
        } catch (err) {
          // Continue polling even if there's an error
        }
      }, 5000); // Poll every 5 seconds
    } catch (err: any) {
      setError(err?.message || 'Failed to create backup');
      setIsCreatingBackup(false);
    }
  };

  const handleToggleAutomaticBackup = async (enabled: boolean) => {
    const token = accessToken || teamAccessToken;
    const useBearer = !!accessToken;

    if (!token) {
      setError('Access token is required to configure automatic backups.');
      return;
    }

    let currentDeploymentId = deploymentId;
    
    // If we don't have deploymentId, try to fetch it
    if (!currentDeploymentId && providedDeploymentUrl) {
      const currentTeamId = resolvedTeamId || teamId;
      try {
        const fetchedId = await getDeploymentIdFromUrl(
          providedDeploymentUrl,
          token,
          currentTeamId || undefined,
          resolvedProjectId || undefined,
          useBearer
        );
        if (fetchedId) {
          currentDeploymentId = fetchedId;
          setDeploymentId(fetchedId);
        }
      } catch (err) {
        // Ignore deployment ID fetch errors
      }
    }

    if (!currentDeploymentId) {
      setError('Deployment ID is required to configure automatic backups. Please ensure your deployment URL is correct.');
      return;
    }

    setIsConfiguring(true);
    setError(null);

    try {
      if (enabled) {
        // Configure daily backups - randomize the time to spread out backups
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const defaultCronspec = `${randomMinute} ${randomHour} * * *`;
        
        await configurePeriodicBackup(
          currentDeploymentId,
          token,
          defaultCronspec,
          false,
          undefined,
          useBearer
        );
      } else {
        if (!currentDeploymentId) {
          setError('Deployment ID is required to disable periodic backup');
          return;
        }
        await disablePeriodicBackup(currentDeploymentId, token, useBearer);
      }
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to configure automatic backup');
      setAutomaticBackup(!enabled); // Revert on error
    } finally {
      setIsConfiguring(false);
    }
  };

  const token = accessToken || teamAccessToken;
  const canPerformActions = !!(token && deploymentId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const handleDropdownToggle = (e: React.MouseEvent, backup: CloudBackupResponse) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownState({
      isOpen: true,
      position: { x: rect.right - 150, y: rect.bottom + 4 },
      backup,
    });
  };

  const handleDownload = () => {
    if (!dropdownState.backup || !token || !providedDeploymentUrl) {
      setError('Missing backup, access token, or deployment URL');
      setDropdownState({ isOpen: false, position: { x: 0, y: 0 }, backup: null });
      return;
    }
    
    try {
      const downloadUrl = downloadBackup(
        dropdownState.backup,
        token
      );
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `backup-${dropdownState.backup.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDropdownState({ isOpen: false, position: { x: 0, y: 0 }, backup: null });
    } catch (err: any) {
      setError(err?.message || 'Failed to get download URL');
      setDropdownState({ isOpen: false, position: { x: 0, y: 0 }, backup: null });
    }
  };

  const handleRestore = () => {
    if (!dropdownState.backup || !deploymentId) return;
    
    const currentDeploymentName = extractDeploymentName(providedDeploymentUrl) || 'Current Deployment';
    
    // Get token for restore (same logic as in loadData)
    let restoreToken = teamAccessToken;
    if (!restoreToken) {
      const envToken = getTeamTokenFromEnv();
      if (envToken) {
        restoreToken = envToken;
      }
    }
    if (!restoreToken) {
      restoreToken = accessToken;
    }
    
    openSheet({
      title: 'Restore from a backup',
      width: '500px',
      content: (
        <RestoreBackupSheet
          backup={dropdownState.backup}
          deploymentName={currentDeploymentName}
          deploymentId={deploymentId}
          onRestore={(backupId: number, targetDeploymentId: number) => {
            // Close the sheet immediately
            closeSheet();
            
            if (!restoreToken) {
              setRestoreStatus({
                state: 'failed',
                errorMessage: 'Access token is required',
              });
              return;
            }
            
            // Set a temporary status to show restore has started (before API call)
            const backup = dropdownState.backup;
            const formatBackupDate = (timestamp: number) => {
              return new Date(timestamp).toLocaleString();
            };
            setRestoreStatus({
              state: 'in_progress',
              progressMessage: 'Starting the restore...',
              backupId: backupId,
              backupInfo: backup ? {
                name: `Backup from ${formatBackupDate(backup.requestedTime)}`,
                timestamp: backup.requestedTime,
                type: backup.includeStorage ? 'Tables and Storage' : 'Tables only',
              } : undefined,
            });
            
            // Start polling for restore status immediately
            startRestorePolling();
            
            // Then initiate the restore (this happens in the background)
            // Use IIFE to handle async without returning a promise that could cause issues
            (async () => {
              try {
                const { importId } = await restoreBackup(targetDeploymentId, backupId, restoreToken);
                
                // Update status with the importId we got back
                setRestoreStatus(prev => prev ? {
                  ...prev,
                  importId,
                  progressMessage: 'Starting the restore…',
                } : {
                  state: 'in_progress',
                  progressMessage: 'Starting the restore…',
                  importId,
                });
                
                // Call perform_import to actually start the import process (matching dashboard behavior)
                if (providedDeploymentUrl && importId) {
                  try {
                    await confirmSnapshotImport(adminClient, providedDeploymentUrl, importId, restoreToken);
                    // Status will be updated by polling, no need to set a generic message here
                  } catch (confirmError) {
                    // Continue anyway - the import might still work
                  }
                }
                
                // Refresh the backup list after restore is initiated (don't await to prevent blocking)
                loadData().catch(() => {
                  // Ignore errors refreshing backup list
                });
              } catch (error) {
                // If restore fails to start, update status and stop polling
                setRestoreStatus({
                  state: 'failed',
                  errorMessage: error instanceof Error ? error.message : 'Failed to start restore',
                });
                if (restorePollingIntervalRef.current) {
                  clearInterval(restorePollingIntervalRef.current);
                  restorePollingIntervalRef.current = null;
                }
                // Don't throw - handle error gracefully to prevent page reload
              }
            })().catch(err => {
              // Catch any unhandled promise rejections from the IIFE
              setRestoreStatus({
                state: 'failed',
                errorMessage: err instanceof Error ? err.message : 'Failed to start restore',
              });
            });
          }}
          onClose={() => {
            closeSheet();
          }}
        />
      ),
    });
    
    setDropdownState({ isOpen: false, position: { x: 0, y: 0 }, backup: null });
  };

  const handleDelete = () => {
    if (!dropdownState.backup) return;
    
    const currentDeploymentName = extractDeploymentName(providedDeploymentUrl);
    
    // Get token for delete (same logic as in loadData)
    let deleteToken = teamAccessToken;
    if (!deleteToken) {
      const envToken = getTeamTokenFromEnv();
      if (envToken) {
        deleteToken = envToken;
      }
    }
    if (!deleteToken) {
      deleteToken = accessToken;
    }
    
    openSheet({
      title: 'Delete backup',
      width: '500px',
      content: (
        <DeleteBackupSheet
          backup={dropdownState.backup}
          deploymentName={currentDeploymentName}
          onDelete={async (backupId: number) => {
            if (!deleteToken) throw new Error('Access token is required');
            const currentTeamId = resolvedTeamId || teamId;
            if (!currentTeamId || typeof currentTeamId !== 'number') {
              throw new Error('Team ID is required to delete backup');
            }
            await deleteBackup(backupId, deleteToken);
            // Remove the deleted backup from the list instead of reloading everything
            setAllBackups(prevBackups => prevBackups.filter(backup => backup.id !== backupId));
            closeSheet();
          }}
          onClose={() => {
            closeSheet();
          }}
        />
      ),
    });
    
    setDropdownState({ isOpen: false, position: { x: 0, y: 0 }, backup: null });
  };

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Backup & Restore
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-panel-text-secondary)',
            fontSize: '14px',
            padding: '32px',
          }}
        >
          Loading backup information...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '49px',
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-panel-text)',
            margin: 0,
          }}
        >
          Backup & Restore
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Automatic Backup Checkbox */}
          {periodicBackupsEnabled ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--color-panel-text)',
              }}
            >
              <Checkbox
                checked={automaticBackup}
                onChange={(e) => {
                  if (canPerformActions && !isConfiguring) {
                    handleToggleAutomaticBackup(e.target.checked);
                  }
                }}
                disabled={!canPerformActions || isConfiguring}
                size={16}
              />
              <span>Backup automatically</span>
              {isConfiguring && (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-panel-text-muted)' }} />
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--color-panel-text)',
              }}
            >
              <Checkbox
                checked={false}
                onChange={() => {}}
                disabled={true}
                size={16}
              />
              <span>Backup automatically</span>
              <ProBadge tooltip="Automatic backups are only available on the Pro plan." />
            </div>
          )}

          {/* Backup Now Button */}
          <BackupButtonWithTooltip
            isDisabled={isCreatingBackup || backups.length >= 2}
            isCreating={isCreatingBackup}
            onClick={handleBackupNow}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Description */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-panel-border)',
            fontSize: '14px',
            color: 'var(--color-panel-text-secondary)',
          }}
        >
          Use this page to automatically or manually backup and restore your deployment data.{' '}
          <a
            href="https://docs.convex.dev/database/backup-restore"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-panel-info)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Learn more
          </a>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
              borderBottom: '1px solid var(--color-panel-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-panel-error)',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Restore status */}
        {restoreStatus && restoreStatus.state && (() => {
          const isInProgress = restoreStatus.state === 'in_progress' || restoreStatus.state === 'uploaded' || restoreStatus.state === 'waiting_for_confirmation';
          const isCompleted = restoreStatus.state === 'completed';
          const isFailed = restoreStatus.state === 'failed';
          
          return (
            <>
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--color-panel-border)',
                  backgroundColor: 'var(--color-panel-bg)',
                }}
              >
                {isInProgress && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minHeight: '64px',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--color-panel-text)',
                          flex: '1 1 auto',
                        }}
                      >
                        Restoring from a backup
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-panel-text-secondary)',
                          textAlign: 'right',
                          minWidth: '224px',
                        }}
                      >
                        {restoreStatus.progressMessage || 
                         (restoreStatus.state === 'waiting_for_confirmation' ? 'Starting the restore…' : 
                          restoreStatus.state === 'uploaded' ? 'Uploading snapshot...' :
                          restoreStatus.state === 'in_progress' ? 'Importing...' : 
                          'In progress...')}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '16px',
                        backgroundColor: 'var(--color-panel-bg-tertiary)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                      role="progressbar"
                      aria-valuenow={undefined}
                      aria-label="In progress"
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0))',
                          backgroundSize: '1rem',
                          backgroundColor: 'var(--color-panel-accent)',
                          paddingLeft: '2rem',
                          animation: 'progressBarAnimation 0.5s linear infinite',
                        }}
                      />
                    </div>
                  </div>
                )}
                {isCompleted && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      minHeight: '64px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-panel-border)',
                      backgroundColor: 'var(--color-panel-bg-secondary)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flex: '1 1 auto',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0,
                      }}
                    >
                      <CheckCircle2 size={20} style={{ color: 'var(--color-panel-success)', flexShrink: 0 }} />
                      <p
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.4',
                          color: 'var(--color-panel-text-secondary)',
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        <strong style={{ color: 'var(--color-panel-text)', fontWeight: 600 }}>
                          {restoreStatus.restoredRowsCount !== undefined 
                            ? `${restoreStatus.restoredRowsCount.toLocaleString()} ${restoreStatus.restoredRowsCount === 1 ? 'document' : 'documents'}`
                            : 'Documents'}
                        </strong>{' '}
                        {restoreStatus.restoredRowsCount === 1 ? 'was' : 'were'} restored from a backup{' '}
                        {restoreStatus.completedTime && (
                          <span style={{ fontSize: '14px', color: 'inherit' }}>
                            {formatRelativeTime(restoreStatus.completedTime.getTime())}
                          </span>
                        )}
                        .
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentDeploymentName = extractDeploymentName(providedDeploymentUrl) || 'Current Deployment';
                        const projectName = resolvedProjectId ? `Project ${resolvedProjectId}` : undefined;
                        openSheet({
                          title: 'Restore Details',
                          width: '800px',
                          content: (
                            <RestoreDetailsSheet
                              restoreStatus={restoreStatus}
                              backupInfo={restoreStatus.backupInfo}
                              deploymentInfo={{
                                name: currentDeploymentName,
                                projectName: projectName,
                              }}
                              tableChanges={restoreStatus.tableChanges}
                            />
                          ),
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: '6px',
                        color: 'var(--color-panel-text)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      More Details
                    </button>
                  </div>
                )}
                {isFailed && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      minHeight: '64px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-panel-border)',
                      backgroundColor: 'var(--color-panel-bg-secondary)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flex: '1 1 auto',
                        alignItems: 'flex-start',
                        gap: '8px',
                        minWidth: 0,
                      }}
                    >
                      <XCircle size={20} style={{ color: 'var(--color-panel-error)', flexShrink: 0, marginTop: '2px' }} />
                      <p
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.4',
                          color: 'var(--color-panel-text-secondary)',
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        The restore started{' '}
                        {restoreStatus.completedTime && (
                          <span style={{ fontSize: '14px', color: 'inherit' }}>
                            {formatRelativeTime(restoreStatus.completedTime.getTime())}
                          </span>
                        )}{' '}
                        failed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentDeploymentName = extractDeploymentName(providedDeploymentUrl) || 'Current Deployment';
                        const projectName = resolvedProjectId ? `Project ${resolvedProjectId}` : undefined;
                        openSheet({
                          title: 'Restore Details',
                          width: '800px',
                          content: (
                            <RestoreDetailsSheet
                              restoreStatus={restoreStatus}
                              backupInfo={restoreStatus.backupInfo}
                              deploymentInfo={{
                                name: currentDeploymentName,
                                projectName: projectName,
                              }}
                              tableChanges={restoreStatus.tableChanges}
                            />
                          ),
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-panel-border)',
                        borderRadius: '6px',
                        color: 'var(--color-panel-text)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      More Details
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid var(--color-panel-border)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-panel-text-muted)',
            backgroundColor: 'var(--color-panel-bg)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <div style={{ width: '40%' }}>Backup</div>
            <div style={{ width: '100px' }}>Status</div>
            <div style={{ width: '120px' }}>Type</div>
            <div style={{ flex: 1 }}>Expires</div>
            <div style={{ width: '120px' }}></div>
          </div>

          {/* Table Content */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-panel-bg)' }}>
            <style>{`
              @keyframes spin {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
              @keyframes progressBarAnimation {
                0% {
                  transform: translateX(-2rem);
                }
                100% {
                  transform: translateX(0);
                }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
            {backups.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'color-mix(in srgb, var(--color-panel-accent) 10%, transparent)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <HardDrive size={32} style={{ color: 'var(--color-panel-accent)' }} />
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'var(--color-panel-text)',
                  marginBottom: '8px',
                }}
              >
                No backups in this deployment.
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-panel-text-secondary)',
                  marginBottom: '16px',
                  maxWidth: '400px',
                }}
              >
                With backups, you can periodically generate snapshots of your deployment data to restore later.
              </p>
              <a
                href="https://docs.convex.dev/database/backup-restore"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--color-panel-info)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Learn more about backups.
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div>
              {backups.map((backup) => {
                const stateColor =
                  backup.state === 'complete'
                    ? 'var(--color-panel-success)'
                    : backup.state === 'failed'
                    ? 'var(--color-panel-error)'
                    : backup.state === 'inProgress'
                    ? 'var(--color-panel-info)'
                    : 'var(--color-panel-text-muted)';

                return (
                  <div
                    key={backup.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderBottom: '1px solid var(--color-panel-border)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--color-panel-text-secondary)',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Backup Info */}
                    <div
                      style={{
                        width: '40%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--color-panel-text)',
                          fontFamily: 'monospace',
                        }}
                      >
                        Backup from {formatDate(backup.requestedTime)}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-panel-text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        ({formatRelativeTime(backup.requestedTime)})
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-panel-text-muted)',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {backup.sourceDeploymentName || backup.id}
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      style={{
                        width: '100px',
                        fontSize: '11px',
                        color: stateColor,
                        textTransform: 'capitalize',
                        fontFamily: 'monospace',
                      }}
                    >
                      {backup.state === 'inProgress' ? 'In Progress' : backup.state}
                    </div>

                    {/* Type */}
                    <div
                      style={{
                        width: '120px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--color-panel-text)',
                      }}
                    >
                      {backup.includeStorage ? 'Tables & Storage' : 'Tables only'}
                    </div>

                    {/* Expires */}
                    <div
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: backup.expirationTime && backup.expirationTime < Date.now()
                          ? 'var(--color-panel-error)'
                          : backup.expirationTime
                          ? 'var(--color-panel-error)'
                          : 'var(--color-panel-text)',
                      }}
                    >
                      {backup.expirationTime
                        ? backup.expirationTime < Date.now()
                          ? 'Expired'
                          : `Expires in ${Math.ceil((backup.expirationTime - Date.now()) / (1000 * 60 * 60 * 24))} days`
                        : 'No expiration'}
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        width: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={(e) => handleDropdownToggle(e, backup)}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-panel-text-muted)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                        }}
                        title="Actions"
                      >
                        <MoreVertical size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
      
      {/* Backup Actions Dropdown */}
      {dropdownState.backup && (
        <BackupActionsDropdown
          isOpen={dropdownState.isOpen}
          onClose={() => setDropdownState({ isOpen: false, position: { x: 0, y: 0 }, backup: null })}
          position={dropdownState.position}
          onDownload={handleDownload}
          onRestore={handleRestore}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
