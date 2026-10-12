import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { BankLogo } from "../BankLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { reference, useFinanceData, type Account, type BankRequest, type CancelledBankRequest } from "../FinanceData";
import { useAction, useCanManageFinance, useFirstLoad } from "./demo";
import { BANKS, BUSINESS, CURRENT_USER, DEMO_OTP, LEGAL, NEXT_PAYOUT, REVIEW_TIMES } from "./placeholders";
import {
  BackLink,
  Btn,
  Card,
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
  StatusBadge,
  StepIndicator,
  StickyActions,
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
import { useOptionalParam, useViewParam } from "./url";

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
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Colombo" });
};

export function BankAccountV1() {
  const { data, setData, bankDraft, setBankDraft, statement, setStatement } = useFinanceData();
  const canManage = useCanManageFinance();
  const loading = useFirstLoad("bank-account");
  const [view, setView] = useViewParam<View>("change", "overview");
  const [openId, setOpenId] = useOptionalParam("request");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [view]);

  const pending = data.bankRequests.find((request) => request.status === "Pending");
  const history: AnyRequest[] = useMemo(
    () => [...data.bankRequests, ...(data.cancelledBankRequests ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [data.bankRequests, data.cancelledBankRequests],
  );
  const detail = history.find((request) => request.id === openId);
  const activeFrom = data.accountActiveFrom && new Date(data.accountActiveFrom) > new Date() ? data.accountActiveFrom : null;
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
      next["ba-number"] = `${bankEntry.name} account numbers have ${bankEntry.accountDigits.join(" or ")} digits. You've entered ${digits.length}.`;
    else if (digits === data.account.number && bankDraft.bank === data.account.bank)
      next["ba-number"] = "This is already your payout account. Enter a different account.";
    if (!confirmNumber) next["ba-confirm"] = "Re-enter the account number.";
    else if (confirmNumber !== digits) next["ba-confirm"] = "The account numbers don't match. Check both and try again.";
    if (!statement) next["ba-statement"] = "Attach a bank statement for the new account.";
    return next;
  }, [bankDraft.bank, bankDraft.branch, digits, bankEntry, data.account, confirmNumber, statement]);
  const shown = (key: string) => (attempt > 0 || touched[key] ? errors[key] : undefined);
  const touch = (key: string) => setTouched((previous) => ({ ...previous, [key]: true }));
  const update = (key: keyof Account, value: string) =>
    setBankDraft((previous) => ({ ...previous, holder: BUSINESS.name, [key]: value, ...(key === "bank" ? { branch: "" } : {}) }));

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
    if (code !== DEMO_OTP) return setCodeError("That code isn't right. Check the latest SMS from Koko and try again.");
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
                  account: { holder: BUSINESS.name, bank: bankDraft.bank, branch: bankDraft.branch, number: digits },
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
          cancelledBankRequests: [{ ...request, status: "Cancelled", cancelledAt: new Date().toISOString() }, ...(previous.cancelledBankRequests ?? [])],
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
      <V1Page>
        <PageHeader title="Bank account" description="Where your Koko payouts are sent." />
        <Card className="max-w-[760px] space-y-5" aria-busy="true" aria-label="Loading payout account">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10" />
            <SkeletonBlock className="h-5 w-48" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock key={item} className="h-10" />
            ))}
          </div>
          <SkeletonBlock className="h-12" />
        </Card>
      </V1Page>
    );
  }

  const stepIndex = STEP_VIEWS.indexOf(view);
  const flowHeader = (title: string, subtitle: string) => (
    <div className="space-y-4">
      <BackLink onClick={() => (view === "details" ? setView("overview") : setView(STEP_VIEWS[stepIndex - 1]))}>
        {view === "details" ? "Bank account" : "Back"}
      </BackLink>
      <h1 className="text-2xl font-bold tracking-tight">Change payout account</h1>
      <StepIndicator steps={STEPS} current={stepIndex} onStep={(index) => setView(STEP_VIEWS[index])} />
      <div>
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
          {title}
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <V1Page>
      {view === "overview" && (
        <>
          <PageHeader title="Bank account" description="Where your Koko payouts are sent." />
          <Card className="max-w-[760px]" aria-labelledby="payout-heading">
            <div className="flex flex-wrap items-start gap-3">
              <BankLogo bank={data.account.bank} />
              <div className="min-w-0 flex-1 basis-40">
                <h2 id="payout-heading" ref={heading} tabIndex={-1} className="text-[16px] font-semibold outline-none">
                  Payout account
                </h2>
                <p className="text-[14px] text-muted-foreground">
                  {data.account.bank} · {data.account.branch}
                </p>
              </div>
              {activeFrom ? <StatusBadge status="Pending" label="Starting soon" /> : <StatusBadge status="Active" />}
            </div>
            <div className="mt-5">
              <DefinitionList
                items={[
                  ["Account holder", data.account.holder],
                  ["Account number", mask(data.account.number)],
                  ["Bank", data.account.bank],
                  ["Branch", data.account.branch],
                ]}
              />
            </div>
            {activeFrom && (
              <InlineAlert tone="info" className="mt-5" title={`Payouts to this account start ${fmtDateTime(activeFrom)}`}>
                For your security, a new payout account starts receiving payouts {REVIEW_TIMES.payoutHoldHours} hours after it's approved.
              </InlineAlert>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-[#f6f6f8] px-4 py-3 text-[14px]">
              <p>
                <span className="text-muted-foreground">Next payout </span>
                <span className="font-semibold tabular-nums">{lkr(NEXT_PAYOUT.amount)}</span> on {nextPayout()}
              </p>
              <p className="text-muted-foreground">To {mask(data.account.number)}</p>
            </div>

            {pending && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <div className="flex flex-wrap items-start gap-3">
                  <StatusBadge status="Pending" />
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-[14px] font-semibold">Change to {accountLabel(pending.account)} is in review</p>
                    <p className="mt-1 text-[14px]">
                      Submitted {fmtDate(pending.date)}. Expected by {fmtDate(addBusinessDays(pending.date, reviewDays))}. Payouts keep going to{" "}
                      {mask(data.account.number)} until it's approved.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => setOpenId(pending.id)}>
                    View request
                  </Btn>
                  {canManage && (
                    <Btn
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setConfirmCancel(true);
                        setOpenId(pending.id);
                      }}
                    >
                      Cancel request
                    </Btn>
                  )}
                </div>
              </div>
            )}

            {(!canManage || !pending) && (
            <div className="mt-5 border-t border-border pt-5">
              {canManage ? (
                (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Btn variant="secondary" onClick={startChange}>
                      {hasDraft ? "Continue your change" : "Change payout account"}
                      <ArrowRight aria-hidden="true" />
                    </Btn>
                    <p className="text-[14px] text-muted-foreground">
                      Reviewed in {REVIEW_TIMES.bankAccount}. Payouts keep going to this account until a change is approved.
                    </p>
                  </div>
                )
              ) : (
                <p className="flex items-start gap-2 text-[14px] text-muted-foreground">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Only Super Admins and Finance Admins can change payout details. Ask one of them if this account needs to change.
                </p>
              )}
            </div>
            )}
          </Card>

          {history.length > 0 && (
            <section className="max-w-[760px] space-y-3" aria-labelledby="ba-history">
              <h2 id="ba-history" className="text-[16px] font-semibold">
                Change history
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {history.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="flex flex-wrap items-center gap-x-2 text-[14px] font-medium">
                        {request.from ? (
                          <>
                            <span>{accountLabel(request.from)}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="to" />
                          </>
                        ) : null}
                        <span>{accountLabel(request.account)}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {request.id} · {fmtDate(request.date)}
                        {request.requestedBy && ` · Requested by ${request.requestedBy}`}
                      </p>
                    </div>
                    <StatusBadge status={request.status === "Accepted" ? "Approved" : request.status} />
                    <Btn variant="tertiary" size="sm" aria-label={`View, ${request.id}`} onClick={() => setOpenId(request.id)}>
                      View
                    </Btn>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {view === "details" && (
        <div className="max-w-[720px] space-y-5">
          {flowHeader("New account details", "Enter the details exactly as they appear on your bank statement.")}
          <ErrorSummary errors={attempt > 0 ? errors : {}} focusKey={attempt} />
          <Card className="space-y-5">
            <TextInput
              id="ba-holder"
              label="Account holder name"
              value={BUSINESS.name}
              locked
              hint="Payouts can only go to an account in your business's registered name. Need a different name? Contact Koko support."
            />
            <div className="grid gap-5 sm:grid-cols-2">
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
                options={(bankEntry?.branches ?? []).map((branch) => ({ value: branch.name, label: branch.name, meta: `Branch ${branch.code}` }))}
                placeholder="Choose a branch"
                searchPlaceholder="Search branches"
                emptyText="No branches match. Try the city name."
                error={shown("ba-branch")}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <TextInput
                  id="ba-number"
                  label="Account number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={group(digits)}
                  onChange={(event) => update("number", event.target.value.replace(/\D/g, "").slice(0, 18))}
                  onBlur={() => touch("ba-number")}
                  error={shown("ba-number")}
                  aside={
                    bankEntry && (
                      <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                        {digits.length}/{bankEntry.accountDigits[bankEntry.accountDigits.length - 1]}
                      </span>
                    )
                  }
                  hint={
                    <>
                      Spaces are added for you.{" "}
                      <button type="button" className="font-medium text-foreground underline underline-offset-2" aria-expanded={showHelp} onClick={() => setShowHelp((value) => !value)}>
                        Where do I find this?
                      </button>
                    </>
                  }
                />
                {showHelp && (
                  <InlineAlert tone="neutral" title="Finding your account number">
                    It's printed at the top of your bank statement, next to the account name. In a passbook, it's on the first page. Don't use a card number or the branch code.
                  </InlineAlert>
                )}
              </div>
              <TextInput
                id="ba-confirm"
                label="Re-enter account number"
                inputMode="numeric"
                autoComplete="off"
                value={group(confirmNumber)}
                onChange={(event) => setConfirmNumber(event.target.value.replace(/\D/g, "").slice(0, 18))}
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
          </Card>
          <StickyActions>
            <Btn block onClick={toReview}>
              Continue to review
              <ArrowRight aria-hidden="true" />
            </Btn>
            <Btn
              block
              variant="tertiary"
              onClick={() => {
                setView("overview");
                notify("Draft saved", "Continue any time from Bank account.");
              }}
            >
              Save and exit
            </Btn>
          </StickyActions>
        </div>
      )}

      {view === "review" && (
        <div className="max-w-[720px] space-y-5">
          {flowHeader("Review the change", "Check the new account before you verify and submit.")}
          <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
            <Card className="p-4 sm:p-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From</h3>
              <div className="mt-3 flex items-center gap-3">
                <BankLogo bank={data.account.bank} />
                <div>
                  <p className="text-[15px] font-semibold">{accountLabel(data.account)}</p>
                  <p className="text-[14px] text-muted-foreground">{data.account.branch}</p>
                </div>
              </div>
            </Card>
            <div className="flex items-center justify-center text-muted-foreground" aria-hidden="true">
              <ArrowRight className="hidden h-5 w-5 md:block" />
              <ArrowDown className="h-5 w-5 md:hidden" />
            </div>
            <Card className="border-gray-900 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</h3>
                <Btn variant="tertiary" size="sm" className="-mr-2 -mt-2" onClick={() => setView("details")} aria-label="Edit, new account details">
                  Edit
                </Btn>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <BankLogo bank={bankDraft.bank} />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{bankDraft.bank}</p>
                  <p className="text-[15px] font-medium tabular-nums">{group(digits)}</p>
                  <p className="text-[14px] text-muted-foreground">{bankDraft.branch}</p>
                </div>
              </div>
            </Card>
          </div>
          <Card className="p-4 sm:p-5">
            <DefinitionList
              items={[
                ["Account holder", BUSINESS.name],
                ["Bank statement", statement ? `${statement.name} · ${fileSize(statement.size)}` : "Not attached"],
              ]}
            />
          </Card>
          <Card className="p-4 sm:p-5">
            <h3 className="mb-4 text-[15px] font-semibold">What happens next</h3>
            <Timeline
              items={[
                { label: "Confirm it's you", note: `We'll send a code to ${CURRENT_USER.maskedMobile}.`, state: "current" },
                { label: "Koko reviews the change", note: `Usually ${REVIEW_TIMES.bankAccount}. Payouts keep going to ${mask(data.account.number)}.`, state: "upcoming" },
                { label: "Payouts switch to the new account", note: `${REVIEW_TIMES.payoutHoldHours} hours after approval, for your security.`, state: "upcoming" },
              ]}
            />
          </Card>
          <Checkbox id="ba-attest" checked={attest} onChange={setAttest} error={attestAttempt > 0 && !attest ? "Confirm the account belongs to your business to continue." : undefined}>
            {LEGAL.bankAccountAttestation(BUSINESS.name)}
          </Checkbox>
          <StickyActions>
            <Btn block onClick={toVerify}>
              Continue to verification
              <ArrowRight aria-hidden="true" />
            </Btn>
            <Btn block variant="tertiary" onClick={() => setView("details")}>
              Back to details
            </Btn>
          </StickyActions>
        </div>
      )}

      {view === "verify" && (
        <div className="max-w-[720px] space-y-5">
          {flowHeader("Confirm it's you", "Changing where payouts go needs a one-time code.")}
          {submitAction.error && (
            <InlineAlert tone="error" title="Your change wasn't submitted">
              {submitAction.error}
            </InlineAlert>
          )}
          <Card className="space-y-4">
            <p className="text-[14px]">
              We sent a 6-digit code to <span className="font-semibold">{CURRENT_USER.maskedMobile}</span>. It expires in 10 minutes.
            </p>
            <div className="space-y-2">
              <label htmlFor="ba-otp" className="block text-[14px] font-medium">
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
                aria-invalid={codeError ? true : undefined}
                aria-describedby={codeError ? "ba-otp-error" : undefined}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={`h-12 w-11 border-[#6B7280] bg-white text-[18px] font-semibold ${codeError ? "border-[#b4232f]" : ""}`}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <FieldError id="ba-otp" error={codeError} />
            </div>
            {resendIn > 0 ? (
              <p className="text-[14px] text-muted-foreground" aria-live="polite">
                Didn't get it? You can request a new code in {resendIn} seconds.
              </p>
            ) : (
              <Btn
                variant="tertiary"
                size="sm"
                className="-ml-3"
                onClick={() => {
                  setResendIn(30);
                  notify("New code sent", `Check the SMS on ${CURRENT_USER.maskedMobile}.`);
                }}
              >
                Send a new code
              </Btn>
            )}
          </Card>
          <StickyActions>
            <Btn block loading={submitAction.pending} onClick={verify}>
              {submitAction.pending ? "Submitting…" : submitAction.error ? "Try again" : "Verify and submit"}
            </Btn>
            <Btn block variant="tertiary" disabled={submitAction.pending} onClick={() => setView("review")}>
              Back to review
            </Btn>
          </StickyActions>
        </div>
      )}

      {view === "done" && (
        <Card className="max-w-[720px] space-y-5">
          <CheckCircle2 className="h-10 w-10 text-emerald-700" aria-hidden="true" />
          <div>
            <h1 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
              Account change submitted
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              We'll email {CURRENT_USER.email} and the account owner ({CURRENT_USER.ownerEmail}) when it's reviewed. Payouts keep going to {mask(data.account.number)} until then.
            </p>
          </div>
          {receipt && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[#f6f6f8] px-4 py-2">
              <span className="text-[14px] text-muted-foreground">Reference</span>
              <span className="font-mono text-[14px] font-semibold">{receipt}</span>
              <CopyButton text={receipt} ariaLabel={`reference ${receipt}`} />
            </div>
          )}
          <Timeline
            items={[
              { label: "Submitted", date: fmtDateTime(new Date().toISOString()), state: "done" },
              { label: "Verified with SMS code", state: "done" },
              { label: "Koko review", note: `Expected by ${fmtDate(addBusinessDays(new Date().toISOString(), reviewDays))}`, state: "current" },
              { label: "Payouts switch to the new account", note: `${REVIEW_TIMES.payoutHoldHours} hours after approval`, state: "upcoming" },
            ]}
          />
          <StickyActions>
            <Btn block onClick={() => setView("overview")}>
              Back to bank account
            </Btn>
          </StickyActions>
        </Card>
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
        title="Account change request"
        description={detail ? `${detail.id} · Submitted ${fmtDate(detail.date)}` : undefined}
        footer={
          detail?.status === "Pending" && canManage ? (
            confirmCancel ? (
              <div className="space-y-3">
                <p className="text-[14px] font-medium">Cancel this request? Your payout account stays as it is.</p>
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
        {detail && <RequestDetail request={detail} activeFrom={data.accountActiveFrom} onRestart={canManage && !pending ? () => {
          setOpenId(null);
          startChange();
        } : undefined} />}
      </Drawer>
    </V1Page>
  );
}

function RequestDetail({ request, activeFrom, onRestart }: { request: AnyRequest; activeFrom?: string; onRestart?: () => void }) {
  const items: TimelineItem[] = [{ label: "Submitted", date: fmtDateTime(request.date), state: "done" }];
  if (request.verifiedAt) items.push({ label: "Verified with SMS code", date: fmtDateTime(request.verifiedAt), state: "done" });
  if (request.status === "Pending") {
    items.push({ label: "Koko review", note: `Expected by ${fmtDate(addBusinessDays(request.date, reviewDays))}`, state: "current" });
    items.push({ label: "Payouts switch to the new account", note: `${REVIEW_TIMES.payoutHoldHours} hours after approval`, state: "upcoming" });
  } else if (request.status === "Accepted") {
    items.push({ label: "Approved", date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined, state: "done" });
    const starts = activeFrom && new Date(activeFrom) > new Date();
    items.push({
      label: starts ? "Payouts switch to this account" : "Payouts go to this account",
      date: activeFrom ? fmtDateTime(activeFrom) : undefined,
      state: starts ? "current" : "done",
    });
  } else if (request.status === "Rejected") {
    items.push({ label: "Declined", date: request.decidedAt ? fmtDateTime(request.decidedAt) : undefined, note: request.reason, state: "failed" });
  } else {
    items.push({ label: "Cancelled by you", date: fmtDateTime("cancelledAt" in request ? request.cancelledAt : request.date), state: "failed" });
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
          ["From", request.from ? `${accountLabel(request.from)} · ${request.from.branch}` : "Not recorded"],
          ["To", `${accountLabel(request.account)} · ${request.account.branch}`],
          ["Account holder", request.account.holder],
          ["Bank statement", request.filename],
          ...(request.requestedBy ? ([["Requested by", request.requestedBy]] as Array<[string, string]>) : []),
        ]}
      />
    </div>
  );
}
