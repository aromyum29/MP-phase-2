// PLACEHOLDER CONTENT for iteration 1.
// Every value in this file is a stand-in until the real source is available:
// lender terms and thresholds from Sampath Bank, legal wording from legal,
// bank and branch directories from LankaClear, and brand values from the
// brand team. The Demo panel lists these so they are not mistaken for
// confirmed figures. Replace values here; components read from this file.

export const CURRENT_USER = {
  username: "Johdoe1",
  name: "John Doe",
  email: "john.doe@carnage.lk",
  mobile: "077 123 4568",
  maskedMobile: "077 ••• ••68",
  ownerEmail: "admin@carnage.lk",
};

export const BUSINESS = {
  name: "Carnage Retail (Pvt) Ltd",
  registration: "PV 00245781",
};

// Roles from Profiles that may change payout details or apply for credit.
export const FINANCE_ROLES = ["Super Admin", "Finance Admin"] as const;
export const DEMO_ROLES = ["Super Admin", "Finance Admin", "Branch Admin", "Cashier"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export const DEMO_OTP = "123456";

export const REVIEW_TIMES = {
  bankAccount: "1–2 business days",
  payoutHoldHours: 24,
  credit: "about 5 business days",
};

export const NEXT_PAYOUT = { amount: 184250, weekday: 4 }; // LKR, paid every Thursday

// Bank and branch directory. Branch codes are illustrative.
export type BankEntry = { name: string; accountDigits: number[]; branches: Array<{ name: string; code: string }> };
const branchList = (names: string[]) =>
  names.map((name, index) => ({ name, code: String(index + 1).padStart(3, "0") }));
export const BANKS: BankEntry[] = [
  { name: "Bank of Ceylon", accountDigits: [8, 9], branches: branchList(["Head Office", "Colombo Fort", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo", "Kurunegala", "Jaffna", "Matara"]) },
  { name: "Commercial Bank", accountDigits: [10], branches: branchList(["Head Office", "Colombo Fort", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo", "Kurunegala", "Jaffna", "Matara"]) },
  { name: "DFCC Bank", accountDigits: [12], branches: branchList(["Head Office", "Colombo City", "Kollupitiya", "Nugegoda", "Kandy", "Galle", "Negombo", "Kurunegala"]) },
  { name: "Hatton National Bank", accountDigits: [12], branches: branchList(["Head Office", "City Office", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo", "Kurunegala", "Jaffna"]) },
  { name: "Nations Trust Bank", accountDigits: [12], branches: branchList(["Head Office", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo"]) },
  { name: "NDB Bank", accountDigits: [12], branches: branchList(["Head Office", "Kollupitiya", "Nugegoda", "Kandy", "Galle", "Negombo"]) },
  { name: "People's Bank", accountDigits: [15], branches: branchList(["Head Office", "Colombo Fort", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo", "Kurunegala", "Jaffna", "Matara"]) },
  { name: "Sampath Bank", accountDigits: [12], branches: branchList(["Head Office", "City Office", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo", "Kurunegala", "Jaffna"]) },
  { name: "Seylan Bank", accountDigits: [12], branches: branchList(["Head Office", "Kollupitiya", "Wellawatte", "Nugegoda", "Kandy", "Galle", "Negombo"]) },
];

// Merchant credit: lender terms and eligibility rules.
export const LENDER_TERMS: Record<string, {
  min: number; max: number; terms: number[]; decision: string; rates: string;
  minMonths: number; minMonthlySales: number; multiple: number; documents: string[];
}> = {
  sampath: {
    min: 250000,
    max: 5000000,
    terms: [6, 12, 24, 36],
    decision: "about 5 business days",
    rates: "Rates set by Sampath Bank",
    minMonths: 6,
    minMonthlySales: 300000,
    multiple: 4,
    documents: ["Business registration certificate", "Bank statements for the last 6 months", "NIC of each director"],
  },
};

// Koko sales history used for eligibility (two demo scenarios).
export const KOKO_SALES = {
  eligible: { monthsOnKoko: 14, monthly: [380000, 410000, 395000, 450000, 470000, 420000] },
  "not-eligible": { monthsOnKoko: 4, monthly: [0, 0, 120000, 160000, 210000, 230000] },
};

// Banks shown as coming soon in Merchant credit.
export const COMING_SOON_BANKS = [
  { id: "commercial", name: "Commercial Bank" },
  { id: "hnb", name: "Hatton National Bank" },
  { id: "boc", name: "Bank of Ceylon" },
  { id: "nations-trust", name: "Nations Trust Bank" },
  { id: "dfcc", name: "DFCC Bank" },
];

export const LEGAL = {
  crib: (bank: string, business: string) =>
    `I authorise ${bank} to obtain a credit report on ${business} and its directors from the Credit Information Bureau of Sri Lanka (CRIB) to assess this request.`,
  authorised: (business: string) =>
    `I confirm I'm authorised to apply on behalf of ${business} and that the details in this request are correct.`,
  bankAccountAttestation: (business: string) =>
    `I confirm this account belongs to ${business} and that I'm authorised to change where payouts are sent.`,
  termsBody:
    "Sample text. Replace with the bank's published terms and privacy notice before launch.",
};

// Brand colours sampled from koko-logo.png. Confirm with the brand team.
export const BRAND_COLOURS = [
  { name: "Koko pink", hex: "#FFBCD9" },
  { name: "Koko blue", hex: "#021FA3" },
  { name: "Koko cyan", hex: "#00DAD6" },
];
export const BRAND_FONT = "Plus Jakarta Sans";

export const PLACEHOLDER_SUMMARY = [
  "Sampath Bank amount range, terms, decision time and documents",
  "Eligibility rules (6 months on Koko, LKR 300,000 average monthly sales, 4× multiple)",
  "Koko sales history for both eligibility scenarios",
  "CRIB consent, authority and attestation wording, bank terms text",
  "Bank account review time, 24-hour payout hold, next payout amount",
  "Bank directory, account number lengths and branch codes",
  "Koko brand colours (sampled from the logo file)",
];

// Decisions shown to merchants. Used by the Demo panel to simulate responses.
export const OFFER_RATE = "14.5% p.a. (fixed)";
export const BANK_DECLINE_REASONS = [
  "The statement doesn't show the account holder's name.",
  "The statement is older than 3 months.",
  "The account number doesn't match the statement.",
];
export const CREDIT_DECLINE_REASONS = [
  "Average monthly sales are below the bank's minimum for this amount.",
  "Existing repayments are too high for the amount requested.",
  "The business registration couldn't be verified.",
];

// Where an accepted request continues. Replace with the bank's application link.
export const LENDER_LINKS: Record<string, { apply: string; label: string }> = {
  sampath: { apply: "https://www.sampath.lk/", label: "Sampath Bank's website" },
};
