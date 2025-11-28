import { ContextMenuEntry } from '../../../../components/shared/context-menu';
import { copyToClipboard } from '../../../../utils/toast';
import { formatValue } from './data-table-utils';

export const buildCellMenuItems = (
  column: string,
  value: any,
  rowId: string,
  onEdit?: (rowId: string, column: string, value: any) => void,
): ContextMenuEntry[] => [
  {
    label: `View ${column}`,
    shortcut: 'Space',
    onClick: () => {},
  },
  {
    label: `Copy ${column}`,
    shortcut: '⌘C',
    onClick: () => copyToClipboard(formatValue(value)),
  },
  ...(column !== '_id' && column !== '_creationTime' ? [{
    label: `Edit ${column}`,
    shortcut: '↩',
    onClick: () => {
      if (onEdit) {
        onEdit(rowId, column, value);
      }
    },
  }] : []),
  { type: 'divider' },
  {
    label: 'Filter equals',
    onClick: () => {},
  },
  {
    label: 'Filter is not null',
    onClick: () => {},
  },
  { type: 'divider' },
  {
    label: 'View document',
    shortcut: '⇧Space',
    onClick: () => {},
  },
  {
    label: 'Copy document',
    shortcut: '⌘⇧C',
    onClick: () => {},
  },
  {
    label: 'Delete document',
    destructive: true,
    onClick: () => {},
  },
];

