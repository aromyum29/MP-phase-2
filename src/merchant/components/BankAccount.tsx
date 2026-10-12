import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { BankLogo } from "./BankLogo";
import { usePortalIteration } from "./IterationProvider";
import { FinanceButton as Button } from "./FinanceButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useFinanceData, emptyAccount, reference, dateLabel, type Account } from "./FinanceData";
import { ErrorSummary, Field, panelClass, SectionIntro, Status, Summary } from "./FinanceShared";

const branches: Record<string, string[]> = {
  "Commercial Bank": ["Kollupitiya", "Colombo Fort", "Kandy"],
  "Sampath Bank": ["Head Office", "Kollupitiya", "Kandy"],
  "Hatton National Bank": ["Head Office", "Kollupitiya", "Kandy"],
  "Bank of Ceylon": ["Head Office", "Colombo Fort", "Kandy"],
};
const accountItems = (account: Account, masked = false): Array<[string, string]> => [
  ["Account holder", account.holder],
  ["Account number", masked ? `•••• ${account.number.slice(-4)}` : account.number],
  ["Bank", account.bank],
  ["Branch", account.branch],
];

export function BankAccount({ page = false }: { page?: boolean }) {
  const { iteration } = usePortalIteration();
  const RequestRow = iteration === "1" ? "div" : "button";
  const { data, setData, bankDraft, setBankDraft, statement, setStatement } = useFinanceData();
  const [view, setView] = useState<"overview" | "edit" | "review" | "success">("overview");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [view]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [receipt, setReceipt] = useState("");
  const pending = data.bankRequests.find((request) => request.status === "Pending");
  const detail = data.bankRequests.find((request) => request.id === selected);
  const update = (key: keyof Account, value: string) =>
    setBankDraft((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "bank" ? { branch: "" } : {}),
    }));
  const selectFile = (file?: File) => {
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setErrors({ statement: "Choose a PDF, JPG, or PNG bank statement." });
      return;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setErrors({ statement: "Choose a non-empty bank statement smaller than 5 MB." });
      return;
    }
    setStatement(file);
    setErrors({});
  };
  const review = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!bankDraft.holder.trim()) next.holder = "Enter the account holder’s name.";
    if (!bankDraft.bank) next.bank = "Select a bank.";
    if (bankDraft.bank && !bankDraft.branch) next.branch = "Select a branch.";
    if (!/^\d+$/.test(bankDraft.number.trim()))
      next.number = "Enter an account number using digits only.";
    if (!statement) next.statement = "Attach a bank statement for the new account.";
    if (JSON.stringify(bankDraft) === JSON.stringify(data.account))
      next.number = "Enter the new account details before requesting a change.";
    setErrors(next);
    if (!Object.keys(next).length) setView("review");
  };
  const submit = () => {
    if (pending || !statement) return;
    const id = reference("BA");
    setData((previous) =>
      previous.bankRequests.some((request) => request.status === "Pending")
        ? previous
        : {
            ...previous,
            bankRequests: [
              {
                id,
                date: new Date().toISOString(),
                status: "Pending",
                account: {
                  ...bankDraft,
                  holder: bankDraft.holder.trim(),
                  number: bankDraft.number.trim(),
                },
                filename: statement.name,
              },
              ...previous.bankRequests,
            ],
          },
    );
    setReceipt(id);
    setView("success");
    setBankDraft(emptyAccount);
    setStatement(null);
  };
  return (
    <div className="space-y-6">
      <SectionIntro title="Bank account" page={page}>
        Manage the account used for your Koko payouts.
      </SectionIntro>
      {view === "success" ? (
        <div className={`${panelClass} max-w-3xl`} role="status">
          <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-600" />
          <h3 className="text-xl font-semibold">Account change submitted</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your new bank details have been sent for review. Your current payout account stays
            active until the change is accepted.
          </p>
          <div className="my-6 flex flex-wrap items-center gap-3">
            <Status status="Pending" />
            <span className="text-sm">Reference: {receipt}</span>
          </div>
          <p className="mb-6 text-xs text-muted-foreground">
            Demo request only. No documents have been sent.
          </p>
          <Button onClick={() => setView("overview")}>View bank account</Button>
        </div>
      ) : view === "overview" ? (
        <>
          {pending && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div>
                <p className="text-sm font-semibold text-amber-900">Account change under review</p>
                <p className="mt-1 text-sm text-amber-800">
                  Your current account remains active. You can request another change once this
                  review is complete.
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelected(pending.id)}>
                View request
              </Button>
            </div>
          )}
          <div className={`${panelClass} max-w-4xl`}>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <BankLogo bank={data.account.bank} />
              <div>
                <h3 className="font-semibold">Current payout account</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Payouts are sent to this account
                </p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Active
              </span>
            </div>
            <Summary items={accountItems(data.account, true)} />
            <div className="mt-6 border-t border-border/60 pt-5">
              <Button
                variant="outline"
                disabled={Boolean(pending)}
                onClick={() => {
                  setErrors({});
                  setView("edit");
                }}
              >
                {Object.values(bankDraft).some((value) => value.trim()) && !pending
                  ? "Continue account change"
                  : "Request account change"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          {data.bankRequests.length > 0 && (
            <section className="max-w-4xl space-y-3">
              <h3 className="font-semibold">Change requests</h3>
              {data.bankRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  onClick={iteration === "1" ? undefined : () => setSelected(request.id)}
                  className={`${panelClass} flex w-full flex-wrap items-center justify-between gap-4 text-left ${iteration === "2" ? "transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}`}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {request.account.bank} · •••• {request.account.number.slice(-4)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {request.id} · {dateLabel(request.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Status status={request.status} />
                    {iteration === "1" ? (
                      <Button
                        aria-label={`View account change ${request.id}`}
                        onClick={() => setSelected(request.id)}
                      >
                        View request <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </div>
                </RequestRow>
              ))}
            </section>
          )}
          <p className="text-xs text-muted-foreground">
            Fictional Sri Lankan account details for this prototype.
          </p>
        </>
      ) : (
        <div className="max-w-3xl space-y-5">
          <Button
            variant="ghost"
            className="px-0"
            onClick={() => {
              setErrors({});
              setView(view === "review" ? "edit" : "overview");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {view === "review" ? "Back to account details" : "Back to bank account"}
          </Button>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Step {view === "edit" ? "1" : "2"} of 2
            </p>
            <h3 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
              {view === "edit" ? "New payout account" : "Review your account change"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {view === "edit"
                ? "Enter the new account details exactly as shown on your bank statement."
                : "Check the new details before sending your request for review."}
            </p>
          </div>
          {view === "edit" ? (
            <form noValidate onSubmit={review} className="space-y-5">
              <ErrorSummary errors={errors} />
              <div className={`${panelClass} space-y-6`}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="holder"
                    label="Account holder name"
                    value={bankDraft.holder}
                    onChange={(value) => update("holder", value)}
                    error={errors.holder}
                  />
                  <Field
                    id="number"
                    label="Account number"
                    inputMode="numeric"
                    value={bankDraft.number}
                    onChange={(value) => update("number", value)}
                    error={errors.number}
                  />
                  <Field
                    id="bank"
                    label="Bank"
                    value={bankDraft.bank}
                    options={Object.keys(branches)}
                    onChange={(value) => update("bank", value)}
                    error={errors.bank}
                  />
                  {bankDraft.bank && (
                    <Field
                      id="branch"
                      label="Branch"
                      value={bankDraft.branch}
                      options={branches[bankDraft.bank]}
                      onChange={(value) => update("branch", value)}
                      error={errors.branch}
                    />
                  )}
                </div>
                <div className="border-t border-border/60 pt-5">
                  <label htmlFor="statement" className="text-sm font-medium">
                    Bank statement
                  </label>
                  <p id="statement-hint" className="mt-1 text-xs text-muted-foreground">
                    Attach a statement showing the new account holder, bank, and account number.
                    PDF, JPG, or PNG, up to 5 MB.
                  </p>
                  <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 p-5">
                    <UploadCloud className="mb-3 h-6 w-6 text-muted-foreground" />
                    <input
                      id="statement"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      aria-describedby={errors.statement ? "statement-error" : "statement-hint"}
                      aria-invalid={Boolean(errors.statement)}
                      className={`block w-full text-sm file:mr-3 file:rounded-lg file:px-3 file:py-2 file:text-sm ${iteration === "1" ? "file:border-0 file:bg-gray-900 file:text-white file:cursor-pointer hover:file:bg-gray-800" : "file:border file:border-border file:bg-background"}`}
                      onChange={(event) => {
                        selectFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    {statement && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 break-all">
                          {statement.name}{" "}
                          <span className="text-muted-foreground">
                            ({Math.ceil(statement.size / 1024)} KB)
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setStatement(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  {errors.statement && (
                    <p id="statement-error" className="mt-2 text-sm text-destructive">
                      {errors.statement}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo only. The attachment stays in this browser and must be reattached after a
                reload.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">
                  Review change
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => setView("overview")}>
                  Save and exit
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className={panelClass}>
                <h4 className="mb-4 text-sm font-semibold">Current account</h4>
                <Summary items={accountItems(data.account, true)} />
              </div>
              <div className={panelClass}>
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Requested account</h4>
                  <Button variant="ghost" size="sm" onClick={() => setView("edit")}>
                    Edit
                  </Button>
                </div>
                <Summary
                  items={[
                    ...accountItems(bankDraft),
                    ["Bank statement", statement?.name || "Not attached"],
                  ]}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Your current account will remain active until this request is accepted.
              </p>
              <Button onClick={submit}>Submit for review</Button>
            </>
          )}
        </div>
      )}
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Account change request</DialogTitle>
            <DialogDescription>
              {detail?.id} · {detail && dateLabel(detail.date)}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              <Status status={detail.status} />
              <Summary
                items={[...accountItems(detail.account, true), ["Bank statement", detail.filename]]}
              />
              <p className="text-sm text-muted-foreground">
                {detail.status === "Pending"
                  ? "Your request is under review. Payouts continue to your current account."
                  : detail.status === "Accepted"
                    ? "This account change was accepted. Check your current payout account for the active details."
                    : "This request was not accepted. Check the account details and statement, then submit a new request."}
              </p>
              <details className="border-t pt-4 text-xs text-muted-foreground">
                <summary className="cursor-pointer">Preview a review response</summary>
                <p className="mt-3">Prototype controls only. No real account is changed.</p>
                <div className="mt-3 flex gap-2">
                  {(["Accepted", "Rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      disabled={detail.status !== "Pending"}
                      onClick={() =>
                        setData((previous) => ({
                          ...previous,
                          account: status === "Accepted" ? detail.account : previous.account,
                          bankRequests: previous.bankRequests.map((request) =>
                            request.id === detail.id ? { ...request, status } : request,
                          ),
                        }))
                      }
                    >
                      {status === "Accepted" ? "Accept change" : "Reject change"}
                    </Button>
                  ))}
                </div>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
