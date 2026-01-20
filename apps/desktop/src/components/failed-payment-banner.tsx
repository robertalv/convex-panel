import type { Invoice } from "@convex-panel/shared/api";

interface FailedPaymentBannerProps {
  teamSlug: string;
  onOpenBilling: () => void;
}

export function FailedPaymentBanner({
  teamSlug: _teamSlug,
  onOpenBilling,
}: FailedPaymentBannerProps) {
  return (
    <div className="flex flex-wrap items-center px-4 py-2 gap-1 border-b border-red-500 bg-red-500/50 text-xs h-[40px]">
      Your latest subscription payment has failed.{" "}
      <button
        onClick={onOpenBilling}
        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
      >
        Update your payment method
      </button>{" "}
      to avoid a service interruption.
    </div>
  );
}

export function useShowFailedPaymentBanner(invoices: Invoice[]): boolean {
  const failedInvoice = invoices.find(
    (invoice) => invoice.status === "issued" && invoice.hasFailedPayment,
  );

  return failedInvoice !== undefined;
}
