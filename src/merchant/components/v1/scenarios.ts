import {
  emptyLoan,
  reference,
  useFinanceData,
  type LoanForm,
  type LoanRequest,
} from "../FinanceData";
import { BUSINESS, CURRENT_USER } from "./placeholders";
import { VIEW_KEYS, useSetSearch } from "./url";

// Main UI demo scenarios, listed under Scenarios in the Version switcher.
// Each one loads sample data and opens the view where it can be seen.
export type Scenario = { id: string; label: string; description: string };
export const SCENARIOS: Scenario[] = [
  {
    id: "credit-changes-requested",
    label: "Merchant credit: changes requested",
    description: "Sampath Bank sent a request back with changes to make",
  },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

function changesRequested(): LoanRequest {
  return {
    id: reference("MC"),
    bankId: "sampath",
    status: "Rejected",
    date: daysAgo(6),
    decidedAt: daysAgo(1),
    reason:
      "Sampath Bank can't approve this request as it is, but will review it again with the changes below.",
    changes: [
      {
        step: 0,
        fields: ["mc-amount", "mc-security"],
        title: "Lower the amount or offer security",
        note: "Up to LKR 1,700,000 can be approved without security. For LKR 3,500,000, offer a fixed deposit or property.",
      },
      {
        step: 2,
        fields: ["mc-statements"],
        title: "Add the missing bank statements",
        note: "The statements cover April to July. Add August and September so all 6 months are included.",
      },
    ],
    requestedBy: CURRENT_USER.username,
    consent: { crib: true, authorised: true, at: daysAgo(6), by: CURRENT_USER.username },
    form: {
      ...emptyLoan,
      amount: "3500000",
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
      statements: "Carnage-statements-Apr-Jul.pdf",
    },
  };
}

// A new draft prefilled from a request the bank sent back. Statements must be
// attached again; the first step with a requested change is where to start.
export const resubmitDraft = (request: Pick<LoanRequest, "id" | "form">): LoanForm => ({
  ...request.form,
  statements: "",
  accounts: "",
  resubmitOf: request.id,
});
export const firstChangeStep = (request: Pick<LoanRequest, "changes">) =>
  Math.min(...(request.changes ?? [{ step: 0 }]).map((change) => change.step));

export function useRunScenario() {
  const { setData } = useFinanceData();
  const setSearch = useSetSearch();
  return (id: string) => {
    if (id !== "credit-changes-requested") return;
    const request = changesRequested();
    setData((previous) => {
      return {
        ...previous,
        loanDrafts: { ...previous.loanDrafts, [request.bankId]: resubmitDraft(request) },
        loans: [request, ...previous.loans.filter((loan) => loan.bankId !== request.bankId)],
        cancelledLoans: (previous.cancelledLoans ?? []).filter(
          (loan) => loan.bankId !== request.bankId,
        ),
      };
    });
    setSearch({
      ...Object.fromEntries(VIEW_KEYS.map((key) => [key, null])),
      page: "merchant-loans",
      apply: request.bankId,
      step: String(firstChangeStep(request) + 1),
    });
  };
}
