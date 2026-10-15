import { emptyLoan, reference, useFinanceData, type LoanRequest } from "../FinanceData";
import { BUSINESS, CREDIT_DECLINE_REASONS, CURRENT_USER } from "./placeholders";
import { useDemo } from "./demo";
import { VIEW_KEYS, useSetSearch } from "./url";

// Main UI demo scenarios, listed under Scenarios in the Version switcher.
// Each one loads sample data and opens the view where it can be seen.
export type Scenario = { id: string; label: string; description: string };
// Merchant loans intro: shows on each page load; this event brings it back.
// Shared so a scenario can reset it even when the page isn't open.
export const introState = { dismissed: false };
export const INTRO_RESET_EVENT = "koko-credit-intro-reset";

export const SCENARIOS: Scenario[] = [
  {
    id: "credit-first-visit",
    label: "Merchant loans: first visit",
    description: "Shows the How it works introduction again",
  },
  {
    id: "credit-accepted",
    label: "Merchant loans: request accepted",
    description: "Sampath Bank accepted a request and made an offer",
  },
  {
    id: "credit-rejected",
    label: "Merchant loans: request rejected",
    description: "Sampath Bank rejected a request (shown in Requests)",
  },
  {
    id: "credit-not-eligible",
    label: "Merchant loans: not eligible yet",
    description: "Koko sales are below what the bank needs",
  },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

// Once sent, a request is only ever accepted or rejected by the bank.
function decidedRequest(status: "Accepted" | "Rejected"): LoanRequest {
  return {
    id: reference("MC"),
    bankId: "sampath",
    status,
    date: daysAgo(6),
    decidedAt: daysAgo(1),
    ...(status === "Accepted"
      ? { offer: { amount: "1500000", term: "24", rate: "14.5% a year" } }
      : { reason: CREDIT_DECLINE_REASONS[1] }),
    requestedBy: CURRENT_USER.username,
    consent: { crib: true, authorised: true, at: daysAgo(6), by: CURRENT_USER.username },
    form: {
      ...emptyLoan,
      amount: "1500000",
      purpose: "Business expansion",
      term: "24",
      security: "None",
      business: BUSINESS.name,
      registration: BUSINESS.registration,
      employees: "11–50",
      contact: CURRENT_USER.name,
      designation: "Director",
      phone: CURRENT_USER.mobile,
      email: CURRENT_USER.email,
      revenue: "420833",
      borrowing: "Yes",
      lender: "Hatton National Bank",
      repayments: "45000",
      outstanding: "600000",
      statements: "Carnage-statements-Apr-Sep.pdf",
    },
  };
}

export function useRunScenario() {
  const { setData } = useFinanceData();
  const { update } = useDemo();
  const setSearch = useSetSearch();
  const clear = Object.fromEntries(VIEW_KEYS.map((key) => [key, null]));
  return (id: string) => {
    if (id === "credit-first-visit") {
      introState.dismissed = false;
      window.dispatchEvent(new Event(INTRO_RESET_EVENT));
      update({ eligibility: "eligible", role: "Super Admin" });
      setSearch({ ...clear, page: "merchant-loans" });
      return;
    }
    if (id === "credit-not-eligible") {
      update({ eligibility: "not-eligible", role: "Super Admin" });
      setData((previous) => {
        const drafts = { ...previous.loanDrafts };
        delete drafts.sampath;
        return {
          ...previous,
          loanDrafts: drafts,
          loans: previous.loans.filter((loan) => loan.bankId !== "sampath"),
        };
      });
      setSearch({ ...clear, page: "merchant-loans" });
      return;
    }
    if (id !== "credit-accepted" && id !== "credit-rejected") return;
    update({ eligibility: "eligible", role: "Super Admin" });
    const request = decidedRequest(id === "credit-accepted" ? "Accepted" : "Rejected");
    setData((previous) => {
      const drafts = { ...previous.loanDrafts };
      delete drafts[request.bankId];
      return {
        ...previous,
        loanDrafts: drafts,
        loans: [request, ...previous.loans.filter((loan) => loan.bankId !== request.bankId)],
        cancelledLoans: (previous.cancelledLoans ?? []).filter(
          (loan) => loan.bankId !== request.bankId,
        ),
      };
    });
    // Only accepted requests have a side panel; a rejected one shows in the list.
    setSearch({
      ...clear,
      page: "merchant-loans",
      tab: "requests",
      request: request.status === "Accepted" ? request.id : null,
    });
  };
}
