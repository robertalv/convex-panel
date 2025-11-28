import { toast as sonnerToast } from 'sonner';

type ToastType = "success" | "error" | "info" | "warning";

/**
 * Display a toast notification
 * @param type The type of toast (success, error, info, warning)
 * @param message The message to display
 */
export const toast = (type: ToastType, message: string) => {
  switch (type) {
    case 'success':
      sonnerToast.success(message);
      break;
    case 'error':
      sonnerToast.error(message);
      break;
    case 'info':
      sonnerToast.info(message);
      break;
    case 'warning':
      sonnerToast.warning(message);
      break;
    default:
      sonnerToast(message);
  }
};

/**
 * Copy text to clipboard and show a toast notification
 * @param text The text to copy to clipboard
 * @param successMessage Optional custom success message (defaults to "Copied to clipboard!")
 * @param errorMessage Optional custom error message (defaults to "Failed to copy to clipboard")
 * @returns Promise that resolves to true if copy was successful, false otherwise
 */
export const copyToClipboard = async (
  text: string,
  successMessage: string = 'Copied to clipboard!',
  errorMessage: string = 'Failed to copy to clipboard'
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    toast('success', successMessage);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    toast('error', errorMessage);
    return false;
  }
}; 