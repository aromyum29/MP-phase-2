import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Bell, BellRing, CheckCircle2, ExternalLink, FileText, Lock, TrendingUp } from "lucide-react";
import { BankLogo } from "../BankLogo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  emptyLoan,
  lenders,
  reference,
  useFinanceData,
  type CancelledLoanRequest,
  type LoanForm,
  type LoanRequest,
} from "../FinanceData";
import { useAction, useCanManageFinance, useDemo, useFirstLoad } from "./demo";
import { BUSINESS, COMING_SOON_BANKS, CURRENT_USER, KOKO_SALES, LEGAL, LENDER_LINKS, LENDER_TERMS } from "./placeholders";
import {
  BackLink,
  Btn,
  Card,
  Checkbox,
  CopyButton,
  CurrencyInput,
  DefinitionList,
  Drawer,
  ErrorSummary,
  FilterChips,
  InlineAlert,
  PageHeader,
  RadioCards,
  SkeletonBlock,
  StatusBadge,
  StepIndicator,
  StickyActions,
  TextInput,
  Timeline,
  UnderlineTabs,
  V1Page,
  addBusinessDays,
  fmtDate,
  fmtDateTime,
  lkr,
  notify,
  statusLabel,
  type TimelineItem,
} from "./ui";
import { useOptionalParam, useViewParam } from "./url";

type AnyLoan = LoanRequest | CancelledLoanRequest;
const STEPS = ["Credit needs", "Business and contact", "Business finances", "Review and submit"];
const PURPOSES = ["Buy stock", "Business expansion", "Equipment", "Working capital", "Other"];
const PURPOSE_LABELS: Record<string, string> = {
  "Buy stock": "Buy stock",
  "Business expansion": "Expand the business",
  Equipment: "Buy equipment",
  "Working capital": "Working capital",
  Other: "Something else",
};
const decisionDays = 5;
const purposeText = (form: LoanForm) => (form.purpose === "Other" && form.purposeOther ? form.purposeOther : PURPOSE_LABELS[form.purpose] ?? form.purpose);
const bankName = (id: string) => lenders.find((lender) => lender.id === id)?.name ?? COMING_SOON_BANKS.find((bank) => bank.id === id)?.name ?? "Bank";

function useEligibility() {
  const { settings } = useDemo();
  const sales = KOKO_SALES[settings.eligibility];
  const terms = LENDER_TERMS.sampath;
  const average = Math.round(sales.monthly.reduce((sum, value) => sum + value, 0) / sales.monthly.length);
  const monthsOk = sales.monthsOnKoko >= terms.minMonths;
  const salesOk = average >= terms.minMonthlySales;
  const estimate = Math.min(terms.max, Math.floor((average * terms.multiple) / 10000) * 10000);
  return { average, months: sales.monthsOnKoko, monthsOk, salesOk, eligible: monthsOk && salesOk, estimate, terms };
}

export function MerchantCreditV1() {
  const { data, setData } = useFinanceData();
  const canManage = useCanManageFinance();
  const loading = useFirstLoad("merchant-credit");
  const eligibility = useEligibility();
  const [tab, setTab] = useViewParam<"banks" | "requests">("tab", "banks");
  const [filter, setFilter] = useViewParam<string>("status", "all");
  const [applying, setApplying] = useOptionalParam("apply");
  const [stepParam, setStepParam] = useViewParam<string>("step", "1");
  const step = Math.min(Math.max((Number(stepParam) || 1) - 1, 0), STEPS.length - 1);
  const setStep = (index: number) => setStepParam(String(index + 1));
  const [openId, setOpenId] = useOptionalParam("request");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancelAction = useAction();

  const requests: AnyLoan[] = useMemo(
    () => [...data.loans, ...(data.cancelledLoans ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [data.loans, data.cancelledLoans],
  );
  const activeFor = (bankId: string) => data.loans.find((request) => request.bankId === bankId && request.status !== "Rejected");
  const drafts = Object.entries(data.loanDrafts).filter(([id]) => lenders.some((lender) => lender.id === id) && !activeFor(id));
  const detail = requests.find((request) => request.id === openId);
  // A request that's already open can't be edited, e.g. after Back from the confirmation.
  useEffect(() => {
    if (applying && (activeFor(applying) || !canManage)) {
      setApplying(null, { replace: true });
      setStepParam("1", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applying, canManage, data.loans]);

  const discardDraft = (bankId: string) => {
    setData((previous) => {
      const next = { ...previous.loanDrafts };
      delete next[bankId];
      return { ...previous, loanDrafts: next };
    });
    setDiscarding(null);
    notify("Draft discarded");
  };
  const startApplication = (bankId: string) => {
    setReceipt(null);
    setStep(0);
    setApplying(bankId);
  };
  const toggleNotify = (bankId: string) => {
    const on = !(data.notifyBanks ?? []).includes(bankId);
    setData((previous) => {
      const current = previous.notifyBanks ?? [];
      return { ...previous, notifyBanks: on ? [...current, bankId] : current.filter((id) => id !== bankId) };
    });
    notify(on ? `We'll let you know when ${bankName(bankId)} joins` : `Notifications off for ${bankName(bankId)}`);
  };
  const cancelRequest = async (id: string) => {
    const ok = await cancelAction.run(() =>
      setData((previous) => {
        const request = previous.loans.find((item) => item.id === id);
        if (!request || request.status !== "Pending") return previous;
        return {
          ...previous,
          loans: previous.loans.filter((item) => item.id !== id),
          cancelledLoans: [{ ...request, status: "Cancelled", cancelledAt: new Date().toISOString() }, ...(previous.cancelledLoans ?? [])],
        };
      }),
    );
    if (ok) {
      setConfirmCancel(false);
      notify("Request cancelled", `${bankName(detail?.bankId ?? "sampath")} won't review it.`);
    }
  };

  if (loading) {
    return (
      <V1Page>
        <PageHeader title="Merchant credit" description="Business funding from partner banks, based on your Koko sales." />
        <div className="space-y-4" aria-busy="true" aria-label="Loading merchant credit">
          <SkeletonBlock className="h-11 w-64" />
          <SkeletonBlock className="h-36 max-w-[880px]" />
          <SkeletonBlock className="h-64 max-w-[880px]" />
        </div>
      </V1Page>
    );
  }

  if (applying && lenders.some((lender) => lender.id === applying)) {
    return (
      <Application
        bankId={applying}
        step={step}
        setStep={setStep}
        eligibility={eligibility}
        onExit={(saved) => {
          setApplying(null);
          setStepParam("1");
          setTab(saved ? "requests" : "banks");
          if (saved) notify("Draft saved", "Continue any time from Merchant credit.");
        }}
        onSubmitted={(id) => {
          setApplying(null, { replace: true });
          setStepParam("1", { replace: true });
          setReceipt(id);
        }}
      />
    );
  }

  if (receipt) {
    const submitted = data.loans.find((request) => request.id === receipt);
    return (
      <V1Page>
        <Card className="max-w-[720px] space-y-5">
          <CheckCircle2 className="h-10 w-10 text-emerald-700" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">Request sent to {bankName(submitted?.bankId ?? "sampath")}</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              The bank usually responds in {eligibility.terms.decision}. We'll email {CURRENT_USER.email} when it does. Sending a request doesn't guarantee credit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[#f6f6f8] px-4 py-2">
            <span className="text-[14px] text-muted-foreground">Reference</span>
            <span className="font-mono text-[14px] font-semibold">{receipt}</span>
            <CopyButton text={receipt} ariaLabel={`reference ${receipt}`} />
          </div>
          {submitted && <Timeline items={timelineFor(submitted)} />}
          <StickyActions>
            <Btn
              block
              onClick={() => {
                setReceipt(null);
                setTab("requests");
                setOpenId(receipt);
              }}
            >
              View request
            </Btn>
            <Btn
              block
              variant="tertiary"
              onClick={() => {
                setReceipt(null);
                setTab("requests");
              }}
            >
              Go to requests
            </Btn>
          </StickyActions>
        </Card>
      </V1Page>
    );
  }

  const counts = {
    all: requests.length + drafts.length,
    draft: drafts.length,
    Pending: requests.filter((request) => request.status === "Pending").length,
    Accepted: requests.filter((request) => request.status === "Accepted").length,
    Rejected: requests.filter((request) => request.status === "Rejected").length,
    Cancelled: requests.filter((request) => request.status === "Cancelled").length,
  };
  const visible = filter === "draft" ? [] : requests.filter((request) => filter === "all" || request.status === filter);
  const showDrafts = filter === "all" || filter === "draft";

  return (
    <V1Page>
      <PageHeader title="Merchant credit" description="Business funding from partner banks, based on your Koko sales." />
      <UnderlineTabs
        label="Merchant credit"
        value={tab}
        onChange={(value) => setTab(value as "banks" | "requests")}
        items={[
          { value: "banks", label: "Banks" },
          { value: "requests", label: "Requests", count: counts.all },
        ]}
      />

      {tab === "banks" ? (
        <div className="max-w-[880px] space-y-6">
          <EligibilityCard eligibility={eligibility} />

          <section aria-labelledby="mc-how" className="space-y-3">
            <h2 id="mc-how" className="text-[16px] font-semibold">
              How it works
            </h2>
            <ol className="grid gap-3 sm:grid-cols-3">
              {[
                ["Check what you could get", "Your estimate is based on your Koko sales."],
                ["Apply in about 5 minutes", "Most details are filled in from your Koko profile."],
                ["The bank decides", `Usually in ${eligibility.terms.decision}. You continue with the bank if accepted.`],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-3 rounded-xl bg-[#f6f6f8] p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold">{title}</span>
                    <span className="block text-[14px] text-muted-foreground">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="mc-available" className="space-y-3">
            <h2 id="mc-available" className="text-[16px] font-semibold">
              Available banks
            </h2>
            {lenders.map((lender) => {
              const terms = LENDER_TERMS[lender.id];
              const active = activeFor(lender.id);
              const draft = data.loanDrafts[lender.id];
              return (
                <Card key={lender.id} aria-label={lender.name} className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <BankLogo bank={lender.name} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] font-semibold">{lender.name}</h3>
                      <p className="text-[14px] text-muted-foreground">Business funding through Koko</p>
                    </div>
                    {active && <StatusBadge status={active.status} />}
                  </div>
                  <DefinitionList
                    items={[
                      ["Amount", `${lkr(terms.min)} – ${lkr(terms.max)}`],
                      ["Repayment period", `${terms.terms[0]}–${terms.terms[terms.terms.length - 1]} months`],
                      ["Decision", `Usually ${terms.decision}`],
                      ["Interest and fees", terms.rates],
                    ]}
                  />
                  <div>
                    <p className="text-[14px] font-medium">What you'll need</p>
                    <ul className="mt-1 grid gap-x-6 gap-y-1 text-[14px] text-muted-foreground sm:grid-cols-2">
                      {terms.documents.map((doc) => (
                        <li key={doc} className="flex gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
                    {active ? (
                      <>
                        <Btn variant="secondary" onClick={() => setOpenId(active.id)}>
                          View request
                        </Btn>
                        <p className="text-[14px] text-muted-foreground">You can have one open request with each bank.</p>
                      </>
                    ) : !canManage ? (
                      <p className="flex items-start gap-2 text-[14px] text-muted-foreground">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        Only Super Admins and Finance Admins can apply for merchant credit.
                      </p>
                    ) : !eligibility.eligible ? (
                      <p className="text-[14px] text-muted-foreground">You can apply once your business meets the requirements above.</p>
                    ) : draft ? (
                      discarding === lender.id ? (
                        <DiscardConfirm onDiscard={() => discardDraft(lender.id)} onKeep={() => setDiscarding(null)} />
                      ) : (
                        <>
                          <Btn onClick={() => startApplication(lender.id)}>
                            Continue application
                            <ArrowRight aria-hidden="true" />
                          </Btn>
                          <Btn variant="tertiary" onClick={() => setDiscarding(lender.id)}>
                            Discard draft
                          </Btn>
                        </>
                      )
                    ) : (
                      <Btn onClick={() => startApplication(lender.id)}>
                        Request merchant credit
                        <ArrowRight aria-hidden="true" />
                      </Btn>
                    )}
                  </div>
                </Card>
              );
            })}
          </section>

          <section aria-labelledby="mc-soon" className="space-y-3">
            <div>
              <h2 id="mc-soon" className="text-[16px] font-semibold">
                More banks coming soon
              </h2>
              <p className="text-[14px] text-muted-foreground">Get a notification when a bank starts accepting requests through Koko.</p>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {COMING_SOON_BANKS.map((bank) => {
                const on = (data.notifyBanks ?? []).includes(bank.id);
                return (
                  <li key={bank.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                    <BankLogo bank={bank.name} />
                    <span className="min-w-0 flex-1 text-[14px] font-medium">{bank.name}</span>
                    <StatusBadge status="Coming soon" />
                    <Btn
                      variant={on ? "tertiary" : "secondary"}
                      size="sm"
                      aria-pressed={on}
                      aria-label={`${on ? "Notifications on" : "Notify me"}, ${bank.name}`}
                      onClick={() => toggleNotify(bank.id)}
                    >
                      {on ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
                      {on ? "Notifications on" : "Notify me"}
                    </Btn>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <FilterChips
            label="Filter requests by status"
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: "All", count: counts.all },
              { value: "draft", label: "Drafts", count: counts.draft },
              { value: "Pending", label: "In review", count: counts.Pending },
              { value: "Accepted", label: "Accepted", count: counts.Accepted },
              { value: "Rejected", label: "Declined", count: counts.Rejected },
              { value: "Cancelled", label: "Cancelled", count: counts.Cancelled },
            ]}
          />
          {showDrafts && drafts.length > 0 && (
            <ul className="space-y-2" aria-label="Drafts">
              {drafts.map(([bankId, draft]) => (
                <li key={bankId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[#9a9aa6] bg-card px-4 py-3 sm:px-5">
                  <BankLogo bank={bankName(bankId)} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-[14px] font-medium">{bankName(bankId)}</p>
                    <p className="text-xs text-muted-foreground">{draft.amount ? `${lkr(draft.amount)} · ` : ""}Not sent yet</p>
                  </div>
                  <StatusBadge status="Draft" />
                  {canManage &&
                    (discarding === bankId ? (
                      <DiscardConfirm onDiscard={() => discardDraft(bankId)} onKeep={() => setDiscarding(null)} />
                    ) : (
                      <div className="flex gap-1">
                        <Btn size="sm" variant="secondary" aria-label={`Continue, ${bankName(bankId)} draft`} onClick={() => startApplication(bankId)}>
                          Continue
                        </Btn>
                        <Btn size="sm" variant="tertiary" aria-label={`Discard, ${bankName(bankId)} draft`} onClick={() => setDiscarding(bankId)}>
                          Discard
                        </Btn>
                      </div>
                    ))}
                </li>
              ))}
            </ul>
          )}
          {visible.length > 0 && (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
                <table className="w-full text-left text-[14px]">
                  <caption className="sr-only">Merchant credit requests</caption>
                  <thead className="bg-[#f6f6f8] text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Bank and reference
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Amount
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Submitted
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((request) => (
                      <tr key={request.id}>
                        <th scope="row" className="px-5 py-3.5 font-normal">
                          <div className="flex items-center gap-3">
                            <BankLogo bank={bankName(request.bankId)} />
                            <div>
                              <p className="font-medium">{bankName(request.bankId)}</p>
                              <p className="text-xs text-muted-foreground">{request.id}</p>
                            </div>
                          </div>
                        </th>
                        <td className="px-5 py-3.5">
                          <p className="font-medium tabular-nums">{lkr(request.form.amount)}</p>
                          <p className="text-xs text-muted-foreground">{purposeText(request.form)}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">{fmtDate(request.date)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Btn variant="tertiary" size="sm" aria-label={`View, ${request.id}`} onClick={() => setOpenId(request.id)}>
                            View
                          </Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="space-y-3 lg:hidden">
                {visible.map((request) => (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(request.id)}
                      className="w-full space-y-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-3">
                          <BankLogo bank={bankName(request.bankId)} />
                          <span>
                            <span className="block text-[14px] font-semibold">{bankName(request.bankId)}</span>
                            <span className="block text-xs text-muted-foreground">{request.id}</span>
                          </span>
                        </span>
                        <StatusBadge status={request.status} />
                      </span>
                      <span className="flex flex-wrap justify-between gap-2 text-[14px]">
                        <span className="font-medium tabular-nums">{lkr(request.form.amount)}</span>
                        <span className="text-muted-foreground">Submitted {fmtDate(request.date)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!visible.length && !(showDrafts && drafts.length) && (
            <div className="rounded-2xl border border-dashed border-[#9a9aa6] px-6 py-10 text-center">
              <FileText className="mx-auto mb-3 h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <p className="text-[15px] font-semibold">
                {filter === "all" ? "No requests yet" : `No ${filter === "draft" ? "drafts" : statusLabel(filter).toLowerCase() + " requests"}`}
              </p>
              <p className="mx-auto mt-1 max-w-md text-[14px] text-muted-foreground">
                {filter === "all"
                  ? "Check what you could get and send a request to a partner bank. Its response appears here."
                  : "Requests with this status will appear here."}
              </p>
              {filter === "all" ? (
                <Btn className="mt-4" variant="secondary" onClick={() => setTab("banks")}>
                  See available banks
                </Btn>
              ) : (
                <Btn className="mt-3" variant="tertiary" onClick={() => setFilter("all")}>
                  Show all requests
                </Btn>
              )}
            </div>
          )}
        </div>
      )}

      <Drawer
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) {
            setOpenId(null);
            setConfirmCancel(false);
            cancelAction.clearError();
          }
        }}
        title="Merchant credit request"
        description={detail ? `${bankName(detail.bankId)} · ${detail.id}` : undefined}
        footer={
          detail?.status === "Accepted" ? (
            <div className="space-y-2">
              <Btn asChild block className="sm:w-full">
                <a href={LENDER_LINKS[detail.bankId]?.apply ?? "#"} target="_blank" rel="noopener noreferrer">
                  Continue with {bankName(detail.bankId)}
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only">(opens {LENDER_LINKS[detail.bankId]?.label ?? "the bank's website"} in a new tab)</span>
                </a>
              </Btn>
              <p className="text-xs text-muted-foreground">You'll leave Koko. The bank shares the agreement and asks for any documents it needs.</p>
            </div>
          ) : detail?.status === "Pending" && canManage ? (
            confirmCancel ? (
              <div className="space-y-3">
                <p className="text-[14px] font-medium">Cancel this request? {bankName(detail.bankId)} will stop reviewing it.</p>
                {cancelAction.error && <InlineAlert tone="error" title="The request wasn't cancelled">{cancelAction.error}</InlineAlert>}
                <div className="flex flex-wrap gap-2">
                  <Btn variant="danger" className="border border-[#b4232f]" loading={cancelAction.pending} onClick={() => cancelRequest(detail.id)}>
                    Cancel request
                  </Btn>
                  <Btn variant="tertiary" disabled={cancelAction.pending} onClick={() => setConfirmCancel(false)}>
                    Keep request
                  </Btn>
                </div>
              </div>
            ) : (
              <Btn variant="danger" className="-ml-3" onClick={() => setConfirmCancel(true)}>
                Cancel request
              </Btn>
            )
          ) : undefined
        }
      >
        {detail && (
          <LoanDetail
            request={detail}
            onRestart={
              canManage && eligibility.eligible && !activeFor(detail.bankId)
                ? () => {
                    setOpenId(null);
                    startApplication(detail.bankId);
                  }
                : undefined
            }
          />
        )}
      </Drawer>
    </V1Page>
  );
}

function DiscardConfirm({ onDiscard, onKeep }: { onDiscard: () => void; onKeep: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Discard draft">
      <span className="text-[14px] font-medium">Discard this draft?</span>
      <Btn size="sm" variant="danger" className="border border-[#b4232f]" onClick={onDiscard}>
        Discard
      </Btn>
      <Btn size="sm" variant="tertiary" onClick={onKeep}>
        Keep
      </Btn>
    </div>
  );
}

function EligibilityCard({ eligibility }: { eligibility: ReturnType<typeof useEligibility> }) {
  const { terms } = eligibility;
  if (eligibility.eligible) {
    return (
      <Card className="border-emerald-300 bg-emerald-50/50">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800" aria-hidden="true">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 basis-64">
            <p className="text-[14px] font-medium text-emerald-900">You're eligible</p>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight">You could request up to {lkr(eligibility.estimate)}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Based on {lkr(eligibility.average)} average monthly Koko sales over the last 6 months and {eligibility.months} months on Koko. This is an estimate. The bank makes the final decision.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  const factors: Array<{ label: string; value: string; ok: boolean }> = [
    { label: "Time selling with Koko", value: `${eligibility.months} of ${terms.minMonths} months needed`, ok: eligibility.monthsOk },
    { label: "Average monthly Koko sales", value: `${lkr(eligibility.average)} of ${lkr(terms.minMonthlySales)} needed`, ok: eligibility.salesOk },
  ];
  return (
    <Card>
      <h2 className="text-[18px] font-semibold">Not eligible yet</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">Partner banks look at your Koko sales history. Here's where your business stands.</p>
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
        {factors.map((factor) => (
          <li key={factor.label} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span>
              <span className="block text-[14px] font-medium">{factor.label}</span>
              <span className="block text-[14px] text-muted-foreground">{factor.value}</span>
            </span>
            <StatusBadge status={factor.ok ? "Verified" : "Pending"} label={factor.ok ? "Met" : "Needs work"} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[14px] text-muted-foreground">Keep taking payments with Koko. We'll let you know as soon as you qualify.</p>
    </Card>
  );
}

function timelineFor(request: AnyLoan): TimelineItem[] {
  const items: TimelineItem[] = [{ label: "Submitted", date: fmtDateTime(request.date), state: "done" }];
  if (request.status === "Pending") {
    items.push({ label: `${bankName(request.bankId)} reviews your request`, note: `Expected by ${fmtDate(addBusinessDays(request.date, decisionDays))}`, state: "current" });
    items.push({ label: "Decision", state: "upcoming" });
    items.push({ label: "Continue with the bank", note: "If accepted, you finish the agreement with the bank.", state: "upcoming" });
  } else if (request.status === "Accepted") {
    items.push({ label: "Accepted", date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined, state: "done" });
    items.push({ label: "Continue with the bank", note: "Sign the agreement and share any documents the bank asks for.", state: "current" });
  } else if (request.status === "Rejected") {
    items.push({ label: "Declined", date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined, note: request.reason, state: "failed" });
  } else {
    items.push({ label: "Cancelled by you", date: fmtDateTime("cancelledAt" in request ? request.cancelledAt : request.date), state: "failed" });
  }
  return items;
}

function LoanDetail({ request, onRestart }: { request: AnyLoan; onRestart?: () => void }) {
  const form = request.form;
  return (
    <div className="space-y-6">
      <StatusBadge status={request.status} />
      {request.status === "Accepted" && (
        <InlineAlert tone="success" title={`${bankName(request.bankId)} accepted your request`}>
          {request.offer ? (
            <DefinitionList
              items={[
                ["Offered amount", lkr(request.offer.amount)],
                ["Repayment period", `${request.offer.term} months`],
                ["Interest rate", request.offer.rate],
              ]}
            />
          ) : (
            "Continue with the bank to see the offer and sign the agreement."
          )}
          <p className="mt-3">No money has been paid out yet. Funds are released after you sign the bank's agreement.</p>
        </InlineAlert>
      )}
      {request.status === "Rejected" && (
        <InlineAlert
          tone="error"
          title="The bank declined this request"
          action={
            onRestart && (
              <Btn size="sm" variant="secondary" onClick={onRestart}>
                Start a new request
              </Btn>
            )
          }
        >
          {request.reason ?? "You can review your details and start a new request."}
        </InlineAlert>
      )}
      <Timeline items={timelineFor(request)} />
      <DetailGroup title="Credit needs">
        <DefinitionList
          items={[
            ["Requested amount", lkr(form.amount)],
            ["What it's for", purposeText(form)],
            ["Repayment period", form.term ? `${form.term} months` : "Not given"],
          ]}
        />
      </DetailGroup>
      <DetailGroup title="Business and contact">
        <DefinitionList
          items={[
            ["Business", form.business],
            ["Registration number", form.registration],
            ["Contact person", form.contact],
            ["Mobile", form.phone],
            ["Email", form.email],
          ]}
        />
      </DetailGroup>
      <DetailGroup title="Business finances">
        <DefinitionList
          items={[
            ["Average monthly revenue", lkr(form.revenue)],
            ["Existing business borrowing", form.borrowing || "Not given"],
            ...(form.borrowing === "Yes" ? ([["Monthly repayments", lkr(form.repayments)]] as Array<[string, string]>) : []),
          ]}
        />
      </DetailGroup>
      {request.consent && (
        <p className="rounded-xl bg-[#f6f6f8] p-3 text-xs text-muted-foreground">
          Consent to the CRIB check and to apply on behalf of the business given by {request.consent.by} on {fmtDateTime(request.consent.at)}.
        </p>
      )}
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border pt-5">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/* ---------- Application ---------- */

function Application({
  bankId,
  step,
  setStep,
  eligibility,
  onExit,
  onSubmitted,
}: {
  bankId: string;
  step: number;
  setStep: (step: number) => void;
  eligibility: ReturnType<typeof useEligibility>;
  onExit: (saved: boolean) => void;
  onSubmitted: (id: string) => void;
}) {
  const { data, setData } = useFinanceData();
  const terms = LENDER_TERMS[bankId];
  const bank = bankName(bankId);
  const defaults: LoanForm = useMemo(
    () => ({
      ...emptyLoan,
      business: BUSINESS.name,
      registration: BUSINESS.registration,
      contact: CURRENT_USER.name,
      phone: CURRENT_USER.mobile,
      email: CURRENT_USER.email,
      revenue: String(eligibility.average),
      purposeOther: "",
    }),
    [eligibility.average],
  );
  const saved = data.loanDrafts[bankId];
  const form: LoanForm = { ...defaults, ...saved, business: BUSINESS.name, registration: BUSINESS.registration };
  // A draft is created on the first change, never just by opening the form.
  const update = (key: keyof LoanForm, value: string) =>
    setData((previous) => ({
      ...previous,
      loanDrafts: {
        ...previous.loanDrafts,
        [bankId]: { ...defaults, ...previous.loanDrafts[bankId], [key]: value, ...(key === "borrowing" && value === "No" ? { repayments: "" } : {}) },
      },
    }));
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [crib, setCrib] = useState(false);
  const [authorised, setAuthorised] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const submitAction = useAction();
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  const amount = Number(form.amount || 0);
  const errorsFor = (index: number) => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!form.amount) next["mc-amount"] = "Enter how much you'd like to request.";
      else if (amount < terms.min || amount > terms.max) next["mc-amount"] = `Enter an amount between ${lkr(terms.min)} and ${lkr(terms.max)}.`;
      if (!form.purpose) next["mc-purpose"] = "Choose what the credit is for.";
      else if (form.purpose === "Other" && !form.purposeOther?.trim()) next["mc-purpose-other"] = "Tell the bank what the credit is for.";
      if (!form.term) next["mc-term"] = "Choose a repayment period.";
    }
    if (index === 1) {
      if (!form.contact.trim()) next["mc-contact"] = "Enter the name of the person the bank should contact.";
      if (!/^(?:0\d{9}|\+94\d{9})$/.test(form.phone.replace(/[\s-]/g, ""))) next["mc-phone"] = "Enter a Sri Lankan mobile number, like 077 123 4567.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next["mc-email"] = "Enter an email address, like name@business.lk.";
    }
    if (index === 2) {
      if (form.revenue === "") next["mc-revenue"] = "Enter your average monthly revenue. Enter 0 if you have none.";
      if (!form.borrowing) next["mc-borrowing"] = "Choose whether the business has existing borrowing.";
      else if (form.borrowing === "Yes" && !Number(form.repayments)) next["mc-repayments"] = "Enter the total you repay each month.";
    }
    if (index === 3) {
      if (!crib) next["mc-crib"] = "Give permission for the CRIB check to send your request.";
      if (!authorised) next["mc-authorised"] = "Confirm you're authorised to apply for the business.";
    }
    return next;
  };
  useEffect(() => {
    for (let index = 0; index < step; index += 1) {
      if (Object.keys(errorsFor(index)).length) {
        setAttempts((previous) => ({ ...previous, [index]: 1 }));
        setStep(index);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const errors = errorsFor(step);
  const shown = (key: string) => (attempts[step] || touched[key] ? errors[key] : undefined);
  const touch = (key: string) => setTouched((previous) => ({ ...previous, [key]: true }));
  const next = async () => {
    setAttempts((previous) => ({ ...previous, [step]: (previous[step] ?? 0) + 1 }));
    if (Object.keys(errors).length) return;
    if (step < 3) {
      if (!saved) update("amount", form.amount);
      setStep(step + 1);
      return;
    }
    if (data.loans.some((request) => request.bankId === bankId && request.status !== "Rejected")) return;
    const id = reference("MC");
    const now = new Date().toISOString();
    const ok = await submitAction.run(() =>
      setData((previous) => {
        if (previous.loans.some((request) => request.bankId === bankId && request.status !== "Rejected")) return previous;
        const draftsLeft = { ...previous.loanDrafts };
        delete draftsLeft[bankId];
        return {
          ...previous,
          loanDrafts: draftsLeft,
          loans: [
            {
              id,
              bankId,
              status: "Pending",
              date: now,
              form: { ...form },
              requestedBy: CURRENT_USER.username,
              consent: { crib: true, authorised: true, at: now, by: CURRENT_USER.username },
            },
            ...previous.loans,
          ],
        };
      }),
    );
    if (ok) {
      notify("Request sent", `${bank} usually responds in ${terms.decision}.`);
      onSubmitted(id);
    }
  };

  const titles = [
    ["What do you need?", "These are preferences. The bank confirms the final amount and terms."],
    ["Business and contact", "We've filled this in from your Koko profile. Check the contact details."],
    ["Business finances", "A quick picture of your income and existing borrowing."],
    ["Review and submit", `Check your request before it goes to ${bank}.`],
  ][step];

  return (
    <V1Page>
      <div className="max-w-[720px] space-y-5">
        <div className="space-y-4">
          <BackLink onClick={() => (step === 0 ? onExit(Boolean(saved)) : setStep(step - 1))}>{step === 0 ? "Merchant credit" : "Back"}</BackLink>
          <div className="flex flex-wrap items-center gap-3">
            <BankLogo bank={bank} />
            <h1 className="text-2xl font-bold tracking-tight">Request merchant credit</h1>
          </div>
          <StepIndicator steps={STEPS} current={step} onStep={setStep} />
          <div>
            <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
              {titles[0]}
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">{titles[1]}</p>
          </div>
        </div>

        <ErrorSummary errors={attempts[step] ? errors : {}} focusKey={attempts[step] ?? 0} />

        {step === 0 && (
          <Card className="space-y-6">
            <div className="space-y-3">
              <CurrencyInput
                id="mc-amount"
                label="Amount"
                value={form.amount}
                onChange={(value) => update("amount", value)}
                onBlur={() => touch("mc-amount")}
                error={shown("mc-amount")}
                hint={`Between ${lkr(terms.min)} and ${lkr(terms.max)}.${eligibility.eligible ? ` Your estimate is up to ${lkr(eligibility.estimate)}.` : ""}`}
              />
              <div>
                <input
                  type="range"
                  min={terms.min}
                  max={terms.max}
                  step={50000}
                  value={Math.min(Math.max(amount || terms.min, terms.min), terms.max)}
                  onChange={(event) => update("amount", event.target.value)}
                  aria-label="Adjust amount"
                  aria-valuetext={lkr(amount || terms.min)}
                  className="h-11 w-full cursor-pointer accent-gray-900"
                />
                <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
                  <span>{lkr(terms.min)}</span>
                  <span>{lkr(terms.max)}</span>
                </div>
              </div>
              {eligibility.eligible && amount > eligibility.estimate && amount <= terms.max && (
                <InlineAlert tone="warning" title="This is more than your estimate">
                  Based on your Koko sales, {bank} may offer less than {lkr(amount)}. You can still send the request.
                </InlineAlert>
              )}
            </div>
            <RadioCards
              name="mc-purpose"
              legend="What's it for?"
              value={form.purpose}
              onChange={(value) => {
                update("purpose", value);
                touch("mc-purpose");
              }}
              error={shown("mc-purpose")}
              columns={3}
              options={PURPOSES.map((value) => ({ value, label: PURPOSE_LABELS[value] }))}
            />
            {form.purpose === "Other" && (
              <TextInput
                id="mc-purpose-other"
                label="Tell the bank what it's for"
                value={form.purposeOther ?? ""}
                maxLength={120}
                onChange={(event) => update("purposeOther", event.target.value)}
                onBlur={() => touch("mc-purpose-other")}
                error={shown("mc-purpose-other")}
                aside={
                  <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                    {(form.purposeOther ?? "").length}/120
                  </span>
                }
              />
            )}
            <RadioCards
              name="mc-term"
              legend="Repayment period"
              hint="The bank confirms the final term."
              value={form.term}
              onChange={(value) => {
                update("term", value);
                touch("mc-term");
              }}
              error={shown("mc-term")}
              columns={4}
              options={terms.terms.map((months) => ({ value: String(months), label: `${months} months` }))}
            />
          </Card>
        )}

        {step === 1 && (
          <Card className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput id="mc-business" label="Registered business name" value={BUSINESS.name} locked hint="From your Koko business profile. Update it in Profiles." />
              <TextInput id="mc-registration" label="Business registration number" value={BUSINESS.registration} locked />
            </div>
            <TextInput
              id="mc-contact"
              label="Contact person"
              autoComplete="name"
              value={form.contact}
              onChange={(event) => update("contact", event.target.value)}
              onBlur={() => touch("mc-contact")}
              error={shown("mc-contact")}
              hint="The bank calls this person about the request."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput
                id="mc-phone"
                label="Mobile number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                onBlur={() => touch("mc-phone")}
                error={shown("mc-phone")}
              />
              <TextInput
                id="mc-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={() => touch("mc-email")}
                error={shown("mc-email")}
              />
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-6">
            <CurrencyInput
              id="mc-revenue"
              label="Average monthly revenue"
              value={form.revenue}
              onChange={(value) => update("revenue", value)}
              onBlur={() => touch("mc-revenue")}
              error={shown("mc-revenue")}
              hint={`Filled in from your Koko sales over the last 6 months (${lkr(eligibility.average)}). Add sales outside Koko if you have them.`}
            />
            <RadioCards
              name="mc-borrowing"
              legend="Does the business have existing loans or credit?"
              value={form.borrowing}
              onChange={(value) => {
                update("borrowing", value);
                touch("mc-borrowing");
              }}
              error={shown("mc-borrowing")}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
            />
            {form.borrowing === "Yes" && (
              <CurrencyInput
                id="mc-repayments"
                label="Total monthly repayments"
                value={form.repayments}
                onChange={(value) => update("repayments", value)}
                onBlur={() => touch("mc-repayments")}
                error={shown("mc-repayments")}
                hint="Add up repayments across all business loans and credit."
              />
            )}
          </Card>
        )}

        {step === 3 && (
          <>
            {[
              {
                title: "Credit needs",
                index: 0,
                items: [
                  ["Amount", lkr(form.amount)],
                  ["What it's for", purposeText(form)],
                  ["Repayment period", `${form.term} months`],
                ],
              },
              {
                title: "Business and contact",
                index: 1,
                items: [
                  ["Business", BUSINESS.name],
                  ["Registration number", BUSINESS.registration],
                  ["Contact person", form.contact],
                  ["Mobile", form.phone],
                  ["Email", form.email],
                ],
              },
              {
                title: "Business finances",
                index: 2,
                items: [
                  ["Average monthly revenue", lkr(form.revenue)],
                  ["Existing loans or credit", form.borrowing],
                  ...(form.borrowing === "Yes" ? [["Monthly repayments", lkr(form.repayments)]] : []),
                ],
              },
            ].map((group) => (
              <Card key={group.title} className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{group.title}</h3>
                  <Btn variant="tertiary" size="sm" className="-mr-2" aria-label={`Edit, ${group.title.toLowerCase()}`} onClick={() => setStep(group.index)}>
                    Edit
                  </Btn>
                </div>
                <DefinitionList items={group.items as Array<[string, string]>} />
              </Card>
            ))}
            <section aria-labelledby="mc-legal" className="space-y-3">
              <h3 id="mc-legal" className="text-[15px] font-semibold">
                Permissions
              </h3>
              <Checkbox id="mc-crib" checked={crib} onChange={setCrib} error={attempts[3] ? errors["mc-crib"] : undefined}>
                {LEGAL.crib(bank, BUSINESS.name)}
              </Checkbox>
              <Checkbox id="mc-authorised" checked={authorised} onChange={setAuthorised} error={attempts[3] ? errors["mc-authorised"] : undefined}>
                {LEGAL.authorised(BUSINESS.name)}
              </Checkbox>
              <p className="text-[14px] text-muted-foreground">
                By selecting Agree and submit, you agree to {bank}'s{" "}
                <button type="button" className="font-medium text-foreground underline underline-offset-2" onClick={() => setTermsOpen(true)}>
                  terms and privacy notice
                </button>
                . Sending a request doesn't guarantee credit.
              </p>
            </section>
            {submitAction.error && (
              <InlineAlert tone="error" title="Your request wasn't sent">
                {submitAction.error}
              </InlineAlert>
            )}
          </>
        )}

        <StickyActions>
          <Btn block loading={submitAction.pending} onClick={next}>
            {step < 3 ? (
              <>
                Continue
                <ArrowRight aria-hidden="true" />
              </>
            ) : submitAction.pending ? (
              "Sending…"
            ) : submitAction.error ? (
              "Try again"
            ) : (
              "Agree and submit"
            )}
          </Btn>
          <Btn block variant="tertiary" disabled={submitAction.pending} onClick={() => onExit(Boolean(data.loanDrafts[bankId]))}>
            Save and exit
          </Btn>
        </StickyActions>
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="koko-v1">
          <DialogHeader>
            <DialogTitle>{bank} terms and privacy notice</DialogTitle>
            <DialogDescription>{LEGAL.termsBody}</DialogDescription>
          </DialogHeader>
          <Btn variant="secondary" onClick={() => setTermsOpen(false)}>
            Close
          </Btn>
        </DialogContent>
      </Dialog>
    </V1Page>
  );
}
