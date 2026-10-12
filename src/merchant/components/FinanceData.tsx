import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Account = { holder: string; bank: string; branch: string; number: string };
export type LoanForm = {
  amount: string;
  purpose: string;
  term: string;
  business: string;
  registration: string;
  contact: string;
  phone: string;
  email: string;
  revenue: string;
  borrowing: string;
  repayments: string;
  // Iteration 1 only: free-text purpose when "Other" is chosen.
  purposeOther: string;
};
export type LoanStatus = "Pending" | "Accepted" | "Rejected";
// Optional fields below are written by iteration 1 only; iteration 2 ignores them.
export type LoanRequest = {
  id: string;
  bankId: string;
  date: string;
  status: LoanStatus;
  form: LoanForm;
  requestedBy?: string;
  decidedAt?: string;
  reason?: string;
  offer?: { amount: string; term: string; rate: string };
  consent?: { crib: boolean; authorised: boolean; at: string; by: string };
};
export type BankRequest = {
  id: string;
  date: string;
  status: "Pending" | "Accepted" | "Rejected";
  account: Account;
  filename: string;
  requestedBy?: string;
  decidedAt?: string;
  reason?: string;
  from?: Account;
  verifiedAt?: string;
};
// Iteration 1 moves cancelled requests here so iteration 2's lists and
// one-active-request rules never see a status they don't know.
export type CancelledBankRequest = Omit<BankRequest, "status"> & { status: "Cancelled"; cancelledAt: string };
export type CancelledLoanRequest = Omit<LoanRequest, "status"> & { status: "Cancelled"; cancelledAt: string };
export const initialAccount: Account = {
  holder: "Carnage Retail (Pvt) Ltd",
  bank: "Commercial Bank",
  branch: "Kollupitiya",
  number: "8000124821",
};
export const emptyAccount: Account = { holder: "", bank: "", branch: "", number: "" };
export const emptyLoan: LoanForm = {
  amount: "",
  purpose: "",
  term: "",
  business: "Carnage Retail (Pvt) Ltd",
  registration: "PV-DEMO-001",
  contact: "",
  phone: "",
  email: "",
  revenue: "",
  borrowing: "",
  repayments: "",
  purposeOther: "",
};
export const lenders = [
  {
    id: "sampath",
    name: "Sampath Bank",
    initials: "SB",
    description:
      "Request business funding through Koko. Sampath Bank reviews your request and provides a response.",
    accent: "#9A441D",
  },
];
export const currency = (value: string | number) =>
  `LKR ${Number(value).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
export const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
export const reference = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export type Data = {
  account: Account;
  bankRequests: BankRequest[];
  loans: LoanRequest[];
  loanDrafts: Record<string, LoanForm>;
  // Iteration 1 only.
  accountActiveFrom?: string;
  notifyBanks?: string[];
  cancelledBankRequests?: CancelledBankRequest[];
  cancelledLoans?: CancelledLoanRequest[];
};
const initial: Data = { account: initialAccount, bankRequests: [], loans: [], loanDrafts: {} };
const FinanceContext = createContext<{
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
  bankDraft: Account;
  setBankDraft: React.Dispatch<React.SetStateAction<Account>>;
  statement: File | null;
  setStatement: React.Dispatch<React.SetStateAction<File | null>>;
} | null>(null);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [loaded, setLoaded] = useState(false);
  const [bankDraft, setBankDraft] = useState<Account>(emptyAccount);
  const [statement, setStatement] = useState<File | null>(null);
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem("koko-bank-draft-v1");
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (
          ["holder", "bank", "branch", "number"].every(
            (key) => typeof parsedDraft[key] === "string",
          )
        )
          setBankDraft(parsedDraft);
      }
      const stored = sessionStorage.getItem("koko-finance-demo-v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed.account &&
          Array.isArray(parsed.bankRequests) &&
          Array.isArray(parsed.loans) &&
          parsed.loanDrafts
        )
          setData(parsed);
      }
    } catch {
      /* Start fresh if storage is unavailable. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        sessionStorage.setItem("koko-finance-demo-v1", JSON.stringify(data));
        sessionStorage.setItem("koko-bank-draft-v1", JSON.stringify(bankDraft));
      } catch {
        /* In-memory use remains available. */
      }
    }
  }, [data, bankDraft, loaded]);
  return (
    <FinanceContext.Provider
      value={{ data, setData, bankDraft, setBankDraft, statement, setStatement }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
export function useFinanceData() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("FinanceDataProvider is required");
  return value;
}
