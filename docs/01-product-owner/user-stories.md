# User Stories — INFLU.ai

> Format strict : `US-NNN — As a <persona>, I want to <action>, so that <benefit>.`
> Chaque US référence une **Wave** et une **Priorité** (Must / Should / Could).

---

## A. Pages publiques (avant login)

### US-001 — As a visitor, I want to browse the public landing page in French at /fr, so that I discover INFLU's value proposition for the MENA region.
**Priority:** Must
**Wave:** 1

### US-002 — As a creator visitor, I want to read the dedicated /fr/for-influencers pitch page with the 6-step creator journey, so that I understand the benefits of joining as an Influencer.
**Priority:** Must
**Wave:** 1

### US-003 — As a brand visitor, I want to read the dedicated /fr/for-brands pitch page with the 9-step brand journey, so that I understand the benefits of running campaigns on INFLU.
**Priority:** Must
**Wave:** 1

### US-004 — As a brand visitor, I want to read the brand legal mentions at /en/legal/brand, so that I am informed of my contractual context before signing up.
**Priority:** Must
**Wave:** 1

### US-005 — As a creator visitor, I want to read the creator legal mentions at /en/legal/creator, so that I am informed of my contractual context before signing up.
**Priority:** Must
**Wave:** 1

### US-006 — As any visitor, I want to read the privacy policy at /en/legal/privacy, so that I understand how INFLU processes my personal data.
**Priority:** Must
**Wave:** 1

---

## B. Authentification & inscription

### US-010 — As a registered user, I want to sign in at /auth/login with my email and password, so that I am redirected to /creator or /business based on my role.
**Priority:** Must
**Wave:** 1

### US-011 — As a registered user, I want to sign in via Continue with Google, so that I authenticate without typing a password.
**Priority:** Must
**Wave:** 1

### US-012 — As a user who forgot my password, I want to request a reset link at /auth/forgot-password, so that I receive an email to recover access.
**Priority:** Must
**Wave:** 1

### US-013 — As a creator who just registered, I want to set my password via the magic link received by email, so that I can sign in afterwards (no password is requested at registration).
**Priority:** Must
**Wave:** 1

### US-014 — As a logged-in user, I want to logout via /auth/logout with an explicit confirmation screen, so that I am protected against accidental disconnection.
**Priority:** Must
**Wave:** 1

### US-015 — As an unregistered visitor, I want to choose my account type at /auth/register among the 4 cards (Influencer / Small Business / Brand / Agency), so that I land on the correct registration flow.
**Priority:** Must
**Wave:** 1

### US-016 — As an Influencer registrant, I want to fill the personal information step at /auth/register/influencer (8 fields + 2 mandatory checkboxes, no password field), so that my creator account is created.
**Priority:** Must
**Wave:** 1

### US-017 — As an Influencer registrant, I want to assign at least one social account (Instagram / YouTube / TikTok / Twitter) at the second registration step, so that my profile is enriched with handle, followers and engagement.
**Priority:** Must
**Wave:** 2

### US-018 — As a Small Business / Brand / Agency registrant, I want to complete the /auth/onboard onboarding (Account Information + Business Information including Juridical Form, ICE, Company Name, IF, RC, TVA), so that my business workspace is initialized at /business.
**Priority:** Must
**Wave:** 2

---

## C. Espace Créateur — vue d'ensemble & dashboard

### US-020 — As a creator, I want to view my Dashboard at /creator with the 10 KPI cards (Total Collaborations, Pending Opportunities, Pending Matchings, Content to Submit, Submission Deadline, Content to Publish, Publication Deadline, Pending Payments, Revenue Generated in Dhs, INFLU Score), so that I monitor my activity at a glance.
**Priority:** Must
**Wave:** 3

### US-021 — As a creator, I want to switch between Campaigns and Marketplace tabs on my Dashboard with Search / brand / status filters and a Clear button, so that I find a specific collaboration quickly.
**Priority:** Must
**Wave:** 3

### US-022 — As a creator, I want to see a placeholder `__` on KPIs for disabled features and `--` / `N/A` on metrics not computable, so that I understand which data is unavailable rather than reading a misleading zero.
**Priority:** Should
**Wave:** 3

### US-023 — As a creator, I want to see disabled sidebar items (Matchings, Calendar, My Payments) with an explicit visual state, so that I know these features exist but are not yet available for my account.
**Priority:** Should
**Wave:** 3

---

## D. Marketplace créateur

### US-030 — As a creator, I want to browse the Marketplace at /creator/marketplace as a grid of opportunity cards with Search and Clear, so that I discover new product opportunities.
**Priority:** Must
**Wave:** 4

### US-031 — As a creator, I want to read the full opportunity detail at /creator/marketplace/[id] (brand overview, product overview, requested content, deliverables table, hashtags, call to action, available slots, time remaining), so that I decide whether to apply.
**Priority:** Must
**Wave:** 4

### US-032 — As a creator, I want the Apply button to be disabled with a "Complete your profile to apply" checklist (CIN pending, RIB missing, ICE missing) and direct links to the right screens, so that I know exactly what blocks my application.
**Priority:** Must
**Wave:** 4

### US-033 — As an eligible creator (CIN validated + RIB uploaded + ICE filled), I want to click Apply on an opportunity, so that my application is submitted to the brand and a slot is reserved on a tier-segmented basis.
**Priority:** Must
**Wave:** 5

### US-034 — As a creator, I want to see the explicit "Paid by INFLU" mention next to the total amount of an opportunity, so that I understand INFLU is the payer (not the brand directly) and the SLA is 48h–7 days after content validation.
**Priority:** Must
**Wave:** 4

### US-035 — As a creator, I want to see a per-opportunity expiration badge ("Expires in N days" or "Expired"), so that I prioritize time-sensitive opportunities and understand when applications are closed.
**Priority:** Must
**Wave:** 4

---

## E. Collaborations & profil créateur

### US-040 — As a creator, I want to view my collaborations list at /creator/collaborations with the same columns and filters as the Dashboard Campaigns tab, so that I track my deals end-to-end.
**Priority:** Must
**Wave:** 5

### US-041 — As a creator, I want to view my profile at /creator/my-accounts with the header (avatar, name, bio, category, country, gender) and the Profile overview section, so that brands see a clear identity.
**Priority:** Must
**Wave:** 3

### US-042 — As a creator, I want to navigate the 5 tabs of my profile (Social Coverage, Creator network, Posts, My INFLU, Audience insights — last one disabled), so that I expose all my content and metrics.
**Priority:** Must
**Wave:** 3

### US-043 — As a creator, I want to generate a Creator Report (printable export with INFLU logo, identity, accounts, network and paginated social coverage), so that I can share a professional summary outside the platform.
**Priority:** Should
**Wave:** 4

---

## F. AI Coach créateur

### US-050 — As a creator, I want to chat with My AI Coach at /creator/ai-recos (sequential conversation in French, starting with "Comment te positionnes-tu en tant qu'influenceur ?"), so that I receive personalized campaign recommendations.
**Priority:** Must
**Wave:** 4

### US-051 — As a creator, I want the Send button of the AI Coach to be disabled while the textarea is empty, and the Restart button to clear the conversation, so that I never send empty messages and can start over.
**Priority:** Should
**Wave:** 4

---

## G. Messaging créateur

### US-060 — As a creator, I want to chat with brands at /creator/messagerie with columns (Profile / Campaign / Last Message / Actions) and filters (Search / brand / status), so that I keep track of conversations related to my collaborations.
**Priority:** Must
**Wave:** 6

### US-061 — As a creator with no conversation yet, I want to see the empty state "You don't have any open discussions at the moment.", so that I am not confused by an empty list.
**Priority:** Should
**Wave:** 6

---

## H. Account Settings créateur

### US-070 — As a creator, I want to manage my Account Information at /creator/accounts (Account Type, Email disabled, Gender, Full Name, Phone +212, Address) with Update Information and Reset buttons disabled until something changes, so that I keep my profile up to date safely.
**Priority:** Must
**Wave:** 3

### US-071 — As a creator, I want to change my password from Account Settings (Change password button), so that I rotate my credentials.
**Priority:** Must
**Wave:** 3

### US-072 — As a creator, I want to set my Billing information ("I'm a ?" radio Business / Auto-entrepreneur, then ICE search + Approve), so that my legal billing context is configured for payouts.
**Priority:** Must
**Wave:** 3

### US-073 — As a creator, I want to define my Pricing at /creator/accounts?acc_tab=billing as From / to ranges per (social account × content format) with a per-account "Save account pricing" button, so that brands see my reference rates.
**Priority:** Must
**Wave:** 3

### US-074 — As a creator, I want to manage my Documents at /creator/accounts?acc_tab=documents (CIN number + expiry with Submit / Cancel Validation, Bank account RIB upload, optional Attestation de régularité fiscale), so that I unlock the ability to apply to opportunities.
**Priority:** Must
**Wave:** 3

### US-075 — As a creator, I want to cancel my CIN validation request via Cancel Validation, so that I can resubmit corrected information.
**Priority:** Should
**Wave:** 3

### US-076 — As a creator, I want to permanently delete my account from the Danger zone with the explicit warning "Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone.", so that I exercise my right to erasure consciously.
**Priority:** Must
**Wave:** 3

---

## I. Support créateur

### US-080 — As a creator, I want to access /creator/support with a "My reports" section (counter "0 report(s)" + empty state "No reports yet — Use the button in the bottom-right corner to report an issue.") and a FAQ accordion (5 standard questions), so that I get help.
**Priority:** Must
**Wave:** 8

### US-081 — As a creator, I want to click the floating "Report an issue" button (bottom-right) to open a modal with required Issue type (Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other), Title, Description, then Cancel / Submit report, so that I report a problem in a structured way.
**Priority:** Must
**Wave:** 8

---

## J. Espace Business — dashboard & navigation

### US-100 — As a business user (Agency / Brand / Small Business), I want to view my Dashboard at /business with KPIs (Number of campaigns / Active / Draft / On hold / Completed) and tabs AI Campaigns / Marketplace and a primary "New AI campaign" CTA, so that I monitor and launch campaigns from one screen.
**Priority:** Must
**Wave:** 3

### US-101 — As a business user, I want a global influencer search in the header (combobox autocomplete "Search your best influencer by name or handle" + "Show suggestions"), so that I quickly find a creator from anywhere in the app.
**Priority:** Should
**Wave:** 4

### US-102 — As a business user, I want to see disabled sidebar items (Social Listening) with an explicit visual state, so that I know the feature is planned but not yet active.
**Priority:** Should
**Wave:** 3

---

## K. AI Campaign & AI Manager

### US-110 — As a business user, I want to start a New AI Campaign at /business/ai-campaign as a chat conversation, with the first question "What kind of campaign would you like to launch, and what scope are you aiming for?" and a multi-select (Branding / Visibility – Awareness / Positioning – Storytelling / New Product Or Service Launch / Promotions / Event Promotion / Engagement & Interactions), so that the IA can build a tailored brief.
**Priority:** Must
**Wave:** 5

### US-111 — As a business user, I want to manage all my AI campaigns at /business/ai-manager with Search / Select status / Clear filters, and see the empty state "No AI campaigns created yet" with a "Create AI campaign" CTA when the list is empty, so that I navigate my IA campaigns easily.
**Priority:** Must
**Wave:** 5

---

## L. Marketplace business

### US-120 — As a business user, I want to create a Marketplace product through the 5-step wizard at /business/marketplace/create (Brand Information / Product Details / Acceptance criteria / Deliverables / Dates) with strict per-step validation, so that I publish a complete brief.
**Priority:** Must
**Wave:** 5

### US-121 — As a business user, I want each Deliverable to enforce (Your platform / Content type / Quantity ≥ 1 / Unite price in Dhs / Tagged account with @ prefix), with "Specify dates" disabled while the deliverable is incomplete and "Next" disabled while no deliverable is added, so that I cannot publish an incomplete brief.
**Priority:** Must
**Wave:** 5

### US-122 — As a business user, I want to see my published products at /business/marketplace (alias My Marketplace) and edit or delete them, so that I keep my offers up to date.
**Priority:** Should
**Wave:** 5

---

## M. Discovery

### US-130 — As a business user, I want to find creators at /business/discovery with filters (platforms / keywords / categories / Range tier / genders / locations) persisted in the URL (`disc_filter`, `disc_seed`, `disc_page`) and a Reset (N) button reflecting active filters, so that my searches are deep-linkable.
**Priority:** Must
**Wave:** 4

### US-131 — As a business user, I want to switch between Table View (default) and Grid View, with the table showing NAME / CATEGORIES / COUNTRY / PLATFORMS / ENGAGEMENT RATE (%) / POSTS / VIEWS / Actions, and pagination "Page X of Y (Total Z records)", so that I scan large result sets efficiently.
**Priority:** Must
**Wave:** 4

### US-132 — As a business user, I want to open a creator profile at /business/profile/[id] with header, Profile overview, social accounts and tabs (Social Coverage / Creator network / Posts / Audience insights — disabled, no "My INFLU" tab on this view), so that I evaluate a creator before contacting.
**Priority:** Must
**Wave:** 4

---

## N. CRM business

### US-140 — As a business user, I want to manage CRM lists at /business/crm with a Search field, a "Create New CRM" button and the empty state "No CRM list has been created yet." with illustration, so that I segment creators into shortlists.
**Priority:** Must
**Wave:** 6

### US-141 — As a business user, I want to create a CRM list via a modal (Title required, Description required, Cancel / Create CRM), so that my new shortlist is initialized.
**Priority:** Must
**Wave:** 6

### US-142 — As a business user, I want to add a creator to a CRM list from the Discovery row actions, so that my shortlists are populated without leaving Discovery.
**Priority:** Should
**Wave:** 6

---

## O. Messaging business

### US-150 — As a business user, I want to chat with creators at /business/messagerie with the same patterns as the creator messaging, so that I negotiate and follow up on deliverables.
**Priority:** Must
**Wave:** 6

---

## P. Payments business

### US-160 — As a business user, I want to view my payments at /business/payments with two tabs (Marketplace payments default / Campaign payments) and filters (Select brand / Select status / Clear), so that I review all transactions split by source.
**Priority:** Must
**Wave:** 7

### US-161 — As a business user, I want each payment row to expose Creator / Brand / Status / Amount in Dhs / Requested At / Completed At / Actions, with the empty state "No payment data found", so that I trace each transaction.
**Priority:** Must
**Wave:** 7

---

## Q. Account Settings business & Manage your Brands

### US-170 — As a business user, I want to manage my Account Information at /business/accounts with Account Type "Business Account", Email disabled, Gender, Full Name, Phone +212, Address, plus the Business Information section in read-only (Juridical Form, ICE, Company Name, Company Address, IF, RC, TVA), so that I keep my profile and legal entity consistent.
**Priority:** Must
**Wave:** 3

### US-171 — As a business user, I want to manage my Brands at /business/accounts?acc_tab=brands with a table (BRAND / WEBSITE / COUNTRY / Actions: Manage access, Add access, kebab) and a "Link new brand" button, so that I administer all brands of my account.
**Priority:** Must
**Wave:** 3

### US-172 — As an Agency user, I want to link a new brand via a modal that searches the existing INFLU brand database by name or @ social account (no free creation), with "Confirm selection" disabled until a brand is selected, so that brands stay deduplicated.
**Priority:** Must
**Wave:** 3

### US-173 — As an Agency user, I want to Manage access and Add access on a brand row, so that I delegate brand control to the right members of my agency.
**Priority:** Should
**Wave:** 3

### US-174 — As a business user, I want to permanently delete my account from the Danger zone with the same explicit warning as creators, so that I exercise my right to erasure consciously.
**Priority:** Must
**Wave:** 3

---

## R. Support business

### US-180 — As a business user, I want to access /business/support with the same FAQ + reports + floating "Report an issue" pattern as creators, so that I get help inside my workspace.
**Priority:** Must
**Wave:** 8

### US-181 — As a business user, I want the Report an issue modal to enforce a required Issue type select (Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other), Title, Description and Cancel / Submit report, so that my report is properly classified.
**Priority:** Must
**Wave:** 8

---

## S. États système & layout transverse

### US-200 — As any user, I want to see a 404 page when navigating to an unknown URL, so that I understand the resource does not exist and can navigate back.
**Priority:** Must
**Wave:** 8

### US-201 — As any user, I want to see a 403 page when accessing a forbidden area (e.g., a creator hitting /business/* or vice versa), so that the platform enforces role-based access.
**Priority:** Must
**Wave:** 8

### US-202 — As any user, I want to see a 500 page on a server error, so that I am not left on a blank screen.
**Priority:** Must
**Wave:** 8

### US-203 — As any logged-in user, I want a global header with a language selector, a notifications bell and a user menu (avatar / name / email) with Profile / Pricing / Documents / Logout, so that I have ubiquitous controls.
**Priority:** Must
**Wave:** 3

### US-204 — As any logged-in user, I want to receive in-app notifications via the bell icon for the events listed in §11 (application accepted/refused, brief received, content modification requested, deliverable validated, payment received, message, CIN validation, expiring opportunity, AI Coach recommendation, business-side application/deliverable/message/payment events), so that I never miss a key event.
**Priority:** Should
**Wave:** 7

### US-205 — As any user, I want lists with no data to show the EXACT empty-state copy from §9.1 (e.g., "No campaigns available at the moment.", "No campaigns created yet.", "No payment data found", etc.), so that I get a consistent and meaningful experience.
**Priority:** Must
**Wave:** 8

### US-206 — As any user, I want disabled buttons to surface the reason from §9.2 via tooltip or inline helper (Apply blocked by missing CIN/RIB/ICE, Send disabled while textarea empty, Update Information disabled until a field changes, etc.), so that I understand what to do next.
**Priority:** Must
**Wave:** 8
