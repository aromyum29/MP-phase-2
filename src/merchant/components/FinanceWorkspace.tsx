import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Finance } from "./Finance";
import { BankAccount } from "./BankAccount";
import { MerchantLoans } from "./MerchantLoans";
import { usePortalIteration } from "./IterationProvider";

export type FinanceSection = "statement" | "bank-account" | "merchant-loans";
export function FinanceWorkspace({
  section,
  onSectionChange,
}: {
  section: FinanceSection;
  onSectionChange: (section: FinanceSection) => void;
}) {
  const { iteration } = usePortalIteration();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {iteration === "2"
            ? "Your earnings, payout account, and business funding."
            : "Your earnings and payout account."}
        </p>
      </div>
      <Tabs
        value={section}
        onValueChange={(value) => onSectionChange(value as FinanceSection)}
        className="gap-6"
      >
        <TabsList
          aria-label="Finance sections"
          className={`grid h-auto w-full max-w-full gap-1 p-1.5 sm:inline-flex sm:w-fit ${iteration === "2" ? "grid-cols-3" : "grid-cols-2"}`}
        >
          <TabsTrigger
            value="statement"
            className="h-full min-h-11 whitespace-normal px-2 text-xs sm:whitespace-nowrap sm:px-4 sm:text-sm"
          >
            Financial statement
          </TabsTrigger>
          <TabsTrigger
            value="bank-account"
            className="h-full min-h-11 whitespace-normal px-2 text-xs sm:whitespace-nowrap sm:px-4 sm:text-sm"
          >
            Bank account
          </TabsTrigger>
          {iteration === "2" && (
            <TabsTrigger
              value="merchant-loans"
              className="h-full min-h-11 whitespace-normal px-2 text-xs sm:whitespace-nowrap sm:px-4 sm:text-sm"
            >
              Merchant credit
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="statement" forceMount className="data-[state=inactive]:hidden">
          <Finance />
        </TabsContent>
        <TabsContent value="bank-account" forceMount className="data-[state=inactive]:hidden">
          <BankAccount />
        </TabsContent>
        {iteration === "2" && (
          <TabsContent value="merchant-loans" forceMount className="data-[state=inactive]:hidden">
            <MerchantLoans />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
