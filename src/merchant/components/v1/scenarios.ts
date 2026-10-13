import { emptyLoan, reference, useFinanceData, type LoanRequest } from "../FinanceData";
import { BUSINESS, CURRENT_USER } from "./placeholders";
import { VIEW_KEYS, useSetSearch } from "./url";

// Main UI demo scenarios, listed under Scenarios in the Version switcher.
// Each one loads sample data and opens the page where it can be seen.
export type Scenario = { id: string; label: string; description: string };
export const SCENARIOS: Scenario[] = [
  {
    id: "credit-changes-requested",
    label: "Merchant credit: changes requested",
    description: "Sampath Bank declined a request and asked for changes",
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
        title: "Lower the amount or offer security",
        note: "Up to LKR 1,700,000 can be approved without security. For LKR 3,500,000, offer a fixed deposit or property.",
      },
      {
        step: 2,
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

export function useRunScenario() {
  const { setData } = useFinanceData();
  const setSearch = useSetSearch();
  return (id: string) => {
    if (id !== "credit-changes-requested") return;
    const request = changesRequested();
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
    setSearch({
      ...Object.fromEntries(VIEW_KEYS.map((key) => [key, null])),
      page: "merchant-loans",
      tab: "requests",
      request: request.id,
    });
  };
}
