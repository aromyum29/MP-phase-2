# Koko Merchant Portal — complete reproduction context

Snapshot: 12 October 2026. This archive contains the actual implemented project, not just a specification. Use the included source as the authoritative reference for a 1:1 rebuild. Keep the existing component structure, styles, content, imagery, interactions, and responsive behavior. Do not replace it with a newly designed approximation.

## Start here

1. Extract the archive; open the `merchantportal` directory.
2. Use Bun 1.3.14 (the version used for this snapshot). Node v24.13.1 was also installed on the development machine.
3. Run `bun install --frozen-lockfile`.
4. Run `bun run dev --host 127.0.0.1 --port 5173`.
5. Open http://127.0.0.1:5173/ . A fresh browser opens directly to Create Order inside the portal. No login is required.
6. Validate with `bun run build` and `./node_modules/.bin/tsc --noEmit`.

Do not upgrade dependencies or replace the lockfile as part of reproduction. Dependency installation requires internet or a populated Bun cache. No application API keys or environment variables are needed for the local prototype. The original build target is Cloudflare via the Lovable/TanStack configuration; output is `.output/`. No deployment has been performed. The documented local preview is the Vite development server.

The archive omits regenerable `node_modules`, build output, tool caches, version-control history, and machine-specific files. All project source, local image assets, configuration, and the dependency lockfile are included. Browser storage and uploaded test files are not part of the project archive.

## User decisions implemented

- Start directly inside the merchant portal; do not restore the original login screen.
- Keep the original merchant portal UI and existing features from the supplied merchantportal11.zip.
- Replace the sidebar's bottom promotional banner with a Version switcher overlay dropdown. It labels iteration 1 "Main UI" and iteration 2 "Alternate UI" (collapsed badge M or A).
- Maintain two UI iterations in one application, with shared finance data.
- Use Financial statement as the default Finance landing view. Its three KPI cards show totals only; percentage change badges and “vs prev period” comparison text have been removed.
- Name the bank account section Bank account.
- Name the credit product Merchant credit (previously Merchant loans / seller credit). Internal source filenames and IDs retain `MerchantLoans` / `merchant-loans`; this is intentional, not stale visible copy. Iteration 1 uses “merchant credit requests” throughout the overview, application, validation, review, confirmation and request details; do not use “loan” in its visible UI. Iteration 2 preserves its previous wording. Existing data keys/types remain unchanged for storage compatibility.
- Iteration 1: Finance is an expandable sidebar category with Financial statement, Bank account, and Merchant credit as direct page destinations, in that order. These pages do not repeat the Finance tab strip.
- Iteration 2: Finance has Financial statement, Bank account, and Merchant credit segments; no separate credit sidebar item.
- Sidebar grouping (iteration 1 only): Create Order, Orders, Analytics and Static QR are the top primary destinations without a visible group label. Finance: Financial statement, Bank account, Merchant credit. Marketing (sparkles icon): Campaigns, Koko assets. Developers: Plugins. Administration: Profiles, Action History. Categories are regular-sized icon-led rows with right-aligned down chevrons, matching the supplied Stripe reference. All categories start closed. Only one category can be expanded at a time on desktop or mobile; opening another closes the previous one. Opening a category selects its first destination (Finance → Financial statement, Marketing → Campaigns, Developers → Plugins, Administration → Profiles). Clicking an open category closes it without changing the current page. Child destinations are indented. A subtle inset separator with 16px spacing above and below separates the primary Create Order / Orders / Analytics / Static QR navigation from the category rows on desktop and mobile. Desktop uses compact rows; mobile keeps 44px touch targets. Collapsed sidebar shows primary and category icon buttons; selecting a category expands the sidebar and opens it. Mobile uses the same grouping and expanded state.
- Iteration 2 restores the original flat sidebar order and original row/icon spacing, with no category dropdowns. It retains the version switcher and prior feature updates; Merchant credit remains inside Finance.
- Koko assets is directly below Campaigns in both iterations, within Growth only in iteration 1.
- Demo badges have been removed from section headers in the UI. Descriptive prototype explanations remain; no backend behavior changed.
- Iteration 1 bank logos come from the user-supplied Figma Bank Logos component set: Commercial Bank, Sampath Bank, Hatton National Bank, Bank of Ceylon, Nations Trust Bank and DFCC Bank. Preserve the exact 40px square components. Iteration 2 retains its original rectangular website logos. All logos are local files, not hotlinked.

## Architecture and important source locations

- `src/routes/index.tsx`: root route renders merchant App.
- `src/routes/__root.tsx`: document shell, CSS and font loading, route/error handling.
- `src/merchant/App.tsx`: IterationProvider, FinanceDataProvider, ThemeProvider, MerchantPortal, and toast system. No authentication gate.
- `src/merchant/components/MerchantPortal.tsx`: desktop/collapsed sidebar, mobile navigation, active page, conditional iteration navigation and page rendering. The mobile menu unmounts after its closing animation so it cannot block the page invisibly.
- `NavigationData.ts`: base navigation: Create Order, Orders, Static QR, Analytics, Campaigns, Koko assets, Plugins, Finance, Profiles, Action History. Iteration 1 builds its category navigation from `navigationGroups` and `financeNavigationItems`; iteration 2 uses the original flat base list.
- `IterationProvider.tsx` and `VersionSwitcher.tsx`: UI version state and switcher.
- `FinanceWorkspace.tsx`: iteration 2 Finance segments (its Merchant credit segment renders `MerchantCreditAlt embedded`). Iteration 1 renders the Finance, BankAccount and MerchantLoans components directly.
- `Finance.tsx`: original financial statement interface.
- `BankAccount.tsx`: current payout account, change form, review, confirmation, request history and simulated review decisions.
- `MerchantLoans.tsx`: shared four-step application, request details and simulated lender responses; preserves the original iteration 2 overview. `MerchantCreditOverview.tsx`: iteration 1 Banks / Request history sections, compact six-bank directory and nested request-status tabs.
- `FinanceData.tsx`: shared finance models, initial mock account, extensible lender array, drafts and request persistence.
- `FinanceShared.tsx`: shared finance fields, error summaries, panels, statuses and definition lists.
- `FinanceButton.tsx`: iteration-aware action wrapper (now used only by iteration 2 and the original Finance/Financial statement components; see the iteration 1 production pass below). All iteration 1 Finance CTAs use the login primary style (`bg-gray-900`, white text, `hover:bg-gray-800`), including invoice, account-change, upload, draft, review, detail and next-step actions. Disabled actions retain the navy style at reduced opacity. Form controls, navigation tabs and disclosure controls retain their normal control styling. Iteration 2 keeps the original button variants. Account request cards in iteration 1 expose an explicit navy View request action.
- `BankLogo.tsx`: iteration-aware local logo mapping by bank name. Iteration 1 uses six Figma variants matching account options and the credit bank directory; iteration 2 retains Commercial/Sampath website assets and original layout. Unknown banks fall back to a building icon. An accepted account change updates the logo with the selected bank.
- `tools/KokoAssets.tsx`: marketing library UI; `tools/koko-assets-data.json`: asset catalogue, dimensions, bytes and download URLs.
- `src/merchant/components/ui/`: existing reusable UI primitives (Radix-based components).
- `src/merchant/imports/`: original generated vector/design code.
- `src/figma-assets/`: original image files from the supplied project; preserve filenames.
- `public/koko-assets/`: merchant-downloadable marketing files and starter ZIP.
- `public/bank-logos/`: Figma component image assets, original bank website logos, and SOURCES.txt with source node IDs and provenance.
- `vite.config.ts`: custom resolver maps `figma:asset/<filename>` imports to `src/figma-assets/<filename>`. Retain this resolver.
- `src/styles.css`, `src/_globals.css`, `src/_theme.css`: Tailwind v4 source scanning, existing styling and theme tokens. Do not remove the source scanning directives.

Main stack: React 19, TypeScript, Vite 8, TanStack Start/Router, Tailwind CSS 4, Radix UI, Lucide and Heroicons. Exact resolved dependency versions are in `bun.lock`. Some inherited files have `@ts-nocheck`; a successful TypeScript check does not mean those inherited files were fully typechecked.

## Visual fidelity

Keep the original Plus Jakarta Sans typography, pale blue Koko accents, soft gradient active navigation, rounded panels, existing shadows, compact controls and generous content spacing. Reuse current CSS and components instead of estimating values from screenshots. CSS tokens and component class strings are authoritative.

Plus Jakarta Sans is loaded from Google Fonts in `src/routes/__root.tsx`. Internet access to Google Fonts is needed for the exact font appearance; otherwise system fallbacks apply. The original root social-preview metadata also references a remote image; it is not part of the visible portal UI. Koko marketing assets and bank logos are fully local.

Bank logos retain their source proportions, colors and backgrounds. Do not redraw or recolor them. Iteration 1 uses the exact 40 × 40px Figma frames, 6px corners and source image placement; Bank of Ceylon has its source yellow background. Use explicit pixel frame sizes because this project has a 14px root font size. Iteration 2 keeps its previous padded rectangular white logo frames. Figma source: https://www.figma.com/design/jJ0oWKtzdTnwJN5Cg01xjT/Bank-Logos?node-id=1-11. `iteration-1-figma-bank-account.png` and `iteration-1-figma-merchant-credit.png` are the current bank-logo references. `docs/screenshots/` contains desktop and 390px mobile references for the updated bank and credit views, plus the Koko assets page. `icon-sidebar.png` is the current iteration 1 navigation reference (Finance expanded to demonstrate direct destinations), and `iteration-2-original-sidebar.png` shows the restored flat iteration 2 navigation; earlier screenshots show feature details before compact expandable categories. Screenshots capture a viewport, not the entire application. Browser viewport and stored iteration influence the appearance.

## Bank account flow

Initial fictional account: Carnage Retail (Pvt) Ltd, Commercial Bank, Kollupitiya, masked account ending 4821. The current account card uses the real Commercial Bank logo.

Request account change → enter new account details and attach a statement → review details → submit → request under review. A statement is required (PDF/JPG/PNG, maximum 5 MB). Required fields, confirmation and attachment checks are in the source. Draft values survive navigation. In iteration 2 a reload loses the in-memory attachment and requires reattachment; in iteration 1 a reload dismisses all bank account and merchant credit changes and drafts.

The active payout account stays unchanged while a request is pending. Only one pending change is allowed. Request details expose a prototype review control; acceptance updates the active account, rejection preserves it. Do not turn these local simulation controls into real banking actions.

## Merchant credit flow

Sampath Bank is the sole current lender. The data is an array so additional lenders can be added later. Its overview and accepted-request next-step view use the real Sampath Bank logo.

Iteration 1 uses a compact directory with six bank cards: Sampath, Commercial, HNB, Bank of Ceylon, Nations Trust and DFCC. Only Sampath accepts prototype requests. The other five are explicitly illustrative future-onboarding examples, marked Coming soon with disabled actions; they are not claims of confirmed partnerships. Do not invent lending rates, eligibility, limits or response times. Cards use three columns on wide desktop, two on smaller desktop/tablet and one on mobile. A single collapsed How Merchant credit works explanation replaces repeated instructions in every card.

Merchant credit has Banks / Request history segmented tabs, with Banks selected by default. The bank directory lives only in Banks. Request history contains the Merchant credit requests heading, saved drafts, and nested All / Pending / Accepted / Rejected segmented tabs with live counts. Saving a draft or finishing submission returns to Request history. The empty history state has an Explore banks action that selects Banks. Default is All. Only submitted requests count; saved drafts have a separate resumable row. Filters have distinct empty states and a View all requests action. Requests use a compact table on wide desktop and cards below the xl breakpoint. Accepted requests have a Next steps action that opens the existing simulated bank continuation; Back to request returns to full details. New requests, bank responses and counts share the existing FinanceData state and storage. No sample requests are seeded into the project. Iteration 2 retains its original single-bank layout with no new status tabs.

Directory research: PayPal’s compact logo-led provider rows and consistent actions (https://mobbin.com/screens/d98d782d-8216-4fd5-b962-de317abf7fda) informed the density. Remote’s separate introductory area and provider cards (https://mobbin.com/screens/0d66c94a-0092-49a2-b406-14a99de7aece) informed moving shared guidance out of individual cards. The user subsequently requested separate Banks / Request history tabs, retaining the status filters within Request history.

Current references: merchant-credit-six-banks.png, merchant-credit-request-tabs.png and merchant-credit-requests-mobile.png in docs/screenshots. The latter two contain a fictional request created during UI verification; it is not default application data. Verified the current section tabs, empty-history Explore banks action, draft save/resume into history, submission into history, Pending/Accepted filtering and counts, accepted next steps, navy action colors, conditional credit-repayment wording, mobile width 390px without overflow, and iteration 2 baseline. Earlier checks covered Rejected responses, keyboard status-tab navigation, and tablet width 900px. Build and TypeScript checks pass.

The application progressively reveals four steps:
1. Your credit needs (iteration 2 retains Your loan needs).
2. Business and contact.
3. Business finances, including conditional current-borrowing fields.
4. Review your request.

These are prototype fields and mock requests. The bank reviews applications; Koko is the intermediary. Requests display Pending, Accepted or Rejected. An accepted request provides a dummy next-step destination describing continuation with the bank; it does not redirect to a real application or execute an agreement. One Pending or Accepted request per bank is allowed. Drafts and request history are shared between iterations.

To simulate a bank response, submit a dummy application, open the request details and expand `Preview a bank response`. The account equivalent is `Preview a review response`.

## Modular components and feature announcements (iteration 1 only)

Open Version switcher → Modular components, below the two UI options. This is a component library destination, not a third UI iteration. `ModularComponents.tsx` provides two templates selected with a segmented control:

- Multiple updates: three concise, informational highlights (Koko assets, Bank account, Merchant credit), each with an original 56px circular illustration. No per-feature Explore buttons.
- Single update: a clean white canvas with one prominent circular marketing-toolkit illustration, a short feature label, headline and concise explanatory paragraph.

Both templates end in one full-width navy Create new order button (no Dismiss button, no close icon; Escape also continues to Create Order). They are shown right after sign-in, full screen on the login page's background (gradient and colour washes from `Login.tsx`'s exported `Container3`), with the Koko logo above the card where the login card sits.

Each template has an editable headline/introduction, live merchant-view preview and an independent draft while the library is mounted. Reset this template restores only the selected template. Blank fields disable simulation. Preview after login opens the selected announcement on the login background; Create new order then lands on Create Order.

This is a prototype: no real authentication hook, per-merchant delivery service, or persistent seen-release tracking is implemented. There is no real login in this prototype, so the first portal entry in a browser session stands in for signing in: iteration 1 shows the Multiple updates announcement automatically, once per session (`sessionStorage["koko-announcement-seen-v1"]`), full page on the login background without the sidebar. Reloads in the same session don't show it again; a new tab or window does. Iteration 2 never shows it. Editable copy resets after leaving/reopening the library. `FeatureAnnouncement.tsx` exports the shared body, anchored dialog, destination/content types, and both default content records; feature details and release date are configured there. Iteration 2 has no Modular components menu entry or announcement overlay, and its Create Order layout remains unchanged.

The four original generated illustrations are in `public/announcements/`: marketing.png, bank-account.png, merchant-credit.png and marketing-hero.png. They use the user’s flat circular illustration sheet as a style reference. `SOURCES.txt` records every generation prompt and the built-in image_gen workflow. Keep the PNG transparency and decorative empty alt text, since adjacent text identifies each feature. The single spotlight displays at 144px on desktop and 128px on mobile; rows display at 56px.

Mobbin research: Relume’s announcement uses one visual, a short feature headline, a concise explanation and a single primary action (https://mobbin.com/screens/25ffe8ee-9460-48a7-8bfe-4254314fde3d). Suno’s update feed separates each feature and provides an individual Explore link (https://mobbin.com/screens/e5128125-a731-4a11-9100-bbbf940922b6). These patterns informed hierarchy and scannability; no Mobbin screenshots or product artwork are used as portal assets.

References: docs/screenshots/feature-announcement.png (multiple), feature-announcement-single.png (single), and the corresponding mobile images. The component library screenshot illustrates the two-type template chooser. `accordion-sidebar.png` shows the single expanded category behavior. Desktop modals remain exactly 672 × 467px at the recorded viewport; mobile content scrolls inside the card with actions pinned below.

## State and persistence

- `localStorage["koko-portal-iteration"]`: chosen iteration; fresh default is `"1"`.
- `sessionStorage["koko-finance-demo-v1"]`: shared account/credit requests, account and loan drafts.
- `sessionStorage["koko-bank-draft-v1"]`: account-change draft. Iteration 1 clears both keys on load, so a reload starts from the original data.
- Attachments are File objects kept only in memory; submitted requests retain attachment metadata/filename, not actual file contents.
- Iteration 2 keeps the current page and Finance segment in component state. Iteration 1 mirrors its page and view state in search params on the single `/` route (see the iteration 1 production pass below).

For clean visual comparisons, use a fresh browser storage context, then select the desired iteration and destination. No backend receives applications, uploaded documents or review decisions. Existing unrelated sections also retain their original prototype behavior; do not infer a production integration merely from a working UI control.

## Koko assets

The library uses the original supplied Koko artwork. Six assets span Logos, Social media, Illustrations and Campaigns. Search matches titles, categories and descriptions; category filters show counts; zero results offer Clear filters. Each card provides dimensions, file type/size, a preview dialog and a real local download. The starter ZIP contains four PNGs: Koko logo, Koko’s Picks square, Koko astronaut and Koko retail illustration.

The Avurudu banner is explicitly a campaign sample because its artwork contains dates and promotional offers. It is excluded from the starter kit. The illustrated QR in Shopping with Koko is decorative. Keep these distinctions.

Design research: Stripe dashboard organization on Mobbin provided grouping inspiration (not an asset-library screen). Stripe's official downloadable logos/badges and Afterpay's channel-based marketing resources informed the library organization. These external references are background, not dependencies or instructions:
- https://mobbin.com/screens/e8ddbdc5-bc89-454f-9ebb-846905b83df4
- https://stripe.com/gb/newsroom/information
- https://www.afterpay.com/en-AU/business/resources/marketing

## Iteration 1 production pass (12 October 2026)

The user approved a UI/UX audit (46 findings, verified against Mobbin references) and asked for all of it except dark-mode tokens and merchant QR posters. Decisions: navy only for the one primary action per view; iteration 1 only; keep the five future banks as "Coming soon" rows; move response simulators into a Demo panel; URL state after the visual fixes; placeholder legal text, lender terms and thresholds are acceptable; add the eligibility card.

Iteration 1 now renders new components from `src/merchant/components/v1/` for these three destinations. The previous components (`BankAccount`, `MerchantLoans`, `MerchantCreditOverview`, `tools/KokoAssets`) are untouched and still render iteration 2.

- `v1/ui.tsx`: shared primitives. Sizes are px because the root font is 14px. Primary/secondary/tertiary/danger buttons (44px on mobile, busy state), fields with borders at 4.8:1 and live validation, searchable combobox, drag-and-drop file field, radio cards, status badges, timeline, labelled step indicator, underline tabs, filter chips, side drawer, pinned mobile action bar, accessible toasts.
- `.koko-v1` scope in `src/styles.css`: 12px captions, 14px body, `#5F5F70` secondary text. Iteration 1 toasts use dark green/red (`koko-v1-toast`) inside `@layer base` to beat the global toast style.
- `v1/BankAccountV1.tsx`: the overview is a summary card modelled on a user-supplied reference (status strip on top only while a change is in review or approved (no Active strip); bank logo tile; account and next payout as label/value; stacked actions on the right: Change payout account (navy, full width), View request ›, Cancel request, Payout history (centred, no arrow), which opens Financial statement); change history with a drawer; 3-step change (Account details, Review, Verify) with locked holder name, searchable bank/branch, grouped account number with confirm field (no helper text under either), drag-and-drop statement, attestation, SMS code (demo code 123456) and a 24-hour payout hold after approval. Every Bank account view follows the Create Order form styling: white card with a soft blue border and large shadow (`rounded-2xl border-[#BDDCEE]/50 shadow-xl`), centred 2xl title with a small muted subtitle, 48px filled fields with labels above and hints below, 28px gaps between fields, and a full-width navy submit button with a quiet text action under it. Bank account, Merchant credit and Koko assets all share this styling: `V1Page` provides the `SoftFields` context, so fields, radio cards, checkboxes, buttons, timelines and definition lists use the Create Order style; `Card` uses the same surface (`SURFACE`), lists and asset grids use a lighter one (`SURFACE_LIGHT`); flows use the shared `FlowLayout`, `FlowPrimary`, `FlowSecondary` and `DoneCard`. Text follows the portal scale (`text-sm` is 12.25px; only `text-xs` is raised to 12px in `.koko-v1`). Fields are grey while empty and turn white once filled, selected or focused. In that style the statement upload shows a short simulated upload (spinner, percentage, progress bar, Cancel) before it attaches, then a compact row: file name (opens a preview), "Uploaded · type · size" with a green tick, and icon buttons to replace or remove the file. In iteration 1, a reload dismisses every change on Bank account and Merchant credit: the account returns to Commercial Bank •••• 4821; bank and credit requests, approvals, drafts and bank notifications are cleared; and any open step, application, drawer or asset preview closes (`FinanceDataProvider` and the `freshLoad` flags in the three page components). Koko assets filters and search stay.
- `v1/MerchantCreditV1.tsx` (Main UI): built to reduce cognitive load around one goal, funding the business through Koko and Sampath Bank. No eligibility banner. Banks tab: one Sampath card with three key facts (Amount up to, Repay over, Decision), the primary action and a Details and requirements disclosure (how it works, who can apply, documents, interest and fees); ineligible merchants see what they still need in place of the action. More banks coming soon is a compact row of bank chips with no Notify me. Requests tab with Drafts/In review/Accepted/Declined/Cancelled chips. 4-step application: (1) Credit needs: amount with slider, purpose, repayment period, security offered (`SECURITY_OPTIONS`); (2) Business details: a read-only summary of KYC data (registered name, registration number, business type, industry, operating since, TIN, registered address, director and masked NIC; placeholders in `BUSINESS`), plus number of employees, contact person and role, mobile and email (prefilled); (3) Finances and documents: average monthly revenue (prefilled from Koko sales), existing borrowing with lender, monthly repayments and total owed, registration certificate and director NIC marked on file, bank statements for 6 months (required upload with progress) and financial statements (optional); (4) Review with edit links, CRIB and authority consent. Drafts are created on first change and discardable; uploaded files stay in memory for the session. Drawer with timeline, offer, decline reason, consent record and an external Continue link. New references use `MC-`.
- `v1/scenarios.ts`: Version switcher › Scenarios (Main UI only, below Modular components). Merchant credit: changes requested loads a declined Sampath request with a list of changes (lower the amount or add security; add missing statements) and opens it on the Requests tab. Such requests show a Changes requested badge, the bank's list of changes, and a Make changes and resubmit action that starts a new request prefilled from the old one (statements must be attached again) on the first step that needs a change; each step shows the bank's asks for that step. Data: `LoanRequest.changes` and `LoanForm.resubmitOf`.
- `v1/MerchantCreditAlt.tsx` (Alternate UI): at the user's request (13 Oct 2026) the Alternate UI's Merchant credit segment and page show a snapshot of the Main UI Merchant credit page as it was before the simplification (eligibility banner, How it works, full Sampath terms, Notify me, original 4-step form). This replaces `MerchantLoans` in iteration 2; `MerchantLoans.tsx` is kept but no longer rendered. Shared `v1/ui.tsx` components still style it.
- `v1/KokoAssetsV1.tsx` and `v1/assets-data.ts`: compact starter kit row, brand colours with copy, keyword search with clear button, one preview per card, Download menu with versions labelled by use (files in `public/koko-assets/variants/`, generated from the originals), usage notes, campaign validity (the Avurudu sample ran 4–12 Apr 2026 and shows as ended with downloads off), preview with previous/next, Brand guidelines dialog.
- `v1/demo.tsx` and `v1/DemoPanel.tsx`: Version switcher › Demo panel (iteration 1). Simulated bank account approve/decline, credit accept with offer/decline/back to review, Fail the next request, signed-in role (Branch Admin and Cashier are read-only), eligibility scenario, reset.
- `v1/placeholders.ts`: every placeholder value (lender terms, thresholds, sales history, legal wording, review times, bank directory and branch codes, brand colours, lender link). Replace values there.
- `v1/url.ts`: iteration 1 search params `page`, `tab`, `status`, `apply`, `step`, `request`, `change`, `category`, `q`, `asset`. Reload, Back/Forward and links restore the view; guards redirect stale steps. Iteration 2 clears them.
- `FinanceData.tsx`: optional fields only (`requestedBy`, `decidedAt`, `reason`, `offer`, `consent`, `from`, `verifiedAt`, `accountActiveFrom`, `notifyBanks`), `purposeOther` on the loan form, and `cancelledBankRequests` / `cancelledLoans` so iteration 2 never sees a Cancelled status.

Not done, by decision: dark-mode tokens (X14) and merchant-specific QR posters (KA9). Still needed from outside the codebase: real lender terms and thresholds, approved legal wording, vector logo masters (SVG/EPS), the bank and branch directory, and the backend APIs behind the mocked requests.

## Reproduction acceptance checklist

- Clean installation with the frozen lockfile; production build and TypeScript check succeed.
- Root opens inside the portal with no login or logout flow.
- Original destinations continue to render.
- Both iterations have the correct Finance/credit navigation and Koko assets entry.
- Version switcher is reachable at sidebar bottom on desktop and in mobile navigation.
- Commercial Bank logo renders in Bank account; Sampath logo renders in Merchant credit.
- Desktop and mobile views match the supplied source/screenshots without horizontal overflow.
- Account changes enforce required details/statement; pending keeps current account active; simulated decisions work.
- Iteration 1 Bank account, Merchant credit and Koko assets match the production pass below: one navy primary action per view, Banks / Requests tabs with status chips, no visible loan wording, Demo panel in the Version switcher. Iteration 2 is unchanged.
- Credit form reveals steps progressively; draft and review work; Pending/Accepted/Rejected states and dummy continuation work.
- Library search, category filters, previews, empty state, all six downloads and the four-file ZIP work.
- No changes to real bank accounts, no live loan submissions and no deployment are implied.

## Handoff guidance

If asked to rebuild 1:1, first run the supplied application unchanged and verify it. Copy/migrate the actual source and assets when needed; do not regenerate the UI from this description alone. Preserve internal IDs and storage schemas unless migration is specifically requested. All future changes apply ONLY to iteration 1 unless the user explicitly requests iteration 2 or both. Preserve iteration 2 as the comparison baseline; gate shared UI changes by iteration. This preference is also recorded in AGENTS.md.

The user can request later changes that override this snapshot. The included AGENTS.md concerns the original Lovable repository's published Git history. No history is shipped in this archive. `FILE_MANIFEST.sha256` lists the packaged files (excluding itself) so transfer integrity can be checked.
