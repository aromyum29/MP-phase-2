import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { BankLogo } from "../BankLogo";
import { cn } from "../ui/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import {
  reference,
  useFinanceData,
  type Account,
  type BankRequest,
  type CancelledBankRequest,
} from "../FinanceData";
import { useAction, useCanManageFinance, useFirstLoad } from "./demo";
import {
  BANKS,
  BUSINESS,
  CURRENT_USER,
  DEMO_OTP,
  LEGAL,
  NEXT_PAYOUT,
  REVIEW_TIMES,
} from "./placeholders";
import {
  BackLink,
  Btn,
  Checkbox,
  Combobox,
  DefinitionList,
  Drawer,
  ErrorSummary,
  FieldError,
  FileDrop,
  InlineAlert,
  PageHeader,
  SkeletonBlock,
  SoftFields,
  StatusBadge,
  StatusBar,
  TextInput,
  Timeline,
  V1Page,
  CopyButton,
  addBusinessDays,
  fileSize,
  fmtDate,
  fmtDateTime,
  lkr,
  notify,
  type TimelineItem,
} from "./ui";
import { VIEW_KEYS, useOptionalParam, useSetSearch, useViewParam } from "./url";

type View = "overview" | "details" | "review" | "verify" | "done";
type AnyRequest = BankRequest | CancelledBankRequest;
const STEPS = ["Account details", "Review", "Verify"];
const STEP_VIEWS: View[] = ["details", "review", "verify"];
const group = (digits: string) => digits.replace(/(\d{4})(?=\d)/g, "$1 ");
const mask = (digits: string) => `•••• ${digits.slice(-4)}`;
const accountLabel = (account: Account) => `${account.bank} ${mask(account.number)}`;
const reviewDays = 2;
const nextPayout = () => {
  const date = new Date();
  const days = (NEXT_PAYOUT.weekday - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Colombo",
  });
};

// Card and type styles shared with the Create Order form.
const cardShell = "rounded-2xl border border-[#BDDCEE]/50 bg-white shadow-xl";
const labelClass = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
const valueClass = "mt-1 text-base font-semibold text-gray-900";
const primaryClass =
  "w-full shadow-md hover:shadow-lg motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0";
const secondaryClass = "w-full text-sm text-gray-700";

function CardAction({
  tone = "secondary",
  chevron = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { tone?: "primary" | "secondary" | "danger"; chevron?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-4 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 sm:h-12 sm:min-h-0",
        tone === "primary"
          ? "justify-center bg-gray-900 font-semibold tracking-wide text-white shadow-md hover:bg-gray-800 hover:shadow-lg"
          : "justify-between border bg-white font-medium hover:bg-gray-50",
        tone === "secondary" && "border-gray-300 text-gray-800 hover:border-gray-400",
        tone === "danger" && "border-[#e3b4b9] text-[#b4232f] hover:bg-red-50",
        className,
      )}
      {...props}
    >
      <span className="min-w-0">{children}</span>
      {chevron && <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />}
    </button>
  );
}

function FlowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 pt-8">{children}</div>;
}

// A reload starts the page fresh: the open change flow and drawer are dismissed
// along with the data (see FinanceDataProvider).
let freshLoad = true;

export function BankAccountV1() {
  const { data, setData, bankDraft, setBankDraft, statement, setStatement } = useFinanceData();
  const canManage = useCanManageFinance();
  const loading = useFirstLoad("bank-account");
  const [view, setView] = useViewParam<View>("change", "overview");
  const [openId, setOpenId] = useOptionalParam("request");
  const setSearch = useSetSearch();
  const [receipt, setReceipt] = useState<string | null>(null);
  const submitted = useRef(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (!freshLoad) return;
    freshLoad = false;
    if (view !== "overview" || openId)
      setSearch({ change: null, request: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [view]);

  const pending = data.bankRequests.find((request) => request.status === "Pending");
  const history: AnyRequest[] = useMemo(
    () =>
      [...data.bankRequests, ...(data.cancelledBankRequests ?? [])].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [data.bankRequests, data.cancelledBankRequests],
  );
  const detail = history.find((request) => request.id === openId);
  const activeFrom =
    data.accountActiveFrom && new Date(data.accountActiveFrom) > new Date()
      ? data.accountActiveFrom
      : null;
  const hasDraft = Boolean(bankDraft.bank || bankDraft.number || statement);

  /* ---------- Form state ---------- */
  const [confirmNumber, setConfirmNumber] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempt, setAttempt] = useState(0);
  const [fileError, setFileError] = useState<string>();
  const [showHelp, setShowHelp] = useState(false);
  const [attest, setAttest] = useState(false);
  const [attestAttempt, setAttestAttempt] = useState(0);
  const bankEntry = BANKS.find((bank) => bank.name === bankDraft.bank);
  const digits = bankDraft.number.replace(/\D/g, "");
  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!bankDraft.bank) next["ba-bank"] = "Choose the bank for the new account.";
    else if (!bankDraft.branch) next["ba-branch"] = "Choose the branch shown on your statement.";
    if (!digits) next["ba-number"] = "Enter the account number.";
    else if (bankEntry && !bankEntry.accountDigits.includes(digits.length))
      next["ba-number"] =
        `${bankEntry.name} account numbers have ${bankEntry.accountDigits.join(" or ")} digits. You've entered ${digits.length}.`;
    else if (digits === data.account.number && bankDraft.bank === data.account.bank)
      next["ba-number"] = "This is already your payout account. Enter a different account.";
    if (!confirmNumber) next["ba-confirm"] = "Re-enter the account number.";
    else if (confirmNumber !== digits)
      next["ba-confirm"] = "The account numbers don't match. Check both and try again.";
    if (!statement) next["ba-statement"] = "Attach a bank statement for the new account.";
    return next;
  }, [bankDraft.bank, bankDraft.branch, digits, bankEntry, data.account, confirmNumber, statement]);
  const shown = (key: string) => (attempt > 0 || touched[key] ? errors[key] : undefined);
  const touch = (key: string) => setTouched((previous) => ({ ...previous, [key]: true }));
  const update = (key: keyof Account, value: string) =>
    setBankDraft((previous) => ({
      ...previous,
      holder: BUSINESS.name,
      [key]: value,
      ...(key === "bank" ? { branch: "" } : {}),
    }));

  /* ---------- Verification ---------- */
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [resendIn, setResendIn] = useState(30);
  const submitAction = useAction();
  const cancelAction = useAction();
  useEffect(() => {
    if (view !== "verify" || resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [view, resendIn]);

  // After a reload or Back, the statement (kept in memory) and the confirm
  // field are gone, and a submitted change can't be edited, so steer to a
  // view that still makes sense.
  useEffect(() => {
    if (view === "overview") return;
    if (view === "done") {
      submitted.current = false;
      if (!receipt) setView("overview", { replace: true });
      return;
    }
    // The new request lands in data a moment before the view switches to done.
    if (submitted.current) return;
    if (pending || !canManage) setView("overview", { replace: true });
    else if (view !== "details" && Object.keys(errors).length) {
      setAttempt(1);
      setView("details", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pending, canManage]);

  const startChange = () => {
    setAttempt(0);
    setTouched({});
    setAttest(false);
    setAttestAttempt(0);
    setView("details");
  };
  const toReview = () => {
    setAttempt((value) => value + 1);
    if (!Object.keys(errors).length) setView("review");
  };
  const toVerify = () => {
    setAttestAttempt((value) => value + 1);
    if (!attest) return;
    setCode("");
    setCodeError(undefined);
    setResendIn(30);
    setView("verify");
  };
  const verify = async () => {
    if (code.length < 6) return setCodeError("Enter the 6-digit code.");
    if (code !== DEMO_OTP)
      return setCodeError("That code isn't right. Check the latest SMS from Koko and try again.");
    if (pending || !statement) return;
    const id = reference("BA");
    const now = new Date().toISOString();
    const ok = await submitAction.run(() => {
      setData((previous) =>
        previous.bankRequests.some((request) => request.status === "Pending")
          ? previous
          : {
              ...previous,
              bankRequests: [
                {
                  id,
                  date: now,
                  status: "Pending",
                  account: {
                    holder: BUSINESS.name,
                    bank: bankDraft.bank,
                    branch: bankDraft.branch,
                    number: digits,
                  },
                  filename: statement.name,
                  requestedBy: CURRENT_USER.username,
                  from: previous.account,
                  verifiedAt: now,
                },
                ...previous.bankRequests,
              ],
            },
      );
      setBankDraft({ holder: "", bank: "", branch: "", number: "" });
      setStatement(null);
      setConfirmNumber("");
    });
    if (ok) {
      submitted.current = true;
      setReceipt(id);
      setView("done");
      notify("Account change submitted", `Reference ${id}`);
    }
  };
  const cancelRequest = async (id: string) => {
    const ok = await cancelAction.run(() =>
      setData((previous) => {
        const request = previous.bankRequests.find((item) => item.id === id);
        if (!request || request.status !== "Pending") return previous;
        return {
          ...previous,
          bankRequests: previous.bankRequests.filter((item) => item.id !== id),
          cancelledBankRequests: [
            { ...request, status: "Cancelled", cancelledAt: new Date().toISOString() },
            ...(previous.cancelledBankRequests ?? []),
          ],
        };
      }),
    );
    if (ok) {
      setConfirmCancel(false);
      notify("Request cancelled", "Your payout account hasn't changed.");
    }
  };

  /* ---------- Views ---------- */
  if (loading) {
    return (
      <V1Page className="koko-portal-type">
        <PageHeader title="Bank account" description="Where your Koko payouts are sent." />
        <div
          className={cn(cardShell, "max-w-[920px] space-y-5 p-5 sm:p-8")}
          aria-busy="true"
          aria-label="Loading payout account"
        >
          <SkeletonBlock className="h-10 rounded-xl" />
          <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[128px_minmax(0,1fr)_272px]">
            <SkeletonBlock className="aspect-square w-full rounded-xl" />
            <div className="space-y-3 self-center">
              <SkeletonBlock className="h-6 w-56" />
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-10 w-48" />
            </div>
            <div className="col-span-2 space-y-2.5 lg:col-span-1">
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
            </div>
          </div>
        </div>
      </V1Page>
    );
  }

  const stepIndex = STEP_VIEWS.indexOf(view);
  // Header and progress inside the flow card, laid out like Create Order.
  const flowTop = (title: string, subtitle: string) => (
    <>
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Change payout account</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            ref={heading}
            tabIndex={-1}
            className="text-sm font-semibold text-gray-900 outline-none"
          >
            {title}
          </h2>
          <p className="shrink-0 text-xs text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
        <nav aria-label="Progress">
          <ol className="mt-2.5 flex gap-1.5">
            {STEPS.map((step, index) => (
              <li
                key={step}
                aria-current={index === stepIndex ? "step" : undefined}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  index <= stepIndex ? "bg-gray-900" : "bg-[#e4e4ea]",
                )}
              >
                <span className="sr-only">
                  {step}
                  {index < stepIndex ? " (completed)" : ""}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </>
  );
  const flowShell = (children: ReactNode) => (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <BackLink
        onClick={() =>
          view === "details" ? setView("overview") : setView(STEP_VIEWS[stepIndex - 1])
        }
      >
        {view === "details" ? "Bank account" : "Back"}
      </BackLink>
      <div className={cn(cardShell, "px-5 py-8 sm:px-12 sm:py-10")}>
        <SoftFields>{children}</SoftFields>
      </div>
    </div>
  );

  return (
    <V1Page className="koko-portal-type">
      {view === "overview" && (
        <>
          <PageHeader title="Bank account" description="Where your Koko payouts are sent." />
          <section
            aria-labelledby="payout-heading"
            className={cn(cardShell, "max-w-[920px] p-5 sm:p-8")}
          >
            {pending ? (
              <StatusBar tone="pending" className="text-sm">
                Change in review · Expected by {fmtDate(addBusinessDays(pending.date, reviewDays))}
              </StatusBar>
            ) : activeFrom ? (
              <StatusBar tone="info" className="text-sm">
                Approved · Payouts start {fmtDateTime(activeFrom)}
              </StatusBar>
            ) : (
              <StatusBar tone="active" className="text-sm">
                Active
              </StatusBar>
            )}

            <div className="mt-6 grid grid-cols-[80px_minmax(0,1fr)] gap-x-4 gap-y-6 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[128px_minmax(0,1fr)_272px]">
              <div
                className="flex aspect-square w-full items-center justify-center rounded-xl bg-[#f3f3f5]"
                aria-hidden="true"
              >
                <div className="scale-125 sm:scale-150">
                  <BankLogo bank={data.account.bank} />
                </div>
              </div>

              <div className="min-w-0 space-y-5 self-center">
                <div className="space-y-1">
                  <h2
                    id="payout-heading"
                    ref={heading}
                    tabIndex={-1}
                    className="text-xl leading-snug tracking-tight text-gray-900 outline-none"
                  >
                    <span className="sr-only">Payout account: </span>
                    {data.account.bank}{" "}
                    <span className="whitespace-nowrap">{mask(data.account.number)}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {data.account.holder} · {data.account.branch} branch
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <dt className={labelClass}>Next payout</dt>
                    <dd className={valueClass}>
                      <span className="tabular-nums">{lkr(NEXT_PAYOUT.amount)}</span>{" "}
                      <span className="whitespace-nowrap font-normal text-gray-700">
                        on {nextPayout()}
                      </span>
                    </dd>
                  </div>
                  {pending ? (
                    <div>
                      <dt className={labelClass}>Requested change</dt>
                      <dd className={valueClass}>{accountLabel(pending.account)}</dd>
                    </div>
                  ) : activeFrom ? (
                    <div>
                      <dt className={labelClass}>Payouts to this account start</dt>
                      <dd className={valueClass}>{fmtDateTime(activeFrom)}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="col-span-2 space-y-2.5 lg:col-span-1">
                {pending ? (
                  <>
                    <CardAction chevron onClick={() => setOpenId(pending.id)}>
                      View request
                    </CardAction>
                    {canManage && (
                      <CardAction
                        tone="danger"
                        onClick={() => {
                          setConfirmCancel(true);
                          setOpenId(pending.id);
                        }}
                      >
                        Cancel request
                      </CardAction>
                    )}
                  </>
                ) : (
                  canManage && (
                    <CardAction tone="primary" onClick={startChange}>
                      {hasDraft ? "Continue your change" : "Change payout account"}
                    </CardAction>
                  )
                )}
                <CardAction
                  className="justify-center"
                  onClick={() =>
                    setSearch({
                      ...Object.fromEntries(VIEW_KEYS.map((key) => [key, null])),
                      page: "financial-statement",
                    })
                  }
                >
                  Payout history
                </CardAction>
                <p className="flex items-start gap-1.5 px-1 pt-1 text-xs text-muted-foreground">
                  {canManage ? (
                    pending ? (
                      <>
                        Payouts keep going to {mask(data.account.number)} until the change is
                        approved.
                      </>
                    ) : (
                      <>
                        Changes are reviewed in {REVIEW_TIMES.bankAccount}. Payouts continue
                        meanwhile.
                      </>
                    )
                  ) : (
                    <>
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Only Super Admins and Finance Admins can change payout details.
                    </>
                  )}
                </p>
              </div>
            </div>
          </section>

          {history.length > 0 && (
            <section className="max-w-[920px] space-y-3" aria-labelledby="ba-history">
              <h2 id="ba-history" className="text-base text-gray-900">
                Change history
              </h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-[#BDDCEE]/50 bg-white shadow-sm">
                {history.map((request) => (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(request.id)}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900 sm:px-6"
                    >
                      <span className="min-w-0 flex-1 basis-60">
                        <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-gray-900">
                          {request.from ? (
                            <>
                              <span>{accountLabel(request.from)}</span>
                              <ArrowRight
                                className="h-3.5 w-3.5 text-muted-foreground"
                                aria-label="to"
                              />
                            </>
                          ) : null}
                          <span>{accountLabel(request.account)}</span>
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {request.id} · {fmtDate(request.date)}
                          {request.requestedBy && ` · Requested by ${request.requestedBy}`}
                        </span>
                      </span>
                      <StatusBadge
                        status={request.status === "Accepted" ? "Approved" : request.status}
                      />
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {view === "details" &&
        flowShell(
          <>
            {flowTop(
              "New account details",
              "Enter the details exactly as they appear on your bank statement.",
            )}
            <div className="mb-7 empty:hidden">
              <ErrorSummary errors={attempt > 0 ? errors : {}} focusKey={attempt} />
            </div>
            <div className="flex flex-col gap-7">
              <TextInput
                id="ba-holder"
                label="Account holder name"
                value={BUSINESS.name}
                locked
                hint="Payouts can only go to an account in your business's registered name. Need a different name? Contact Koko support."
              />
              <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
                <Combobox
                  id="ba-bank"
                  label="Bank"
                  value={bankDraft.bank}
                  onChange={(value) => {
                    update("bank", value);
                    touch("ba-bank");
                  }}
                  options={BANKS.map((bank) => ({ value: bank.name, label: bank.name }))}
                  placeholder="Choose a bank"
                  searchPlaceholder="Search banks"
                  emptyText="No banks match. Check the spelling."
                  error={shown("ba-bank")}
                />
                <Combobox
                  id="ba-branch"
                  label="Branch"
                  value={bankDraft.branch}
                  disabled={!bankEntry}
                  hint={bankEntry ? undefined : "Choose a bank first."}
                  onChange={(value) => {
                    update("branch", value);
                    touch("ba-branch");
                  }}
                  options={(bankEntry?.branches ?? []).map((branch) => ({
                    value: branch.name,
                    label: branch.name,
                    meta: `Branch ${branch.code}`,
                  }))}
                  placeholder="Choose a branch"
                  searchPlaceholder="Search branches"
                  emptyText="No branches match. Try the city name."
                  error={shown("ba-branch")}
                />
              </div>
              <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
                <div className="space-y-3">
                  <TextInput
                    id="ba-number"
                    label="Account number"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Enter account number"
                    value={group(digits)}
                    onChange={(event) =>
                      update("number", event.target.value.replace(/\D/g, "").slice(0, 18))
                    }
                    onBlur={() => touch("ba-number")}
                    error={shown("ba-number")}
                    aside={
                      bankEntry && (
                        <span
                          className="text-xs tabular-nums text-muted-foreground"
                          aria-hidden="true"
                        >
                          {digits.length}/
                          {bankEntry.accountDigits[bankEntry.accountDigits.length - 1]}
                        </span>
                      )
                    }
                    hint={
                      <>
                        Spaces are added for you.{" "}
                        <button
                          type="button"
                          className="font-medium text-gray-900 underline underline-offset-2"
                          aria-expanded={showHelp}
                          onClick={() => setShowHelp((value) => !value)}
                        >
                          Where do I find this?
                        </button>
                      </>
                    }
                  />
                  {showHelp && (
                    <InlineAlert tone="neutral" title="Finding your account number">
                      It's printed at the top of your bank statement, next to the account name. In a
                      passbook, it's on the first page. Don't use a card number or the branch code.
                    </InlineAlert>
                  )}
                </div>
                <TextInput
                  id="ba-confirm"
                  label="Re-enter account number"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter it again"
                  value={group(confirmNumber)}
                  onChange={(event) =>
                    setConfirmNumber(event.target.value.replace(/\D/g, "").slice(0, 18))
                  }
                  onBlur={() => touch("ba-confirm")}
                  error={shown("ba-confirm")}
                  hint="Type it again so we can catch any typos."
                />
              </div>
              <FileDrop
                id="ba-statement"
                label="Bank statement"
                hint={`A statement from the last 3 months that shows ${BUSINESS.name}, the bank and this account number.`}
                file={statement}
                error={fileError ?? shown("ba-statement")}
                onFile={(file) => {
                  setFileError(undefined);
                  setStatement(file);
                  touch("ba-statement");
                }}
                onRemove={() => setStatement(null)}
                onReject={(message) => setFileError(message)}
              />
            </div>
            <FlowActions>
              <Btn size="lg" className={primaryClass} onClick={toReview}>
                Continue to review
                <ArrowRight aria-hidden="true" />
              </Btn>
              <Btn
                variant="tertiary"
                className={secondaryClass}
                onClick={() => {
                  setView("overview");
                  notify("Draft saved", "Continue any time from Bank account.");
                }}
              >
                Save and exit
              </Btn>
            </FlowActions>
          </>,
        )}

      {view === "review" &&
        flowShell(
          <>
            {flowTop("Review the change", "Check the new account before you verify and submit.")}
            <div className="flex flex-col gap-7">
              <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <h3 className={labelClass}>From</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <BankLogo bank={data.account.bank} />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-900">
                        {accountLabel(data.account)}
                      </p>
                      <p className="text-sm text-muted-foreground">{data.account.branch}</p>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  <ArrowRight className="hidden h-5 w-5 md:block" />
                  <ArrowDown className="h-5 w-5 md:hidden" />
                </div>
                <div className="rounded-xl border border-gray-900 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={labelClass}>To</h3>
                    <Btn
                      variant="tertiary"
                      size="sm"
                      className="-mr-2 -mt-2 text-sm"
                      onClick={() => setView("details")}
                      aria-label="Edit, new account details"
                    >
                      Edit
                    </Btn>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <BankLogo bank={bankDraft.bank} />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-900">{bankDraft.bank}</p>
                      <p className="text-base font-medium tabular-nums text-gray-900">
                        {group(digits)}
                      </p>
                      <p className="text-sm text-muted-foreground">{bankDraft.branch}</p>
                    </div>
                  </div>
                </div>
              </div>
              <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className={labelClass}>Account holder</dt>
                  <dd className={valueClass}>{BUSINESS.name}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={labelClass}>Bank statement</dt>
                  <dd className={cn(valueClass, "break-words")}>
                    {statement ? `${statement.name} · ${fileSize(statement.size)}` : "Not attached"}
                  </dd>
                </div>
              </dl>
              <section aria-labelledby="ba-next">
                <h3 id="ba-next" className="mb-4 text-sm font-semibold text-gray-900">
                  What happens next
                </h3>
                <Timeline
                  items={[
                    {
                      label: "Confirm it's you",
                      note: `We'll send a code to ${CURRENT_USER.maskedMobile}.`,
                      state: "current",
                    },
                    {
                      label: "Koko reviews the change",
                      note: `Usually ${REVIEW_TIMES.bankAccount}. Payouts keep going to ${mask(data.account.number)}.`,
                      state: "upcoming",
                    },
                    {
                      label: "Payouts switch to the new account",
                      note: `${REVIEW_TIMES.payoutHoldHours} hours after approval, for your security.`,
                      state: "upcoming",
                    },
                  ]}
                />
              </section>
              <Checkbox
                id="ba-attest"
                checked={attest}
                onChange={setAttest}
                error={
                  attestAttempt > 0 && !attest
                    ? "Confirm the account belongs to your business to continue."
                    : undefined
                }
              >
                {LEGAL.bankAccountAttestation(BUSINESS.name)}
              </Checkbox>
            </div>
            <FlowActions>
              <Btn size="lg" className={primaryClass} onClick={toVerify}>
                Continue to verification
                <ArrowRight aria-hidden="true" />
              </Btn>
              <Btn variant="tertiary" className={secondaryClass} onClick={() => setView("details")}>
                Back to details
              </Btn>
            </FlowActions>
          </>,
        )}

      {view === "verify" &&
        flowShell(
          <>
            {flowTop("Confirm it's you", "Changing where payouts go needs a one-time code.")}
            {submitAction.error && (
              <div className="mb-7">
                <InlineAlert tone="error" title="Your change wasn't submitted">
                  {submitAction.error}
                </InlineAlert>
              </div>
            )}
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="max-w-sm text-sm text-gray-800">
                We sent a 6-digit code to{" "}
                <span className="font-semibold">{CURRENT_USER.maskedMobile}</span>. It expires in 10
                minutes.
              </p>
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="ba-otp" className="text-sm font-medium text-gray-800">
                  Verification code
                </label>
                <InputOTP
                  id="ba-otp"
                  maxLength={6}
                  value={code}
                  onChange={(value: string) => {
                    setCode(value.replace(/\D/g, ""));
                    setCodeError(undefined);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  containerClassName="justify-center"
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? "ba-otp-error" : undefined}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={cn(
                          "h-12 w-11 rounded-lg border border-[#8e8e9a] bg-[#f3f3f5] text-lg font-semibold text-gray-900 first:rounded-lg last:rounded-lg data-[active=true]:border-gray-900 data-[active=true]:bg-white data-[active=true]:ring-2 data-[active=true]:ring-gray-900/20",
                          codeError && "border-[#b4232f] bg-white",
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldError id="ba-otp" error={codeError} />
              </div>
              {resendIn > 0 ? (
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Didn't get it? You can request a new code in {resendIn} seconds.
                </p>
              ) : (
                <Btn
                  variant="tertiary"
                  size="sm"
                  className="text-sm"
                  onClick={() => {
                    setResendIn(30);
                    notify("New code sent", `Check the SMS on ${CURRENT_USER.maskedMobile}.`);
                  }}
                >
                  Send a new code
                </Btn>
              )}
            </div>
            <FlowActions>
              <Btn
                size="lg"
                className={primaryClass}
                loading={submitAction.pending}
                onClick={verify}
              >
                {submitAction.pending
                  ? "Submitting…"
                  : submitAction.error
                    ? "Try again"
                    : "Verify and submit"}
              </Btn>
              <Btn
                variant="tertiary"
                className={secondaryClass}
                disabled={submitAction.pending}
                onClick={() => setView("review")}
              >
                Back to review
              </Btn>
            </FlowActions>
          </>,
        )}

      {view === "done" && (
        <div className="mx-auto w-full max-w-3xl">
          <div className={cn(cardShell, "px-5 py-8 sm:px-12 sm:py-10")}>
            <SoftFields>
              <div className="mb-8 flex flex-col items-center space-y-2 text-center">
                <span
                  className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-700" />
                </span>
                <h1
                  ref={heading}
                  tabIndex={-1}
                  className="text-2xl font-bold tracking-tight text-gray-900 outline-none"
                >
                  Account change submitted
                </h1>
                <p className="max-w-md text-sm text-muted-foreground">
                  We'll email {CURRENT_USER.email} and the account owner ({CURRENT_USER.ownerEmail})
                  when it's reviewed. Payouts keep going to{" "}
                  <span className="whitespace-nowrap">{mask(data.account.number)}</span> until then.
                </p>
              </div>
              {receipt && (
                <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-[#f3f3f5] px-4 py-2">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <span className="font-mono text-sm font-semibold text-gray-900">{receipt}</span>
                  <CopyButton text={receipt} ariaLabel={`reference ${receipt}`} />
                </div>
              )}
              <div className="mt-7 rounded-xl border border-gray-200 p-5">
                <Timeline
                  items={[
                    {
                      label: "Submitted",
                      date: fmtDateTime(new Date().toISOString()),
                      state: "done",
                    },
                    { label: "Verified with SMS code", state: "done" },
                    {
                      label: "Koko review",
                      note: `Expected by ${fmtDate(addBusinessDays(new Date().toISOString(), reviewDays))}`,
                      state: "current",
                    },
                    {
                      label: "Payouts switch to the new account",
                      note: `${REVIEW_TIMES.payoutHoldHours} hours after approval`,
                      state: "upcoming",
                    },
                  ]}
                />
              </div>
              <FlowActions>
                <Btn size="lg" className={primaryClass} onClick={() => setView("overview")}>
                  Back to bank account
                </Btn>
              </FlowActions>
            </SoftFields>
          </div>
        </div>
      )}

      <SoftFields>
        <Drawer
          className="koko-portal-type"
          open={Boolean(detail)}
          onOpenChange={(open) => {
            if (!open) {
              setOpenId(null);
              setConfirmCancel(false);
              cancelAction.clearError();
            }
          }}
          title="Account change request"
          description={detail ? `${detail.id} · Submitted ${fmtDate(detail.date)}` : undefined}
          footer={
            detail?.status === "Pending" && canManage ? (
              confirmCancel ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    Cancel this request? Your payout account stays as it is.
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
            <RequestDetail
              request={detail}
              activeFrom={data.accountActiveFrom}
              onRestart={
                canManage && !pending
                  ? () => {
                      setOpenId(null);
                      startChange();
                    }
                  : undefined
              }
            />
          )}
        </Drawer>
      </SoftFields>
    </V1Page>
  );
}

function RequestDetail({
  request,
  activeFrom,
  onRestart,
}: {
  request: AnyRequest;
  activeFrom?: string;
  onRestart?: () => void;
}) {
  const items: TimelineItem[] = [
    { label: "Submitted", date: fmtDateTime(request.date), state: "done" },
  ];
  if (request.verifiedAt)
    items.push({
      label: "Verified with SMS code",
      date: fmtDateTime(request.verifiedAt),
      state: "done",
    });
  if (request.status === "Pending") {
    items.push({
      label: "Koko review",
      note: `Expected by ${fmtDate(addBusinessDays(request.date, reviewDays))}`,
      state: "current",
    });
    items.push({
      label: "Payouts switch to the new account",
      note: `${REVIEW_TIMES.payoutHoldHours} hours after approval`,
      state: "upcoming",
    });
  } else if (request.status === "Accepted") {
    items.push({
      label: "Approved",
      date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined,
      state: "done",
    });
    const starts = activeFrom && new Date(activeFrom) > new Date();
    items.push({
      label: starts ? "Payouts switch to this account" : "Payouts go to this account",
      date: activeFrom ? fmtDateTime(activeFrom) : undefined,
      state: starts ? "current" : "done",
    });
  } else if (request.status === "Rejected") {
    items.push({
      label: "Declined",
      date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined,
      note: request.reason,
      state: "failed",
    });
  } else {
    items.push({
      label: "Cancelled by you",
      date: fmtDateTime("cancelledAt" in request ? request.cancelledAt : request.date),
      state: "failed",
    });
  }
  return (
    <div className="space-y-6">
      <StatusBadge status={request.status === "Accepted" ? "Approved" : request.status} />
      {request.status === "Rejected" && (
        <InlineAlert
          tone="error"
          title="This change was declined"
          action={
            onRestart && (
              <Btn size="sm" variant="secondary" onClick={onRestart}>
                Start a new request
              </Btn>
            )
          }
        >
          {request.reason ?? "Check the account details and statement, then submit a new request."}
        </InlineAlert>
      )}
      <Timeline items={items} />
      <DefinitionList
        columns={1}
        items={[
          [
            "From",
            request.from
              ? `${accountLabel(request.from)} · ${request.from.branch}`
              : "Not recorded",
          ],
          ["To", `${accountLabel(request.account)} · ${request.account.branch}`],
          ["Account holder", request.account.holder],
          ["Bank statement", request.filename],
          ...(request.requestedBy
            ? ([["Requested by", request.requestedBy]] as Array<[string, string]>)
            : []),
        ]}
      />
    </div>
  );
}
