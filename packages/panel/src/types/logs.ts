export const LOG_TYPES = [
  { value: 'success', label: 'success' },
  { value: 'failure', label: 'failure' },
  { value: 'debug', label: 'debug' },
  { value: 'log / info', label: 'log / info' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' },
];

export type LogType = (typeof LOG_TYPES)[number];