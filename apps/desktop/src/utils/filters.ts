import { LogType } from "../utils/constants";
import type { LogEntry } from "@convex-panel/shared";

// Memoizable filter predicates
const createLogTypeFilter = (logType: LogType) => (log: LogEntry): boolean => {
  // Always exclude frontend logs from regular logs view
  if (log.topic === 'frontend') {
    return false;
  }
  
  if (logType === LogType.ALL) return true;
  
  switch (logType) {
    case LogType.HTTP:
      return log.function?.type === 'HttpAction';
    case LogType.SUCCESS:
      return log.status === 'success';
    case LogType.FAILURE:
      // Check for explicit failure status
      if (log.status === 'error' || log.status === 'failure') return true;
      
      // Check for error message
      if (log.error_message) return true;
      
      // Check for error in raw data
      if (log.raw) {
        return !!log.raw.error || 
               log.raw.failure === true || 
               log.raw.success === false;
      }
      
      return false;
    case LogType.DEBUG:
      return log.log_level?.toLowerCase() === 'debug';
    case LogType.INFO:
      return log.log_level?.toLowerCase() === 'info' || log.log_level?.toLowerCase() === 'loginfo';
    case LogType.WARN:
      return log.log_level?.toLowerCase() === 'warn' || log.log_level?.toLowerCase() === 'warning';
    case LogType.ERROR:
      return log.log_level?.toLowerCase() === 'error';
    default:
      // For any other type, check both function type and log_level
      const logTypeStr = String(logType).toLowerCase();
      const typeMatch = log.function?.type ? log.function.type.toLowerCase() === logTypeStr : false;
      const logLevelMatch = log.log_level ? log.log_level.toLowerCase() === logTypeStr : false;
      const topicMatch = log.topic ? log.topic.toLowerCase() === logTypeStr : false;
      return typeMatch || logLevelMatch || topicMatch;
  }
};

const createRequestIdFilter = (requestId: string) => (log: LogEntry): boolean => 
  !requestId || log.function?.request_id === requestId;

const createSuccessFilter = (showSuccess: boolean) => (log: LogEntry): boolean => 
  showSuccess || log.status !== 'success';

const createSearchTextFilter = (searchText: string) => (log: LogEntry): boolean => {
  if (!searchText) return true;
  
  const normalizedSearch = searchText.toLowerCase();
  const searchableFields = [
    log.function?.path,
    log.message,
    log.function?.request_id,
    log.error_message
  ];
  
  return searchableFields.some(field => 
    field?.toLowerCase().includes(normalizedSearch)
  );
};

export const createFilterPredicate = (
  logType: LogType,
  requestIdFilter: string,
  showSuccess: boolean,
  searchText: string
) => {
  // Create individual filter functions
  const logTypeFilter = createLogTypeFilter(logType);
  const requestIdFilterFn = createRequestIdFilter(requestIdFilter);
  const successFilter = createSuccessFilter(showSuccess);
  const searchTextFilter = createSearchTextFilter(searchText);
  
  // Return combined filter function
  return (log: LogEntry): boolean =>
    logTypeFilter(log) &&
    requestIdFilterFn(log) &&
    successFilter(log) &&
    searchTextFilter(log);
}; 