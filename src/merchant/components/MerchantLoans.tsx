import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileText } from "lucide-react";
import { BankLogo } from "./BankLogo";
import { usePortalIteration } from "./IterationProvider";
import { MerchantCreditOverview, type CreditSection } from "./MerchantCreditOverview";
import { FinanceButton as Button } from "./FinanceButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  useFinanceData,
  lenders,
  emptyLoan,
  currency,
  dateLabel,
  reference,
  type LoanForm,
  type LoanStatus,
} from "./FinanceData";
import { ErrorSummary, Field, panelClass, SectionIntro, Status, Summary } from "./FinanceShared";

const loanItems = (form: LoanForm, credit: boolean): Array<[string, string]> => [
  ["Requested amount", currency(form.amount)],
  [credit ? "Credit purpose" : "Loan purpose", form.purpose],
  ["Preferred repayment period", `${form.term} months`],
  ["Business name", form.business],
  ["Business registration number", form.registration],
  ["Contact person", form.contact],
  ["Mobile number", form.phone],
  ["Email", form.email],
  ["Average monthly revenue", currency(form.revenue)],
  ["Existing business borrowing", form.borrowing],
  ...(form.borrowing === "Yes"
    ? [
        [
          credit ? "Monthly credit repayments" : "Monthly loan repayments",
          currency(form.repayments),
        ] as [string, string],
      ]
    : []),
];

export function MerchantLoans({ page = false }: { page?: boolean }) {
  const { iteration } = usePortalIteration();
  const credit = iteration === "1";
  const steps = [
    credit ? "Your credit needs" : "Your loan needs",
    "Business and contact",
    "Business finances",
    "Review your request",
  ];
  const [overviewSection, setOverviewSection] = useState<CreditSection>("banks");
  const { data, setData } = useFinanceData();
  const [bankId, setBankId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (bankId) stepHeading.current?.focus();
  }, [bankId, step]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [handoff, setHandoff] = useState(false);
  const bank = lenders.find((lender) => lender.id === bankId);
  const form = bankId ? data.loanDrafts[bankId] || emptyLoan : emptyLoan;
  const detail = data.loans.find((request) => request.id === selected);
  const activeFor = (id: string) =>
    data.loans.find((request) => request.bankId === id && request.status !== "Rejected");
  const update = (key: keyof LoanForm, value: string) => {
    if (!bankId) return;
    setData((previous) => ({
      ...previous,
      loanDrafts: {
        ...previous.loanDrafts,
        [bankId]: {
          ...(previous.loanDrafts[bankId] || emptyLoan),
          [key]: value,
          ...(key === "borrowing" && value === "No" ? { repayments: "" } : {}),
        },
      },
    }));
  };
  const start = (id: string) => {
    setData((previous) => ({
      ...previous,
      loanDrafts: { ...previous.loanDrafts, [id]: previous.loanDrafts[id] || { ...emptyLoan } },
    }));
    setBankId(id);
    setStep(0);
    setErrors({});
    setReceipt(null);
  };
  const validate = () => {
    const next: Record<string, string> = {};
    const positive = (value: string) =>
      value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
    if (step === 0) {
      if (!positive(form.amount)) next.amount = "Enter a requested amount greater than zero.";
      if (!form.purpose)
        next.purpose = credit
          ? "Select what you need merchant credit for."
          : "Select what you need the loan for.";
      if (!form.term) next.term = "Select your preferred repayment period.";
    } else if (step === 1) {
      for (const key of ["business", "registration", "contact"] as const)
        if (!form[key].trim())
          next[key] =
            `Enter ${key === "business" ? "your business name" : key === "registration" ? "your business registration number" : "a contact person"}.`;
      if (!/^(?:0\d{9}|\+94\d{9})$/.test(form.phone.replace(/[\s-]/g, "")))
        next.phone = "Enter a Sri Lankan phone number, such as 077 123 4567.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        next.email = "Enter a valid email address.";
    } else if (step === 2) {
      if (
        form.revenue.trim() === "" ||
        !Number.isFinite(Number(form.revenue)) ||
        Number(form.revenue) < 0
      )
        next.revenue = "Enter your average monthly revenue, or 0.";
      if (!form.borrowing) next.borrowing = "Select whether your business has existing borrowing.";
      if (form.borrowing === "Yes" && !positive(form.repayments))
        next.repayments = credit
          ? "Enter your total monthly credit repayments."
          : "Enter your total monthly loan repayments.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const continueForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (validate()) setStep((previous) => previous + 1);
  };
  const submit = () => {
    if (!bankId || activeFor(bankId)) return;
    const id = reference("ML");
    setData((previous) => {
      if (
        previous.loans.some((request) => request.bankId === bankId && request.status !== "Rejected")
      )
        return previous;
      const drafts = { ...previous.loanDrafts };
      delete drafts[bankId];
      return {
        ...previous,
        loanDrafts: drafts,
        loans: [
          { id, bankId, status: "Pending", date: new Date().toISOString(), form: { ...form } },
          ...previous.loans,
        ],
      };
    });
    setReceipt(id);
    setBankId(null);
    setOverviewSection("history");
  };
  const setResponse = (status: LoanStatus) =>
    setData((previous) => {
      const target = previous.loans.find((request) => request.id === selected);
      if (
        !target ||
        (status !== "Rejected" &&
          previous.loans.some(
            (request) =>
              request.id !== selected &&
              request.bankId === target.bankId &&
              request.status !== "Rejected",
          ))
      )
        return previous;
      return {
        ...previous,
        loans: previous.loans.map((request) =>
          request.id === selected ? { ...request, status } : request,
        ),
      };
    });
  const field = (
    key: keyof LoanForm,
    label: string,
    extra: { options?: string[]; hint?: string; type?: string; inputMode?: "decimal" | "tel" } = {},
  ) => (
    <Field
      id={key}
      label={label}
      value={form[key]}
      onChange={(value) => update(key, value)}
      error={errors[key]}
      {...extra}
    />
  );

  return (
    <div className="space-y-6">
      <SectionIntro title="Merchant credit" page={page}>
        {credit
          ? "Explore partner banks and track your merchant credit requests."
          : "Explore business funding from partner banks and track your loan requests."}
      </SectionIntro>
      {receipt ? (
        <div className={`${panelClass} max-w-3xl`} role="status">
          <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-600" />
          <h3 className="text-xl font-semibold">
            {credit ? "Merchant credit request submitted" : "Loan request submitted"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your request is pending review by{" "}
            {
              lenders.find(
                (lender) =>
                  lender.id === data.loans.find((request) => request.id === receipt)?.bankId,
              )?.name
            }
            {credit
              ? ". You can track the bank’s response in Request history."
              : ". You can track the bank’s response in Your loan requests."}
          </p>
          <div className="my-6 flex flex-wrap items-center gap-3">
            <Status status="Pending" />
            <span className="text-sm">Reference: {receipt}</span>
          </div>
          <p className="mb-6 text-xs text-muted-foreground">
            Demo submission. Nothing has been sent to a bank.
          </p>
          <Button
            onClick={() => {
              setSelected(receipt);
              setReceipt(null);
            }}
          >
            {credit ? "View merchant credit request" : "View loan request"}
          </Button>
          <Button variant="ghost" className="ml-2" onClick={() => setReceipt(null)}>
            {credit ? "Go to request history" : "Back to overview"}
          </Button>
        </div>
      ) : bank ? (
        <div className="max-w-3xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="px-0"
              onClick={() => {
                setErrors({});
                if (step) setStep(step - 1);
                else setBankId(null);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step ? "Back" : "Back to merchant credit"}
            </Button>
            <span className="text-sm font-medium">{bank.name}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Step {step + 1} of 4</p>
            <div className="my-3 flex gap-1.5" aria-hidden="true">
              {steps.map((title, index) => (
                <div
                  key={title}
                  className={`h-1 flex-1 rounded-full ${index <= step ? "bg-foreground/70" : "bg-muted"}`}
                />
              ))}
            </div>
            <h3 ref={stepHeading} tabIndex={-1} className="text-xl font-semibold outline-none">
              {steps[step]}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {
                [
                  credit
                    ? "Tell the bank what your business needs. These are preferences, not confirmed credit terms."
                    : "Tell the bank what your business needs. These are preferences, not confirmed loan terms.",
                  "Confirm your business details and how the bank can reach you.",
                  "Give the bank a brief picture of your business finances.",
                  "Check your details before sending your request to the bank for review.",
                ][step]
              }
            </p>
          </div>
          {step < 3 ? (
            <form noValidate onSubmit={continueForm} className="space-y-5">
              <ErrorSummary errors={errors} />
              <div className={`${panelClass} grid gap-5 sm:grid-cols-2`}>
                {step === 0 && (
                  <>
                    {field("amount", "Requested amount (LKR)", { inputMode: "decimal" })}
                    {field("purpose", credit ? "Credit purpose" : "Loan purpose", {
                      options: [
                        "Buy stock",
                        "Business expansion",
                        "Equipment",
                        "Working capital",
                        "Other",
                      ],
                    })}
                    {field("term", "Preferred repayment period", {
                      options: ["6", "12", "24", "36"],
                      hint: "In months. The bank will confirm available terms.",
                    })}
                  </>
                )}
                {step === 1 && (
                  <>
                    {field("business", "Registered business name")}
                    {field("registration", "Business registration number")}
                    {field("contact", "Contact person")}
                    {field("phone", "Mobile number", {
                      type: "tel",
                      inputMode: "tel",
                      hint: "For example, 077 123 4567",
                    })}
                    {field("email", "Email address", { type: "email" })}
                  </>
                )}
                {step === 2 && (
                  <>
                    {field("revenue", "Average monthly revenue (LKR)", { inputMode: "decimal" })}
                    {field("borrowing", "Existing business borrowing", { options: ["Yes", "No"] })}
                    {form.borrowing === "Yes" &&
                      field(
                        "repayments",
                        credit
                          ? "Monthly credit repayments (LKR)"
                          : "Monthly loan repayments (LKR)",
                        {
                          inputMode: "decimal",
                          hint: credit
                            ? "Total repayments across your existing business credit."
                            : "Total repayments across your existing business loans.",
                        },
                      )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">
                  {step === 2 ? "Review request" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setBankId(null);
                    setOverviewSection("history");
                  }}
                >
                  Save and exit
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sample application fields for this prototype. Drafts are saved in this browser tab.
              </p>
            </form>
          ) : (
            <>
              {[
                {
                  title: credit ? "Credit needs" : "Loan needs",
                  items: loanItems(form, credit).slice(0, 3),
                  index: 0,
                },
                {
                  title: "Business and contact",
                  items: loanItems(form, credit).slice(3, 8),
                  index: 1,
                },
                { title: "Business finances", items: loanItems(form, credit).slice(8), index: 2 },
              ].map((group) => (
                <div key={group.title} className={panelClass}>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{group.title}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${group.title.toLowerCase()}`}
                      onClick={() => setStep(group.index)}
                    >
                      Edit
                    </Button>
                  </div>
                  <Summary items={group.items} />
                </div>
              ))}
              <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Your request and the information above are intended for {bank.name}. The bank
                reviews the request and decides whether to accept it.{" "}
                {credit
                  ? "Submission does not guarantee merchant credit. In this prototype, no information is sent."
                  : "Submission does not guarantee a loan. In this demo, no information is sent."}
              </div>
              <Button onClick={submit}>Submit for review</Button>
            </>
          )}
        </div>
      ) : iteration === "1" ? (
        <MerchantCreditOverview
          loans={data.loans}
          drafts={data.loanDrafts}
          section={overviewSection}
          onSectionChange={setOverviewSection}
          onStart={start}
          onView={(id, nextSteps = false) => {
            setSelected(id);
            setHandoff(nextSteps);
          }}
        />
      ) : (
        <>
          {Object.entries(data.loanDrafts).length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold">Your drafts</h3>
              {Object.entries(data.loanDrafts).map(([id, draft]) => (
                <div
                  key={id}
                  className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {lenders.find((lender) => lender.id === id)?.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Draft · {draft.amount ? currency(draft.amount) : "Amount not entered"}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => start(id)}>
                    Resume request
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </section>
          )}
          {data.loans.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-semibold">Your loan requests</h3>
              <div className="space-y-3">
                {data.loans.map((request) => (
                  <div
                    className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}
                    key={request.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden rounded-xl bg-muted p-3 sm:block">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {lenders.find((lender) => lender.id === request.bankId)?.name}{" "}
                          <span className="ml-2 font-medium tabular-nums">
                            {currency(request.form.amount)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.id} · {dateLabel(request.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Status status={request.status} />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelected(request.id);
                          setHandoff(false);
                        }}
                      >
                        View request
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="space-y-4">
            <h3 className="font-semibold">Available banks</h3>
            <div className="grid gap-5 lg:grid-cols-2">
              {lenders.map((lender) => {
                const active = activeFor(lender.id);
                const draft = data.loanDrafts[lender.id];
                return (
                  <div key={lender.id} className={panelClass}>
                    <div className="flex items-center gap-3">
                      <BankLogo bank={lender.name} />
                      <div>
                        <h4 className="font-semibold">{lender.name}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Business funding partner
                        </p>
                      </div>
                    </div>
                    <p className="my-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                      {lender.description}
                    </p>
                    <div className="mb-5 rounded-xl bg-muted/40 p-4 text-sm">
                      <p className="font-medium">How it works</p>
                      <ol className="mt-2 space-y-2 text-muted-foreground">
                        <li>1. Tell us about your business and funding needs.</li>
                        <li>2. The bank reviews your request.</li>
                        <li>3. Track the response and your next steps here.</li>
                      </ol>
                    </div>
                    {active ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelected(active.id);
                            setHandoff(false);
                          }}
                        >
                          View {active.status.toLowerCase()} request
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <p className="mt-3 text-xs text-muted-foreground">
                          You already have an active request with this bank.
                        </p>
                      </>
                    ) : (
                      <Button onClick={() => start(lender.id)}>
                        {draft ? "Continue draft" : "Start loan request"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          {data.loans.length === 0 && (
            <section className="space-y-4">
              <h3 className="font-semibold">Your loan requests</h3>
              <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                <FileText className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">No loan requests yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a bank to get started. Submitted requests and bank responses will appear
                  here.
                </p>
              </div>
            </section>
          )}
          <p className="text-xs text-muted-foreground">
            Demo only. Loan terms and eligibility will be provided by the bank.
          </p>
        </>
      )}
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setHandoff(false);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {handoff
                ? "Continue with your bank"
                : credit
                  ? "Merchant credit request details"
                  : "Loan request details"}
            </DialogTitle>
            <DialogDescription>
              {detail && lenders.find((lender) => lender.id === detail.bankId)?.name} · {detail?.id}
            </DialogDescription>
          </DialogHeader>
          {detail &&
            (handoff ? (
              <div className="space-y-5">
                <BankLogo
                  bank={lenders.find((lender) => lender.id === detail.bankId)?.name ?? ""}
                />
                <h3 className="text-lg font-semibold">
                  Your next step with {lenders.find((lender) => lender.id === detail.bankId)?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  In the live service, this button will take you to the bank’s instructions to
                  continue your application and review any required documents and{" "}
                  {credit ? "credit terms." : "loan terms."}
                </p>
                <div className="rounded-xl bg-muted p-4 text-sm">
                  {credit
                    ? "This is a prototype destination. No redirect, agreement, or credit disbursement has taken place."
                    : "This is a demo destination. No redirect, agreement, or loan disbursement has taken place."}
                </div>
                <Button variant="outline" onClick={() => setHandoff(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to request
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Status status={detail.status} />
                  <span className="text-xs text-muted-foreground">
                    Submitted {dateLabel(detail.date)}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/40 p-4 text-sm">
                  {detail.status === "Pending"
                    ? "The bank is reviewing your request. Its response will appear here. You do not need to submit another request."
                    : detail.status === "Accepted"
                      ? "The bank has accepted your request. Continue to see what happens next. Acceptance of this request does not mean funds have been disbursed."
                      : "The bank has not accepted this request. You can review your details and start a new request."}
                </div>
                {detail.status === "Accepted" && (
                  <Button onClick={() => setHandoff(true)}>
                    Continue with {lenders.find((lender) => lender.id === detail.bankId)?.name}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Summary items={loanItems(detail.form, credit)} />
                <details className="border-t pt-4 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Preview a bank response</summary>
                  <p className="mt-3">Prototype controls only. These responses are simulated.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["Pending", "Accepted", "Rejected"] as const).map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        disabled={
                          detail.status === status ||
                          (status !== "Rejected" &&
                            data.loans.some(
                              (request) =>
                                request.id !== detail.id &&
                                request.bankId === detail.bankId &&
                                request.status !== "Rejected",
                            ))
                        }
                        onClick={() => setResponse(status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </details>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
