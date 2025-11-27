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