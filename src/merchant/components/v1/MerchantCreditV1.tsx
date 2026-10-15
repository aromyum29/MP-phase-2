import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  X,
  HelpCircle,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { BankLogo } from "../BankLogo";
import { cn } from "../ui/utils";
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
import {
  BUSINESS,
  COMING_SOON_BANKS,
  CURRENT_USER,
  KOKO_SALES,
  LEGAL,
  LENDER_LINKS,
  LENDER_TERMS,
  SECURITY_OPTIONS,
} from "./placeholders";
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
  FileDrop,
  FilterChips,
  InlineAlert,
  PageHeader,
  RadioCards,
  SelectInput,
  SkeletonBlock,
  StatusBadge,
  DoneCard,
  FlowLayout,
  FlowPrimary,
  FlowSecondary,
  SURFACE_LIGHT,
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
import { INTRO_RESET_EVENT, introState, firstChangeStep, resubmitDraft } from "./scenarios";
import { VIEW_KEYS, useOptionalParam, useSetSearch, useViewParam } from "./url";

type AnyLoan = LoanRequest | CancelledLoanRequest;
// How it works, shown in the intro and the side panel. Illustrations are in
// public/merchant-credit.
const HOW_STEPS: Array<{ title: string; body: string; image: string }> = [
  {
    title: "Apply in 5 minutes",
    body: "Most of your details come straight from your Koko account.",
    image: "/merchant-credit/apply.webp",
  },
  {
    title: "The bank decides",
    body: "A partner bank reviews your request in about 5 business days and makes you an offer.",
    image: "/merchant-credit/bank-decides.webp",
  },
  {
    title: "Get funded",
    body: "Accept the offer and the money is paid into your business account.",
    image: "/merchant-credit/get-funded.webp",
  },
  {
    title: "Repay the bank",
    body: "Pay the bank back monthly. Your Koko payouts aren't affected.",
    image: "/merchant-credit/repay.webp",
  },
];
const STEPS = ["Credit needs", "Business details", "Finances and documents", "Review and submit"];
const EMPLOYEE_RANGES = ["1–10", "11–50", "51–100", "100+"];
// Business details already verified at onboarding (KYC), shown read-only.
const KYC_ITEMS: Array<[string, string]> = [
  ["Registered name", BUSINESS.name],
  ["Registration number", BUSINESS.registration],
  ["Business type", BUSINESS.structure],
  ["Industry", BUSINESS.industry],
  ["Operating since", BUSINESS.operatingSince],
  ["TIN", BUSINESS.tin],
  ["Registered address", BUSINESS.address],
  ["Director", `${BUSINESS.director.name} · NIC ${BUSINESS.director.nic}`],
];
// Uploaded files stay in memory while the page is open, so a saved draft keeps them.
const uploads = new Map<string, Partial<Record<"statements" | "accounts", File>>>();
const PURPOSES = ["Buy stock", "Business expansion", "Equipment", "Working capital", "Other"];
const PURPOSE_LABELS: Record<string, string> = {
  "Buy stock": "Buy stock",
  "Business expansion": "Expand the business",
  Equipment: "Buy equipment",
  "Working capital": "Working capital",
  Other: "Something else",
};
const decisionDays = 5;
const purposeText = (form: LoanForm) =>
  form.purpose === "Other" && form.purposeOther
    ? form.purposeOther
    : (PURPOSE_LABELS[form.purpose] ?? form.purpose);
const securityText = (form: LoanForm) =>
  SECURITY_OPTIONS.find((option) => option.value === form.security)?.label ?? "Not given";
const borrowingText = (form: LoanForm) =>
  form.borrowing === "Yes"
    ? `${form.lender || "Yes"} · ${lkr(form.repayments)} a month · ${lkr(form.outstanding || 0)} owed`
    : form.borrowing || "Not given";
// A declined request with a list of changes reads as "Changes requested".
const needsChanges = (request: AnyLoan) =>
  request.status === "Rejected" && Boolean(request.changes?.length);
const badgeStatus = (request: AnyLoan) =>
  needsChanges(request) ? "Changes requested" : request.status;
const bankName = (id: string) =>
  lenders.find((lender) => lender.id === id)?.name ??
  COMING_SOON_BANKS.find((bank) => bank.id === id)?.name ??
  "Bank";

function useEligibility() {
  const { settings } = useDemo();
  const sales = KOKO_SALES[settings.eligibility];
  const terms = LENDER_TERMS.sampath;
  const average = Math.round(
    sales.monthly.reduce((sum, value) => sum + value, 0) / sales.monthly.length,
  );
  const monthsOk = sales.monthsOnKoko >= terms.minMonths;
  const salesOk = average >= terms.minMonthlySales;
  const estimate = Math.min(terms.max, Math.floor((average * terms.multiple) / 10000) * 10000);
  return {
    average,
    months: sales.monthsOnKoko,
    monthsOk,
    salesOk,
    eligible: monthsOk && salesOk,
    estimate,
    terms,
  };
}

// A reload starts the page fresh: an open application or request closes along
// with the data (see FinanceDataProvider). Only views restored from the URL the
// page loaded with are closed, not ones opened later (e.g. by a scenario).
let freshLoad = true;
const loadedWithView =
  typeof window !== "undefined" &&
  ["apply", "request"].some((key) => new URLSearchParams(window.location.search).has(key));

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
  const setSearch = useSetSearch();
  const [receipt, setReceipt] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  // Intro shown on every page load. Got it folds it into the header link
  // (until the next reload), and the link opens it again.
  const [introSeen, setIntroSeen] = useState(introState.dismissed);
  const [introOpen, setIntroOpen] = useState(!introState.dismissed);
  const [helpPing, setHelpPing] = useState(false);
  const introTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showIntro = () => {
    clearTimeout(introTimer.current);
    introState.dismissed = false;
    setIntroStep(0);
    setIntroSeen(false);
    // Mount folded, then unfold on the next frame so it animates in.
    requestAnimationFrame(() => requestAnimationFrame(() => setIntroOpen(true)));
  };
  useEffect(() => {
    // The "first visit" scenario brings it back while the page is open.
    window.addEventListener(INTRO_RESET_EVENT, showIntro);
    return () => {
      window.removeEventListener(INTRO_RESET_EVENT, showIntro);
      clearTimeout(introTimer.current);
    };
  }, []);
  const dismissIntro = () => {
    introState.dismissed = true;
    setIntroOpen(false);
    clearTimeout(introTimer.current);
    introTimer.current = setTimeout(() => {
      setIntroSeen(true);
      setIntroStep(0);
      setHelpPing(true);
      introTimer.current = setTimeout(() => setHelpPing(false), 1600);
    }, 320);
  };
  const [introStep, setIntroStep] = useState(0);
  const cancelAction = useAction();
  useEffect(() => {
    if (!freshLoad) return;
    freshLoad = false;
    if (loadedWithView && (applying || openId))
      setSearch({ apply: null, step: null, request: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requests: AnyLoan[] = useMemo(
    () =>
      [...data.loans, ...(data.cancelledLoans ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [data.loans, data.cancelledLoans],
  );
  const activeFor = (bankId: string) =>
    data.loans.find((request) => request.bankId === bankId && request.status !== "Rejected");
  const drafts = Object.entries(data.loanDrafts).filter(
    ([id]) => lenders.some((lender) => lender.id === id) && !activeFor(id),
  );
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
  const startApplication = (bankId: string, startStep = 0) => {
    setReceipt(null);
    setStep(startStep);
    setApplying(bankId);
  };
  // Changes requested: start a new request prefilled from the declined one,
  // on the first step the bank asked to change. Statements must be added again.
  const resubmit = (request: AnyLoan) => {
    setData((previous) => ({
      ...previous,
      loanDrafts: { ...previous.loanDrafts, [request.bankId]: resubmitDraft(request) },
    }));
    startApplication(request.bankId, firstChangeStep(request));
  };
  // Requests the bank sent back open straight in the form, with the changes
  // highlighted, for people who can apply. Everyone else sees the details.
  const openRequest = (request: AnyLoan) => {
    if (needsChanges(request) && canManage && eligibility.eligible && !activeFor(request.bankId))
      resubmit(request);
    else setOpenId(request.id);
  };
  const cancelRequest = async (id: string) => {
    const ok = await cancelAction.run(() =>
      setData((previous) => {
        const request = previous.loans.find((item) => item.id === id);
        if (!request || request.status !== "Pending") return previous;
        return {
          ...previous,
          loans: previous.loans.filter((item) => item.id !== id),
          cancelledLoans: [
            { ...request, status: "Cancelled", cancelledAt: new Date().toISOString() },
            ...(previous.cancelledLoans ?? []),
          ],
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
        <PageHeader
          title="Merchant credit"
          description="Business funding from partner banks. Koko helps you apply."
        />
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
        <DoneCard
          title={`Request sent to ${bankName(submitted?.bankId ?? "sampath")}`}
          reference={receipt}
          timeline={submitted ? timelineFor(submitted) : undefined}
          actions={
            <>
              <FlowPrimary
                onClick={() => {
                  setReceipt(null);
                  setTab("requests");
                  setOpenId(receipt);
                }}
              >
                View request
              </FlowPrimary>
              <FlowSecondary
                onClick={() => {
                  setReceipt(null);
                  setTab("requests");
                }}
              >
                Go to requests
              </FlowSecondary>
            </>
          }
        >
          The bank usually responds in {eligibility.terms.decision}. We'll email{" "}
          {CURRENT_USER.email} when it does. Sending a request doesn't guarantee credit.
        </DoneCard>
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
  const visible =
    filter === "draft"
      ? []
      : requests.filter((request) => filter === "all" || request.status === filter);
  const showDrafts = filter === "all" || filter === "draft";

  return (
    <V1Page>
      <PageHeader
        title="Merchant credit"
        description="Business funding from partner banks. Koko helps you apply."
        actions={
          <Btn
            variant="tertiary"
            className={cn(
              "-ml-3 transition-colors sm:-mr-3 sm:ml-0",
              helpPing && "bg-[#e6f0f7] ring-2 ring-[#BDDCEE]",
            )}
            aria-expanded={!introSeen && introOpen}
            onClick={() => (introSeen ? showIntro() : dismissIntro())}
          >
            <HelpCircle aria-hidden="true" />
            How merchant credit works
          </Btn>
        }
      />
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
        <div className="max-w-[880px] space-y-8">
          {!introSeen && (
            <div
              className={cn(
                "grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-300 motion-safe:ease-out",
                introOpen ? "grid-rows-[1fr] opacity-100" : "-mb-8 grid-rows-[0fr] opacity-0",
              )}
            >
              <section
                aria-labelledby="mc-intro"
                className={cn(
                  "relative min-h-0 origin-top-right overflow-hidden rounded-2xl border border-[#BDDCEE] bg-[#f1f7fb] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
                  introOpen ? "scale-100" : "scale-[0.4]",
                )}
              >
                <Btn
                  variant="tertiary"
                  size="sm"
                  className="absolute right-2 top-2 z-10 w-11 px-0 sm:w-9"
                  aria-label="Close introduction"
                  onClick={dismissIntro}
                >
                  <X aria-hidden="true" />
                </Btn>
                <div className="grid items-center gap-6 p-5 sm:p-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 md:p-8">
                  <img
                    key={HOW_STEPS[introStep].image}
                    src={HOW_STEPS[introStep].image}
                    alt=""
                    width={240}
                    height={240}
                    className="mx-auto aspect-square w-full max-w-[200px] rounded-2xl bg-white object-contain motion-safe:animate-in motion-safe:fade-in md:max-w-[240px]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span id="mc-intro">How merchant credit works</span>
                      <span aria-hidden="true"> · </span>
                      <span className="normal-case tracking-normal">
                        {introStep + 1} of {HOW_STEPS.length}
                      </span>
                    </p>
                    <div aria-live="polite">
                      <h2 className="mt-2 text-xl text-gray-900">{HOW_STEPS[introStep].title}</h2>
                      <p className="mt-1 max-w-md text-sm text-gray-700">
                        {HOW_STEPS[introStep].body}
                      </p>
                    </div>
                    <div className="mt-5 flex gap-1.5" role="group" aria-label="Steps">
                      {HOW_STEPS.map((item, index) => (
                        <button
                          key={item.title}
                          type="button"
                          aria-label={`Step ${index + 1}: ${item.title}`}
                          aria-current={index === introStep ? "step" : undefined}
                          onClick={() => setIntroStep(index)}
                          className="flex h-6 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                        >
                          <span
                            className={cn(
                              "block h-1.5 rounded-full transition-all",
                              index === introStep ? "w-6 bg-gray-900" : "w-1.5 bg-gray-400",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {introStep > 0 && (
                        <Btn variant="tertiary" onClick={() => setIntroStep(introStep - 1)}>
                          Back
                        </Btn>
                      )}
                      {introStep < HOW_STEPS.length - 1 ? (
                        <Btn onClick={() => setIntroStep(introStep + 1)}>
                          Next
                          <ArrowRight aria-hidden="true" />
                        </Btn>
                      ) : (
                        <Btn onClick={dismissIntro}>Got it</Btn>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
          {lenders.map((lender) => {
            const terms = LENDER_TERMS[lender.id];
            const active = activeFor(lender.id);
            const draft = data.loanDrafts[lender.id];
            const open = detailsOpen === lender.id;
            return (
              <Card key={lender.id} aria-label={lender.name} className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <BankLogo bank={lender.name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl text-gray-900">{lender.name}</h2>
                    <p className="text-sm text-muted-foreground">Business funding through Koko</p>
                  </div>
                  {active && <StatusBadge status={badgeStatus(active)} />}
                </div>
                <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-3">
                  {[
                    ["Amount", `Up to ${lkr(terms.max)}`],
                    [
                      "Repay over",
                      `${terms.terms[0]}–${terms.terms[terms.terms.length - 1]} months`,
                    ],
                    ["Decision", `In ${terms.decision}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>

                {!active && !eligibility.eligible && (
                  <EligibilityProgress eligibility={eligibility} />
                )}

                <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
                  {active ? (
                    <Btn size="lg" variant="secondary" onClick={() => setOpenId(active.id)}>
                      View request
                    </Btn>
                  ) : !canManage ? (
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      Only Super Admins and Finance Admins can apply for merchant credit.
                    </p>
                  ) : !eligibility.eligible ? (
                    <Btn
                      size="lg"
                      variant="secondary"
                      onClick={() =>
                        setSearch({
                          ...Object.fromEntries(VIEW_KEYS.map((key) => [key, null])),
                          page: null,
                        })
                      }
                    >
                      Create an order
                    </Btn>
                  ) : draft ? (
                    discarding === lender.id ? (
                      <DiscardConfirm
                        onDiscard={() => discardDraft(lender.id)}
                        onKeep={() => setDiscarding(null)}
                      />
                    ) : (
                      <>
                        <Btn
                          size="lg"
                          className="shadow-md"
                          onClick={() => startApplication(lender.id)}
                        >
                          Continue application
                          <ArrowRight aria-hidden="true" />
                        </Btn>
                        <Btn variant="tertiary" onClick={() => setDiscarding(lender.id)}>
                          Discard draft
                        </Btn>
                      </>
                    )
                  ) : (
                    <Btn
                      size="lg"
                      className="shadow-md"
                      onClick={() => startApplication(lender.id)}
                    >
                      Request merchant credit
                      <ArrowRight aria-hidden="true" />
                    </Btn>
                  )}
                  <Btn
                    variant="tertiary"
                    aria-expanded={open}
                    aria-controls={`mc-details-${lender.id}`}
                    onClick={() => setDetailsOpen(open ? null : lender.id)}
                  >
                    {open ? "Hide details" : "Details and requirements"}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("transition-transform", open && "rotate-180")}
                    />
                  </Btn>
                </div>

                {open && (
                  <div
                    id={`mc-details-${lender.id}`}
                    className="mt-6 grid gap-6 border-t border-gray-100 pt-6 sm:grid-cols-2"
                  >
                    {[
                      [
                        "Who can apply",
                        `Businesses selling with Koko for at least ${terms.minMonths} months, with ${lkr(terms.minMonthlySales)} or more in average monthly Koko sales.`,
                      ],
                      [
                        "Interest and fees",
                        `${terms.rates}. You see the offer before you agree to anything.`,
                      ],
                      [
                        "What you'll need",
                        "Bank statements for the last 6 months. Your registration certificate and director NIC are already on file from your Koko verification.",
                      ],
                      [
                        "Repayment",
                        `Monthly instalments paid directly to ${lender.name}. Your Koko payouts aren't affected.`,
                      ],
                    ].map(([title, body]) => (
                      <section key={title}>
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                      </section>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

          <section aria-labelledby="mc-soon" className="space-y-3">
            <h2 id="mc-soon" className="text-sm font-semibold text-gray-900">
              More banks coming soon
            </h2>
            <ul className="flex flex-wrap gap-2">
              {COMING_SOON_BANKS.map((bank) => (
                <li
                  key={bank.id}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm text-gray-700"
                >
                  <span className="origin-left scale-75" aria-hidden="true">
                    <BankLogo bank={bank.name} />
                  </span>
                  <span className="-ml-2">{bank.name}</span>
                </li>
              ))}
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
                <li
                  key={bankId}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[#9a9aa6] bg-card px-4 py-3 sm:px-5"
                >
                  <BankLogo bank={bankName(bankId)} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-sm font-medium">{bankName(bankId)}</p>
                    <p className="text-xs text-muted-foreground">
                      {draft.amount ? `${lkr(draft.amount)} · ` : ""}Not sent yet
                    </p>
                  </div>
                  <StatusBadge status="Draft" />
                  {canManage &&
                    (discarding === bankId ? (
                      <DiscardConfirm
                        onDiscard={() => discardDraft(bankId)}
                        onKeep={() => setDiscarding(null)}
                      />
                    ) : (
                      <div className="flex gap-1">
                        <Btn
                          size="sm"
                          variant="secondary"
                          aria-label={`Continue, ${bankName(bankId)} draft`}
                          onClick={() => startApplication(bankId)}
                        >
                          Continue
                        </Btn>
                        <Btn
                          size="sm"
                          variant="tertiary"
                          aria-label={`Discard, ${bankName(bankId)} draft`}
                          onClick={() => setDiscarding(bankId)}
                        >
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
              <div className={cn(SURFACE_LIGHT, "hidden overflow-hidden lg:block")}>
                <table className="w-full text-left text-sm">
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
                          <p className="text-xs text-muted-foreground">
                            {purposeText(request.form)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">{fmtDate(request.date)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={badgeStatus(request)} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Btn
                            variant="tertiary"
                            size="sm"
                            aria-label={`View, ${request.id}`}
                            onClick={() => openRequest(request)}
                          >
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
                      onClick={() => openRequest(request)}
                      className={cn(
                        SURFACE_LIGHT,
                        "w-full space-y-3 p-4 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900",
                      )}
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-3">
                          <BankLogo bank={bankName(request.bankId)} />
                          <span>
                            <span className="block text-sm font-semibold">
                              {bankName(request.bankId)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {request.id}
                            </span>
                          </span>
                        </span>
                        <StatusBadge status={badgeStatus(request)} />
                      </span>
                      <span className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-medium tabular-nums">{lkr(request.form.amount)}</span>
                        <span className="text-muted-foreground">
                          Submitted {fmtDate(request.date)}
                        </span>
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
              <p className="text-base font-semibold">
                {filter === "all"
                  ? "No requests yet"
                  : `No ${filter === "draft" ? "drafts" : statusLabel(filter).toLowerCase() + " requests"}`}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
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
                <a
                  href={LENDER_LINKS[detail.bankId]?.apply ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Continue with {bankName(detail.bankId)}
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only">
                    (opens {LENDER_LINKS[detail.bankId]?.label ?? "the bank's website"} in a new
                    tab)
                  </span>
                </a>
              </Btn>
              <p className="text-xs text-muted-foreground">
                You'll leave Koko. The bank shares the agreement and asks for any documents it
                needs.
              </p>
            </div>
          ) : detail &&
            needsChanges(detail) &&
            canManage &&
            eligibility.eligible &&
            !activeFor(detail.bankId) ? (
            <Btn
              block
              className="sm:w-full"
              onClick={() => {
                setOpenId(null);
                resubmit(detail);
              }}
            >
              Make changes and resubmit
              <ArrowRight aria-hidden="true" />
            </Btn>
          ) : detail?.status === "Pending" && canManage ? (
            confirmCancel ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Cancel this request? {bankName(detail.bankId)} will stop reviewing it.
                </p>
                {cancelAction.error && (
                  <InlineAlert tone="error" title="The request wasn't cancelled">
                    {cancelAction.error}
                  </InlineAlert>
                )}
                <div className="flex flex-wrap gap-2">
                  <Btn
                    variant="danger"
                    className="border border-[#b4232f]"
                    loading={cancelAction.pending}
                    onClick={() => cancelRequest(detail.id)}
                  >
                    Cancel request
                  </Btn>
                  <Btn
                    variant="tertiary"
                    disabled={cancelAction.pending}
                    onClick={() => setConfirmCancel(false)}
                  >
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
                    if (needsChanges(detail)) resubmit(detail);
                    else startApplication(detail.bankId);
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
      <span className="text-sm font-medium">Discard this draft?</span>
      <Btn size="sm" variant="danger" className="border border-[#b4232f]" onClick={onDiscard}>
        Discard
      </Btn>
      <Btn size="sm" variant="tertiary" onClick={onKeep}>
        Keep
      </Btn>
    </div>
  );
}

// Not eligible yet: what the bank needs, and how close the business is.
function EligibilityProgress({ eligibility }: { eligibility: ReturnType<typeof useEligibility> }) {
  const { terms } = eligibility;
  const salesGap = Math.max(0, terms.minMonthlySales - eligibility.average);
  const rows = [
    {
      label: "Average monthly Koko sales",
      value: `${lkr(eligibility.average)} of ${lkr(terms.minMonthlySales)}`,
      ratio: eligibility.average / terms.minMonthlySales,
      ok: eligibility.salesOk,
    },
    {
      label: "Time selling with Koko",
      value: `${Math.min(eligibility.months, terms.minMonths)} of ${terms.minMonths} months`,
      ratio: eligibility.months / terms.minMonths,
      ok: eligibility.monthsOk,
    },
  ];
  return (
    <section
      aria-labelledby="mc-eligibility"
      className="mt-7 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5"
    >
      <h3 id="mc-eligibility" className="text-sm font-semibold text-gray-900">
        You're not eligible for merchant credit yet
      </h3>
      <p className="mt-1 text-sm text-gray-700">
        {`You can apply once your business takes ${lkr(terms.minMonthlySales)} a month through Koko, on average over the last 6 months.`}
        {salesGap > 0 && ` That's ${lkr(salesGap)} more a month than now.`}
      </p>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-gray-900">{row.label}</span>
              <span className="flex items-center gap-1.5 tabular-nums text-gray-700">
                {row.ok && <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />}
                {row.value}
                {row.ok && <span className="sr-only">, met</span>}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={row.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(1, row.ratio) * 100)}
              aria-valuetext={row.value}
              className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-amber-200"
            >
              <div
                className={cn("h-full rounded-full", row.ok ? "bg-emerald-600" : "bg-amber-500")}
                style={{ width: `${Math.round(Math.min(1, row.ratio) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Keep taking payments with Koko. We'll let you know as soon as you qualify.
      </p>
    </section>
  );
}

function timelineFor(request: AnyLoan): TimelineItem[] {
  const items: TimelineItem[] = [
    { label: "Submitted", date: fmtDateTime(request.date), state: "done" },
  ];
  if (request.status === "Pending") {
    items.push({
      label: `${bankName(request.bankId)} reviews your request`,
      note: `Expected by ${fmtDate(addBusinessDays(request.date, decisionDays))}`,
      state: "current",
    });
    items.push({ label: "Decision", state: "upcoming" });
    items.push({
      label: "Continue with the bank",
      note: "If accepted, you finish the agreement with the bank.",
      state: "upcoming",
    });
  } else if (request.status === "Accepted") {
    items.push({
      label: "Accepted",
      date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined,
      state: "done",
    });
    items.push({
      label: "Continue with the bank",
      note: "Sign the agreement and share any documents the bank asks for.",
      state: "current",
    });
  } else if (request.status === "Rejected") {
    items.push({
      label: needsChanges(request) ? "Changes requested" : "Declined",
      date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined,
      note: needsChanges(request) ? "Make the changes and resubmit." : request.reason,
      state: needsChanges(request) ? "current" : "failed",
    });
  } else {
    items.push({
      label: "Cancelled by you",
      date: fmtDateTime("cancelledAt" in request ? request.cancelledAt : request.date),
      state: "failed",
    });
  }
  return items;
}

function LoanDetail({ request, onRestart }: { request: AnyLoan; onRestart?: () => void }) {
  const form = request.form;
  return (
    <div className="space-y-6">
      <StatusBadge status={badgeStatus(request)} />
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
          <p className="mt-3">
            No money has been paid out yet. Funds are released after you sign the bank's agreement.
          </p>
        </InlineAlert>
      )}
      {needsChanges(request) && (
        <InlineAlert tone="warning" title={`${bankName(request.bankId)} asked for changes`}>
          <p>{request.reason}</p>
          <ChangeList changes={request.changes ?? []} />
        </InlineAlert>
      )}
      {request.status === "Rejected" && !needsChanges(request) && (
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
            ["Security", securityText(form)],
          ]}
        />
      </DetailGroup>
      <DetailGroup title="Business details">
        <DefinitionList
          items={[
            ["Business", `${form.business} · ${form.registration}`],
            ["Employees", form.employees || "Not given"],
            ["Contact person", [form.contact, form.designation].filter(Boolean).join(" · ")],
            ["Mobile", form.phone],
            ["Email", form.email],
          ]}
        />
      </DetailGroup>
      <DetailGroup title="Finances and documents">
        <DefinitionList
          items={[
            ["Average monthly revenue", lkr(form.revenue)],
            ["Existing loans or credit", borrowingText(form)],
            ["Bank statements", form.statements || "Not attached"],
            ["Financial statements", form.accounts || "Not added"],
          ]}
        />
      </DetailGroup>
      {request.consent && (
        <p className="rounded-xl bg-[#f6f6f8] p-3 text-xs text-muted-foreground">
          Consent to the CRIB check and to apply on behalf of the business given by{" "}
          {request.consent.by} on {fmtDateTime(request.consent.at)}.
        </p>
      )}
    </div>
  );
}

type Change = NonNullable<LoanRequest["changes"]>[number];
function ChangeList({
  changes,
  resolved,
}: {
  changes: Change[];
  resolved?: (change: Change) => boolean;
}) {
  return (
    <ol className="mt-3 space-y-2">
      {changes.map((change, index) => {
        const done = resolved?.(change);
        return (
          <li key={change.title} className="flex gap-2">
            <span className="font-semibold">{index + 1}.</span>
            <span>
              <span className="flex flex-wrap items-center gap-x-2 font-semibold">
                <span className={cn(done && "line-through decoration-amber-700/60")}>
                  {change.title}
                </span>
                {done && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 no-underline">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Updated
                  </span>
                )}
              </span>
              <span className="block">{change.note}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border pt-5">
      <h3 className="text-base font-semibold">{title}</h3>
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
      designation: "Director",
    }),
    [eligibility.average],
  );
  const saved = data.loanDrafts[bankId];
  const form: LoanForm = {
    ...defaults,
    ...saved,
    business: BUSINESS.name,
    registration: BUSINESS.registration,
  };
  // A draft is created on the first change, never just by opening the form.
  const update = (key: keyof LoanForm, value: string) =>
    setData((previous) => ({
      ...previous,
      loanDrafts: {
        ...previous.loanDrafts,
        [bankId]: {
          ...defaults,
          ...previous.loanDrafts[bankId],
          [key]: value,
          ...(key === "borrowing" && value === "No"
            ? { repayments: "", lender: "", outstanding: "" }
            : {}),
        },
      },
    }));
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [crib, setCrib] = useState(false);
  const [authorised, setAuthorised] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [files, setFiles] = useState(() => uploads.get(bankId) ?? {});
  const [fileErrors, setFileErrors] = useState<Partial<Record<"statements" | "accounts", string>>>(
    {},
  );
  const setFile = (key: "statements" | "accounts", file: File | null) => {
    const nextFiles = { ...files, [key]: file ?? undefined };
    uploads.set(bankId, nextFiles);
    setFiles(nextFiles);
    setFileErrors((previous) => ({ ...previous, [key]: undefined }));
    update(key, file?.name ?? "");
    if (key === "statements") touch("mc-statements");
  };
  const submitAction = useAction();
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);

  const amount = Number(form.amount || 0);
  const resubmitted = data.loans.find((request) => request.id === form.resubmitOf);
  const stepChanges = (resubmitted?.changes ?? []).filter(
    (change) => step === 3 || change.step === step,
  );
  // A requested change is done once any of its fields differs from the request
  // the bank sent back (statements: once a new file is attached).
  const resolved = (change: Change) =>
    (change.fields ?? []).some((field) =>
      field === "mc-statements"
        ? Boolean(files.statements)
        : form[field.replace("mc-", "") as keyof LoanForm] !==
          resubmitted?.form[field.replace("mc-", "") as keyof LoanForm],
    );
  const attentionFor = (field: string) =>
    resubmitted?.changes?.find((change) => change.fields?.includes(field) && !resolved(change))
      ?.title;
  const errorsFor = (index: number) => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!form.amount) next["mc-amount"] = "Enter how much you'd like to request.";
      else if (amount < terms.min || amount > terms.max)
        next["mc-amount"] = `Enter an amount between ${lkr(terms.min)} and ${lkr(terms.max)}.`;
      if (!form.purpose) next["mc-purpose"] = "Choose what the credit is for.";
      else if (form.purpose === "Other" && !form.purposeOther?.trim())
        next["mc-purpose-other"] = "Tell the bank what the credit is for.";
      if (!form.term) next["mc-term"] = "Choose a repayment period.";
      if (!form.security)
        next["mc-security"] = "Choose the security you can offer, or No security.";
    }
    if (index === 1) {
      if (!form.employees) next["mc-employees"] = "Enter how many people work in the business.";
      if (!form.contact.trim())
        next["mc-contact"] = "Enter the name of the person the bank should contact.";
      if (!form.designation?.trim()) next["mc-designation"] = "Enter their role in the business.";
      if (!/^(?:0\d{9}|\+94\d{9})$/.test(form.phone.replace(/[\s-]/g, "")))
        next["mc-phone"] = "Enter a Sri Lankan mobile number, like 077 123 4567.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        next["mc-email"] = "Enter an email address, like name@business.lk.";
    }
    if (index === 2) {
      if (form.revenue === "")
        next["mc-revenue"] = "Enter your average monthly revenue. Enter 0 if you have none.";
      if (!form.borrowing)
        next["mc-borrowing"] = "Choose whether the business has existing borrowing.";
      else if (form.borrowing === "Yes") {
        if (!form.lender?.trim()) next["mc-lender"] = "Enter the bank or lender.";
        if (!Number(form.repayments))
          next["mc-repayments"] = "Enter the total you repay each month.";
        if (!Number(form.outstanding)) next["mc-outstanding"] = "Enter the total still owed.";
      }
      if (!files.statements)
        next["mc-statements"] = "Attach your bank statements for the last 6 months.";
    }
    if (index === 3) {
      if (!crib) next["mc-crib"] = "Give permission for the CRIB check to send your request.";
      if (!authorised)
        next["mc-authorised"] = "Confirm you're authorised to apply for the business.";
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
    if (data.loans.some((request) => request.bankId === bankId && request.status !== "Rejected"))
      return;
    const id = reference("MC");
    const now = new Date().toISOString();
    const ok = await submitAction.run(() =>
      setData((previous) => {
        if (
          previous.loans.some(
            (request) => request.bankId === bankId && request.status !== "Rejected",
          )
        )
          return previous;
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
    ["Business details", "Most of this comes from your Koko verification. Add the rest."],
    ["Finances and documents", "Your income, any existing borrowing and your bank statements."],
    ["Review and submit", `Check your request before it goes to ${bank}.`],
  ][step];

  return (
    <V1Page>
      <FlowLayout
        back={{
          label: step === 0 ? "Merchant credit" : "Back",
          onClick: () => (step === 0 ? onExit(Boolean(saved)) : setStep(step - 1)),
        }}
        logo={<BankLogo bank={bank} />}
        title="Request merchant credit"
        subtitle={titles[1]}
        steps={STEPS}
        current={step}
        stepTitle={titles[0]}
        headingRef={heading}
        actions={
          <>
            <FlowPrimary loading={submitAction.pending} onClick={next}>
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
            </FlowPrimary>
            <FlowSecondary
              disabled={submitAction.pending}
              onClick={() => onExit(Boolean(data.loanDrafts[bankId]))}
            >
              Save and exit
            </FlowSecondary>
          </>
        }
      >
        {stepChanges.length > 0 && (
          <div className="mb-7">
            <InlineAlert
              tone="warning"
              title={
                step === 3
                  ? `Check the changes ${bank} asked for`
                  : `${bank} asked you to change this`
              }
            >
              <ChangeList changes={stepChanges} resolved={resolved} />
            </InlineAlert>
          </div>
        )}
        <div className="mb-7 empty:hidden">
          <ErrorSummary errors={attempts[step] ? errors : {}} focusKey={attempts[step] ?? 0} />
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-7">
            <div className="space-y-3">
              <CurrencyInput
                id="mc-amount"
                attention={attentionFor("mc-amount")}
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
                <div
                  className="flex justify-between text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  <span>{lkr(terms.min)}</span>
                  <span>{lkr(terms.max)}</span>
                </div>
              </div>
              {eligibility.eligible && amount > eligibility.estimate && amount <= terms.max && (
                <InlineAlert tone="warning" title="This is more than your estimate">
                  Based on your Koko sales, {bank} may offer less than {lkr(amount)}. You can still
                  send the request.
                </InlineAlert>
              )}
            </div>
            <SelectInput
              id="mc-purpose"
              attention={attentionFor("mc-purpose")}
              label="What's it for?"
              placeholder="Choose a purpose"
              value={form.purpose}
              onChange={(value) => {
                update("purpose", value);
                touch("mc-purpose");
              }}
              error={shown("mc-purpose")}
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
            <SelectInput
              id="mc-term"
              attention={attentionFor("mc-term")}
              label="Repayment period"
              placeholder="Choose a period"
              hint="The bank confirms the final term."
              value={form.term}
              onChange={(value) => {
                update("term", value);
                touch("mc-term");
              }}
              error={shown("mc-term")}
              options={terms.terms.map((months) => ({
                value: String(months),
                label: `${months} months`,
              }))}
            />
            <SelectInput
              id="mc-security"
              attention={attentionFor("mc-security")}
              label="Security you can offer"
              placeholder="Choose security"
              hint="Security can help with larger amounts. Choose No security for an unsecured request."
              value={form.security ?? ""}
              onChange={(value) => {
                update("security", value);
                touch("mc-security");
              }}
              error={shown("mc-security")}
              options={SECURITY_OPTIONS}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-7">
            <section
              aria-labelledby="mc-kyc"
              className="rounded-xl border border-gray-200 bg-[#f3f3f5]/60 p-4 sm:p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 id="mc-kyc" className="text-sm font-semibold text-gray-900">
                  From your Koko verification
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  Verified {BUSINESS.verifiedOn}
                </span>
              </div>
              <DefinitionList items={KYC_ITEMS} />
              <p className="mt-4 text-xs text-muted-foreground">
                Something out of date? Update it in Profiles before you apply.
              </p>
            </section>
            <SelectInput
              id="mc-employees"
              attention={attentionFor("mc-employees")}
              label="Number of employees"
              placeholder="Choose a range"
              value={form.employees ?? ""}
              onChange={(value) => {
                update("employees", value);
                touch("mc-employees");
              }}
              error={shown("mc-employees")}
              hint="Include yourself and any part-time staff."
              options={EMPLOYEE_RANGES.map((value) => ({ value, label: value }))}
            />
            <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
              <TextInput
                id="mc-contact"
                attention={attentionFor("mc-contact")}
                label="Contact person"
                autoComplete="name"
                value={form.contact}
                onChange={(event) => update("contact", event.target.value)}
                onBlur={() => touch("mc-contact")}
                error={shown("mc-contact")}
              />
              <TextInput
                id="mc-designation"
                attention={attentionFor("mc-designation")}
                label="Their role"
                autoComplete="organization-title"
                value={form.designation ?? ""}
                onChange={(event) => update("designation", event.target.value)}
                onBlur={() => touch("mc-designation")}
                error={shown("mc-designation")}
              />
            </div>
            <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
              <TextInput
                id="mc-phone"
                attention={attentionFor("mc-phone")}
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
                attention={attentionFor("mc-email")}
                label="Email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={() => touch("mc-email")}
                error={shown("mc-email")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-7">
            <CurrencyInput
              id="mc-revenue"
              attention={attentionFor("mc-revenue")}
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
              <>
                <TextInput
                  id="mc-lender"
                  attention={attentionFor("mc-lender")}
                  label="Bank or lender"
                  value={form.lender ?? ""}
                  onChange={(event) => update("lender", event.target.value)}
                  onBlur={() => touch("mc-lender")}
                  error={shown("mc-lender")}
                  hint="If you have more than one, name the largest."
                />
                <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
                  <CurrencyInput
                    id="mc-repayments"
                    attention={attentionFor("mc-repayments")}
                    label="Total monthly repayments"
                    value={form.repayments}
                    onChange={(value) => update("repayments", value)}
                    onBlur={() => touch("mc-repayments")}
                    error={shown("mc-repayments")}
                  />
                  <CurrencyInput
                    id="mc-outstanding"
                    attention={attentionFor("mc-outstanding")}
                    label="Total still owed"
                    value={form.outstanding ?? ""}
                    onChange={(value) => update("outstanding", value)}
                    onBlur={() => touch("mc-outstanding")}
                    error={shown("mc-outstanding")}
                  />
                </div>
              </>
            )}
            <section aria-labelledby="mc-documents" className="space-y-4">
              <h3 id="mc-documents" className="text-sm font-semibold text-gray-900">
                Documents
              </h3>
              <ul className="space-y-2">
                {["Business registration certificate", "NIC of each director"].map((doc) => (
                  <li key={doc} className="flex items-center gap-2 text-sm text-gray-800">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    {doc}
                    <span className="text-muted-foreground">· On file from your verification</span>
                  </li>
                ))}
              </ul>
              <FileDrop
                id="mc-statements"
                attention={attentionFor("mc-statements")}
                label="Bank statements for the last 6 months"
                hint="One PDF with all 6 months, from the account your business uses most."
                file={files.statements ?? null}
                error={fileErrors.statements ?? shown("mc-statements")}
                onFile={(file) => setFile("statements", file)}
                onRemove={() => setFile("statements", null)}
                onReject={(message) =>
                  setFileErrors((previous) => ({ ...previous, statements: message }))
                }
                maxBytes={10_000_000}
              />
              <FileDrop
                id="mc-accounts"
                attention={attentionFor("mc-accounts")}
                label="Latest financial statements (optional)"
                hint="Audited accounts or management accounts. They can help the bank decide faster."
                file={files.accounts ?? null}
                error={fileErrors.accounts}
                onFile={(file) => setFile("accounts", file)}
                onRemove={() => setFile("accounts", null)}
                onReject={(message) =>
                  setFileErrors((previous) => ({ ...previous, accounts: message }))
                }
                maxBytes={10_000_000}
              />
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-7">
            {[
              {
                title: "Credit needs",
                index: 0,
                items: [
                  ["Amount", lkr(form.amount)],
                  ["What it's for", purposeText(form)],
                  ["Repayment period", `${form.term} months`],
                  ["Security", securityText(form)],
                ],
              },
              {
                title: "Business details",
                index: 1,
                items: [
                  ["Business", `${BUSINESS.name} · ${BUSINESS.registration}`],
                  ["Employees", form.employees ?? ""],
                  ["Contact person", `${form.contact} · ${form.designation ?? ""}`],
                  ["Mobile", form.phone],
                  ["Email", form.email],
                ],
              },
              {
                title: "Finances and documents",
                index: 2,
                items: [
                  ["Average monthly revenue", lkr(form.revenue)],
                  ["Existing loans or credit", borrowingText(form)],
                  ["Bank statements", form.statements ?? ""],
                  ["Financial statements", form.accounts || "Not added"],
                ],
              },
            ].map((group) => (
              <section key={group.title} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
                  <Btn
                    variant="tertiary"
                    size="sm"
                    className="-mr-2"
                    aria-label={`Edit, ${group.title.toLowerCase()}`}
                    onClick={() => setStep(group.index)}
                  >
                    Edit
                  </Btn>
                </div>
                <DefinitionList items={group.items as Array<[string, string]>} />
              </section>
            ))}
            <section aria-labelledby="mc-legal" className="space-y-3">
              <h3 id="mc-legal" className="text-sm font-semibold text-gray-900">
                Permissions
              </h3>
              <Checkbox
                id="mc-crib"
                checked={crib}
                onChange={setCrib}
                error={attempts[3] ? errors["mc-crib"] : undefined}
              >
                {LEGAL.crib(bank, BUSINESS.name)}
              </Checkbox>
              <Checkbox
                id="mc-authorised"
                checked={authorised}
                onChange={setAuthorised}
                error={attempts[3] ? errors["mc-authorised"] : undefined}
              >
                {LEGAL.authorised(BUSINESS.name)}
              </Checkbox>
              <p className="text-sm text-muted-foreground">
                By selecting Agree and submit, you agree to {bank}'s{" "}
                <button
                  type="button"
                  className="font-medium text-gray-900 underline underline-offset-2"
                  onClick={() => setTermsOpen(true)}
                >
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
          </div>
        )}
      </FlowLayout>

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
