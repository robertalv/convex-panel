import { ContextMenuEntry } from '../../../components/shared/context-menu';
import { copyToClipboard } from '../../../utils/toast';
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
    onClick: () => console.log('View field', column, value),
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
    onClick: () => console.log('Filter equals', column, value),
  },
  {
    label: 'Filter is not null',
    onClick: () => console.log('Filter is not null', column),
  },
  { type: 'divider' },
  {
    label: 'View document',
    shortcut: '⇧Space',
    onClick: () => console.log('View document', rowId),
  },
  {
    label: 'Copy document',
    shortcut: '⌘⇧C',
    onClick: () => console.log('Copy document', rowId),
  },
  {
    label: 'Delete document',
    destructive: true,
    onClick: () => console.log('Delete document', rowId),
  },
];

