import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  emptyAccount,
  initialAccount,
  lenders,
  useFinanceData,
  type LoanStatus,
} from "../FinanceData";
import { Switch } from "../ui/switch";
import { useDemo } from "./demo";
import {
  BANK_DECLINE_REASONS,
  CREDIT_DECLINE_REASONS,
  DEMO_OTP,
  DEMO_ROLES,
  OFFER_RATE,
  PLACEHOLDER_SUMMARY,
  REVIEW_TIMES,
} from "./placeholders";
import { Btn, Drawer, FilterChips, StatusBadge, lkr } from "./ui";

// Iteration 1 demo panel: simulated bank decisions and scenario switches that
// used to sit inside the merchant-facing request details.
export function DemoPanel() {
  const { panelOpen, setPanelOpen, settings, update } = useDemo();
  const { data, setData, setBankDraft, setStatement } = useFinanceData();
  const [bankReason, setBankReason] = useState(BANK_DECLINE_REASONS[0]);
  const [creditReason, setCreditReason] = useState(CREDIT_DECLINE_REASONS[0]);
  const [confirmReset, setConfirmReset] = useState(false);
  const now = () => new Date().toISOString();
  const bankName = (id: string) => lenders.find((lender) => lender.id === id)?.name ?? id;

  const decideBank = (id: string, approve: boolean) =>
    setData((previous) => {
      const request = previous.bankRequests.find((item) => item.id === id);
      if (!request || request.status !== "Pending") return previous;
      const decidedAt = now();
      return {
        ...previous,
        account: approve ? request.account : previous.account,
        accountActiveFrom: approve
          ? new Date(Date.now() + REVIEW_TIMES.payoutHoldHours * 3600 * 1000).toISOString()
          : previous.accountActiveFrom,
        bankRequests: previous.bankRequests.map((item) =>
          item.id === id
            ? {
                ...item,
                status: approve ? "Accepted" : "Rejected",
                decidedAt,
                reason: approve ? undefined : bankReason,
                from: item.from ?? previous.account,
              }
            : item,
        ),
      };
    });

  const decideLoan = (id: string, status: LoanStatus) =>
    setData((previous) => {
      const target = previous.loans.find((item) => item.id === id);
      if (!target) return previous;
      const conflict = previous.loans.some(
        (item) => item.id !== id && item.bankId === target.bankId && item.status !== "Rejected",
      );
      if (status !== "Rejected" && conflict) return previous;
      return {
        ...previous,
        loans: previous.loans.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                decidedAt: status === "Pending" ? undefined : now(),
                reason: status === "Rejected" ? creditReason : undefined,
                offer:
                  status === "Accepted"
                    ? { amount: item.form.amount, term: item.form.term, rate: OFFER_RATE }
                    : undefined,
              }
            : item,
        ),
      };
    });

  const pendingBank = data.bankRequests.filter((request) => request.status === "Pending");

  return (
    <Drawer
      open={panelOpen}
      onOpenChange={setPanelOpen}
      title="Demo panel"
      description="Prototype controls. Merchants never see this panel."
      footer={
        confirmReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm">Clear all requests, drafts and the account change?</p>
            <Btn variant="tertiary" size="sm" onClick={() => setConfirmReset(false)}>
              Keep data
            </Btn>
            <Btn
              variant="danger"
              size="sm"
              onClick={() => {
                setData({ account: initialAccount, bankRequests: [], loans: [], loanDrafts: {} });
                setBankDraft(emptyAccount);
                setStatement(null);
                setConfirmReset(false);
              }}
            >
              Reset demo data
            </Btn>
          </div>
        ) : (
          <Btn variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw aria-hidden="true" />
            Reset demo data
          </Btn>
        )
      }
    >
      <div className="space-y-8">
        <section className="space-y-4" aria-labelledby="demo-scenario">
          <h3 id="demo-scenario" className="text-base font-semibold">
            Scenario
          </h3>
          <label className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <span>
              <span className="block text-sm font-medium">Fail the next request</span>
              <span className="block text-xs text-muted-foreground">
                Shows the error and retry state on the next submit, verify or download.
              </span>
            </span>
            <Switch
              checked={settings.failNext}
              onCheckedChange={(checked) => update({ failNext: checked })}
              aria-label="Fail the next request"
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Signed-in role</p>
            <FilterChips
              label="Signed-in role"
              value={settings.role}
              onChange={(role) => update({ role: role as (typeof DEMO_ROLES)[number] })}
              items={DEMO_ROLES.map((role) => ({ value: role, label: role }))}
            />
            <p className="text-xs text-muted-foreground">
              Branch Admin and Cashier see finance pages read-only.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Merchant loans eligibility</p>
            <FilterChips
              label="Merchant loans eligibility"
              value={settings.eligibility}
              onChange={(value) => update({ eligibility: value as "eligible" | "not-eligible" })}
              items={[
                { value: "eligible", label: "Eligible" },
                { value: "not-eligible", label: "Not yet eligible" },
              ]}
            />
          </div>
          <p className="rounded-lg bg-[#f6f6f8] p-3 text-sm">
            Verification code for the bank account change:{" "}
            <span className="font-mono font-semibold">{DEMO_OTP}</span>
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="demo-bank">
          <h3 id="demo-bank" className="text-base font-semibold">
            Bank account review
          </h3>
          {pendingBank.length ? (
            <>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Reason if rejected</span>
                <select
                  className="h-10 w-full rounded-lg border border-[#6B7280] bg-white px-2 text-sm"
                  value={bankReason}
                  onChange={(event) => setBankReason(event.target.value)}
                >
                  {BANK_DECLINE_REASONS.map((reason) => (
                    <option key={reason}>{reason}</option>
                  ))}
                </select>
              </label>
              {pendingBank.map((request) => (
                <div key={request.id} className="space-y-3 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">
                    {request.account.bank} •••• {request.account.number.slice(-4)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {request.id}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Btn size="sm" onClick={() => decideBank(request.id, true)}>
                      Approve change
                    </Btn>
                    <Btn
                      size="sm"
                      variant="secondary"
                      onClick={() => decideBank(request.id, false)}
                    >
                      Decline change
                    </Btn>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No account change is waiting for review.
            </p>
          )}
        </section>

        <section className="space-y-3" aria-labelledby="demo-credit">
          <h3 id="demo-credit" className="text-base font-semibold">
            Merchant loans responses
          </h3>
          {data.loans.length ? (
            <>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Reason if rejected</span>
                <select
                  className="h-10 w-full rounded-lg border border-[#6B7280] bg-white px-2 text-sm"
                  value={creditReason}
                  onChange={(event) => setCreditReason(event.target.value)}
                >
                  {CREDIT_DECLINE_REASONS.map((reason) => (
                    <option key={reason}>{reason}</option>
                  ))}
                </select>
              </label>
              {data.loans.map((request) => {
                const conflict = data.loans.some(
                  (item) =>
                    item.id !== request.id &&
                    item.bankId === request.bankId &&
                    item.status !== "Rejected",
                );
                return (
                  <div key={request.id} className="space-y-3 rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {bankName(request.bankId)} · {lkr(request.form.amount)}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {request.id}
                        </span>
                      </p>
                      <StatusBadge
                        status={request.status}
                        label={request.status === "Rejected" ? "Rejected" : undefined}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Btn
                        size="sm"
                        disabled={request.status === "Accepted" || conflict}
                        onClick={() => decideLoan(request.id, "Accepted")}
                      >
                        Accept with offer
                      </Btn>
                      <Btn
                        size="sm"
                        variant="secondary"
                        disabled={request.status === "Rejected"}
                        onClick={() => decideLoan(request.id, "Rejected")}
                      >
                        Reject
                      </Btn>
                      <Btn
                        size="sm"
                        variant="tertiary"
                        disabled={request.status === "Pending" || conflict}
                        onClick={() => decideLoan(request.id, "Pending")}
                      >
                        Back to in review
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No merchant loan requests yet.</p>
          )}
        </section>

        <section className="space-y-2" aria-labelledby="demo-placeholders">
          <h3 id="demo-placeholders" className="text-base font-semibold">
            Placeholder content in use
          </h3>
          <p className="text-sm text-muted-foreground">
            Replace these in v1/placeholders.ts once the real values are confirmed.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {PLACEHOLDER_SUMMARY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </Drawer>
  );
}
