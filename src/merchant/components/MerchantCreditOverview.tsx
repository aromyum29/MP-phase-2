import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { BankLogo } from "./BankLogo";
import { FinanceButton as Button } from "./FinanceButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  currency,
  dateLabel,
  lenders,
  type LoanForm,
  type LoanRequest,
  type LoanStatus,
} from "./FinanceData";
import { Status } from "./FinanceShared";

// Illustrative future slots only. Add an onboarded bank to FinanceData.lenders
// to make its request flow available; iteration 2 keeps its existing layout.
const futureBanks = [
  { id: "commercial", name: "Commercial Bank" },
  { id: "hnb", name: "Hatton National Bank" },
  { id: "boc", name: "Bank of Ceylon" },
  { id: "nations-trust", name: "Nations Trust Bank" },
  { id: "dfcc", name: "DFCC Bank" },
];
const filters = ["All", "Pending", "Accepted", "Rejected"] as const;
type RequestFilter = (typeof filters)[number];
export type CreditSection = "banks" | "history";
const emptyCopy: Record<LoanStatus, string> = {
  Pending: "Requests awaiting a response from the bank will appear here.",
  Accepted: "When a bank accepts your request, you can find its next steps here.",
  Rejected: "Requests that were not accepted by a bank will appear here.",
};

export function MerchantCreditOverview({
  loans,
  drafts,
  section,
  onSectionChange,
  onStart,
  onView,
}: {
  loans: LoanRequest[];
  drafts: Record<string, LoanForm>;
  section: CreditSection;
  onSectionChange: (section: CreditSection) => void;
  onStart: (bankId: string) => void;
  onView: (requestId: string, nextSteps?: boolean) => void;
}) {
  const [filter, setFilter] = useState<RequestFilter>("All");
  const banks = [
    ...lenders,
    ...futureBanks.filter((bank) => !lenders.some((lender) => lender.id === bank.id)),
  ];
  const filtered = loans.filter((request) => filter === "All" || request.status === filter);
  const draftEntries = Object.entries(drafts).filter(
    ([id]) =>
      lenders.some((bank) => bank.id === id) &&
      !loans.some((request) => request.bankId === id && request.status !== "Rejected"),
  );
  const bankName = (id: string) => banks.find((bank) => bank.id === id)?.name ?? "Bank";
  const requestAction = (request: LoanRequest) => (
    <Button
      variant="outline"
      className="min-h-11"
      aria-label={`${request.status === "Accepted" ? "Next steps for" : "View request"} ${request.id}`}
      onClick={() => onView(request.id, request.status === "Accepted")}
    >
      {request.status === "Accepted" ? "Next steps" : "View request"}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <Tabs
      value={section}
      onValueChange={(value) => onSectionChange(value as CreditSection)}
      className="gap-6"
    >
      <TabsList aria-label="Merchant credit sections" className="h-auto w-full sm:w-fit">
        <TabsTrigger value="banks" className="min-h-11 px-5">
          Banks
        </TabsTrigger>
        <TabsTrigger value="history" className="min-h-11 px-5">
          Request history
        </TabsTrigger>
      </TabsList>
      <TabsContent value="banks" className="m-0">
        <section aria-labelledby="credit-banks-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="credit-banks-heading" className="text-lg font-semibold">
                Available banks
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a bank to request funding for your business.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {lenders.length} {lenders.length === 1 ? "bank" : "banks"} accepting requests
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {banks.map((bank) => {
              const available = lenders.some((lender) => lender.id === bank.id);
              const active = loans.find(
                (request) => request.bankId === bank.id && request.status !== "Rejected",
              );
              const draft = drafts[bank.id];
              return (
                <article
                  key={bank.id}
                  aria-label={bank.name}
                  className={`flex min-w-0 flex-col rounded-2xl border border-border/70 p-5 ${available ? "bg-card shadow-sm" : "bg-muted/20"}`}
                >
                  <div className="flex items-center gap-3">
                    <BankLogo bank={bank.name} />
                    <h3 className="text-sm font-semibold leading-snug">{bank.name}</h3>
                  </div>
                  <p className="mb-5 mt-4 text-sm text-muted-foreground">
                    {available ? "Business funding through Koko" : "Coming soon"}
                  </p>
                  {available ? (
                    <Button
                      className="mt-auto min-h-11 w-full"
                      variant={active || draft ? "outline" : "default"}
                      aria-label={`${active ? "View request with" : draft ? "Continue draft with" : "Start merchant credit request with"} ${bank.name}`}
                      onClick={() => (active ? onView(active.id) : onStart(bank.id))}
                    >
                      {active
                        ? `View ${active.status.toLowerCase()} request`
                        : draft
                          ? "Continue draft"
                          : "Request merchant credit"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="mt-auto min-h-11 w-full">
                      Not available yet
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Sampath is currently available. Other banks are illustrative examples for future
            onboarding.
          </p>
          <details className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">How Merchant credit works</summary>
            <ol className="mt-4 grid gap-4 pb-1 text-muted-foreground sm:grid-cols-3">
              <li>
                <span className="mb-1 block font-medium text-foreground">1. Send a request</span>
                Tell your chosen bank about your business and funding needs.
              </li>
              <li>
                <span className="mb-1 block font-medium text-foreground">
                  2. The bank reviews it
                </span>
                The bank decides on eligibility and confirms any credit terms.
              </li>
              <li>
                <span className="mb-1 block font-medium text-foreground">
                  3. Follow your next steps
                </span>
                Track the response in Request history and continue with the bank when accepted.
              </li>
            </ol>
          </details>
        </section>
      </TabsContent>
      <TabsContent value="history" className="m-0">
        <section aria-labelledby="credit-requests-heading" className="space-y-4">
          <div>
            <h2 id="credit-requests-heading" className="text-lg font-semibold">
              Merchant credit requests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track bank responses and continue where you left off.
            </p>
          </div>
          {draftEntries.length > 0 && (
            <div className="space-y-2" aria-label="Saved drafts">
              {draftEntries.map(([id, draft]) => (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {bankName(id)}{" "}
                      <span className="ml-2 font-normal text-muted-foreground">Draft</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {draft.amount ? currency(draft.amount) : "Amount not entered"} · Not submitted
                    </p>
                  </div>
                  <Button variant="outline" className="min-h-11" onClick={() => onStart(id)}>
                    Resume draft
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as RequestFilter)}
            className="gap-4"
          >
            <TabsList
              aria-label="Merchant credit request status"
              className="h-auto w-full justify-start sm:w-fit"
            >
              {filters.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="min-h-11 gap-1 px-2 sm:gap-2 sm:px-4"
                >
                  {status}
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {status === "All"
                      ? loans.length
                      : loans.filter((request) => request.status === status).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={filter} className="m-0">
              {filtered.length ? (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-border/70 xl:block">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">
                        {filter === "All"
                          ? "All merchant credit requests"
                          : `${filter} merchant credit requests`}
                      </caption>
                      <thead className="bg-muted/30 text-xs text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-4 py-3 font-medium">
                            Bank / reference
                          </th>
                          <th scope="col" className="px-4 py-3 font-medium">
                            Requested amount
                          </th>
                          <th scope="col" className="px-4 py-3 font-medium">
                            Submitted
                          </th>
                          <th scope="col" className="px-4 py-3 font-medium">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-3">
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filtered.map((request) => (
                          <tr key={request.id}>
                            <th scope="row" className="px-4 py-4 font-normal">
                              <div className="flex items-center gap-3">
                                <BankLogo bank={bankName(request.bankId)} />
                                <div>
                                  <p className="font-medium">{bankName(request.bankId)}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{request.id}</p>
                                </div>
                              </div>
                            </th>
                            <td className="px-4 py-4">
                              <p className="whitespace-nowrap font-medium tabular-nums">
                                {currency(request.form.amount)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {request.form.purpose}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                              {dateLabel(request.date)}
                            </td>
                            <td className="px-4 py-4">
                              <Status status={request.status} />
                            </td>
                            <td className="px-4 py-4 text-right">{requestAction(request)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="space-y-3 xl:hidden">
                    {filtered.map((request) => (
                      <li
                        key={request.id}
                        className="space-y-4 rounded-xl border border-border/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <BankLogo bank={bankName(request.bankId)} />
                            <h3 className="text-sm font-semibold">{bankName(request.bankId)}</h3>
                          </div>
                          <Status status={request.status} />
                        </div>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">Requested amount</dt>
                            <dd className="mt-1 font-medium tabular-nums">
                              {currency(request.form.amount)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Submitted</dt>
                            <dd className="mt-1">{dateLabel(request.date)}</dd>
                          </div>
                        </dl>
                        <p className="text-xs text-muted-foreground">
                          {request.id} · {request.form.purpose}
                        </p>
                        {requestAction(request)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
                  <FileText
                    className="mx-auto mb-3 h-6 w-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">
                    {filter === "All"
                      ? "No merchant credit requests yet"
                      : `No ${filter.toLowerCase()} requests`}
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {filter === "All"
                      ? "Choose an available bank to get started. Your submitted merchant credit requests and bank responses will appear here."
                      : emptyCopy[filter]}
                  </p>
                  {filter === "All" ? (
                    <Button className="mt-4 min-h-11" onClick={() => onSectionChange("banks")}>
                      Explore banks
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="mt-3 min-h-11"
                      onClick={() => setFilter("All")}
                    >
                      View all requests
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </TabsContent>
    </Tabs>
  );
}
