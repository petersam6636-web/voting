
# VOTESPHERE — AI AGENT PROJECT INSTRUCTIONS

You are the lead full-stack developer working on VoteSphere. Your responsibility is to help build a professional, secure, modern, fast, and scalable voting application.

Always read and follow these instructions before making changes.

---

# 1. PROJECT OVERVIEW

Project name: VoteSphere

VoteSphere is a modern voting and election management application that allows users to create elections, add candidates, manage eligible voters, conduct elections using a scanning-based voting system, and determine winners.

The main purpose is to make selecting leaders easier, faster, more organized, and reliable.

The application should provide an excellent user experience with a premium interface, smooth animations, responsive layouts, and secure voting functionality.

## Main application features

1. User authentication.
2. Dashboard overview.
3. Election creation and management.
4. Candidate management.
5. Voter management.
6. QR-code scanning for voting.
7. Election countdown and automatic closing.
8. Vote counting and election results.
9. Winner determination.
10. Election history and management.

Do not implement everything at once. Build features progressively according to the user's instructions.

---

# 2. TECHNOLOGY STACK

The project uses the following technologies:

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Supabase
- Google OAuth
- Geist Font
- GSAP
- Lucide React

Use the latest APIs supported by the installed Next.js version.

Do not introduce outdated Next.js patterns or unnecessary dependencies.

## Next.js conventions

- Use the App Router.
- Prefer Server Components by default.
- Use Client Components only when necessary.
- Use TypeScript throughout the project.
- Use Next.js navigation features appropriately.
- Use next/image for images.
- Use next/link for internal navigation.
- Use Server Actions or Route Handlers for appropriate server-side operations.
- Keep components organized and maintainable.

Always inspect the existing project before making architectural changes.

---

# 3. SUPABASE CONFIGURATION

IMPORTANT: Supabase and Google OAuth have already been configured successfully.

Do not recreate the Supabase project or unnecessarily modify its authentication configuration.

The existing Supabase client is located at:

src/lib/supabase-client.ts

Import it using:

@/lib/supabase-client

Inspect the actual export before importing it. Do not assume whether it is a named or default export.

Supabase is responsible for:

- Authentication.
- Google OAuth.
- Email and password authentication.
- PostgreSQL database.
- Database relationships.
- Row Level Security.
- Secure data operations.

Never expose the Supabase service-role key in browser code.

Never replace existing Supabase configuration without a valid reason.

---

# 4. BRAND IDENTITY AND DESIGN SYSTEM

VoteSphere must have a consistent, premium, modern interface.

## Theme

DARK MODE ONLY.

Do not create a light theme unless explicitly requested.

## Primary color palette: EMERALD

Use emerald as the main brand color throughout the application.

Core colors:

- Emerald 950: #022c22
- Emerald 900: #064e3b
- Emerald 700: #047857
- Emerald 600: #059669
- Emerald 500: #10b981
- Emerald 400: #34d399
- Emerald 300: #6ee7b7

Background colors:

- Main background: #070b09
- Card background: #0d1310
- Input background: #080d0a

Text colors:

- Primary text: #f4f4f5
- Secondary text: #a1a1aa
- Muted text: #71717a

Borders should be subtle, preferably using white opacity.

## Color usage

Emerald 500 should be the primary color for:

- Primary buttons.
- Active navigation.
- Selected items.
- Important actions.
- Progress indicators.
- Brand highlights.

Emerald 400 should be used for:

- Hover states.
- Icons.
- Highlighted text.
- Interactive elements.

Use darker emerald shades for:

- Secondary cards.
- Decorative backgrounds.
- Subtle surfaces.

Do not make the entire application bright green.

The application should primarily use dark backgrounds with emerald accents.

## Typography

Use Geist as the primary font throughout the application.

Maintain consistent font weights, sizes, spacing, and hierarchy.

## UI design requirements

- Premium modern dashboard design.
- Clean and minimal interface.
- Proper spacing and alignment.
- Rounded corners.
- Subtle borders.
- Smooth hover effects.
- Professional cards.
- Consistent icon sizing.
- Responsive layouts.
- Accessible contrast.
- Beautiful empty states.
- Clear loading states.
- Professional error messages.

Avoid:
- Unnecessary huge cards.
- Excessive gradients.
- Excessive shadows.
- Too many colors.
- Unnecessary decorations.
- Cluttered layouts.
- Inconsistent spacing.
- Unnecessary scrolling.

Every page must follow the same design language.

---

# 5. ANIMATIONS

Use GSAP for animations where appropriate.

The application should feel smooth and modern without unnecessary animations.

For the authentication page, the required animation is:

Initial state:
- opacity: 0
- y: 100

Final state:
- opacity: 1
- y: 0

Duration:
- 0.2 seconds

When switching between login and signup, animate the authentication form using the same transition.

Always clean up GSAP animations inside React effects.

Respect reduced-motion accessibility preferences.

Do not animate critical voting actions in ways that confuse users or delay interaction.

---

# 6. AUTHENTICATION

The authentication page is already part of the project.

It must support:

- Login.
- Sign Up.
- Email and password authentication.
- Google OAuth.
- Loading indicators.
- Error messages.
- Success messages.
- Password visibility toggle.

Login must be the default mode whenever the authentication page loads.

Users can switch between Login and Sign Up.

Successful authentication should redirect users to:

/home

Follow the existing Supabase OAuth callback implementation if one exists.

If email confirmation is enabled, handle confirmation properly.

Do not bypass authentication security.

Protected pages must verify authentication appropriately.

---

# 7. DASHBOARD

The main dashboard should provide an overview of the user's voting activities.

Potential dashboard information:

- Total elections.
- Active elections.
- Completed elections.
- Total candidates.
- Total eligible voters.
- Recent elections.
- Upcoming elections.
- Recent activity.

Use attractive statistic cards and clean layouts.

Dashboard information must come from the actual database once the relevant features are implemented.

Do not use fake statistics in production.

---

# 8. ELECTION MANAGEMENT

Users should be able to create and manage elections.

An election may contain:

- Election title.
- Description.
- Election image, if required.
- Candidates.
- Eligible voters.
- Start date.
- Start time.
- End date.
- End time.
- Election status.
- Creation date.
- Owner information.

Possible election statuses:

- Draft.
- Scheduled.
- Active.
- Completed.
- Cancelled.

Users should be able to:

- Create elections.
- View elections.
- Edit election details.
- Add candidates.
- Manage eligible voters.
- Start elections.
- End elections.
- View completed elections.
- View results.

Only authorized users should manage an election.

Do not allow unauthorized users to modify another user's elections.

---

# 9. CANDIDATE MANAGEMENT

Users must be able to add people who want to contest in an election.

Candidate information may include:

- Full name.
- Profile image.
- Description.
- Election association.
- Other relevant information.

Each candidate must belong to the correct election.

Allow users to manage candidates before the election begins according to the election rules.

Do not allow unauthorized modifications to candidates.

Use a clean and professional candidate management interface.

Candidate cards should display useful information without becoming unnecessarily large.

---

# 10. VOTER MANAGEMENT

Users must be able to manage people eligible to participate in an election.

The exact voter identity model should be confirmed before finalizing the database architecture.

Possible voter information:

- Full name.
- Email, if applicable.
- Unique voter identifier.
- Associated election.
- Voting eligibility.
- Voting status.

Voters must only participate in elections for which they are eligible.

Prevent duplicate voting.

Do not expose sensitive voter information unnecessarily.

---

# 11. SCANNING AND VOTING SYSTEM

Scanning is one of the core features of VoteSphere.

The application should support QR-code scanning to identify or verify an eligible voter and connect them to the correct election.

Expected voting workflow:

1. An organizer creates an election.
2. The organizer adds candidates.
3. Eligible voters are added or invited.
4. The system creates unique voting credentials or QR codes.
5. A voter scans their assigned QR code.
6. The system verifies the credential.
7. The voter sees the correct election.
8. The voter reviews the available candidates.
9. The voter deliberately selects a candidate.
10. The voter confirms their choice.
11. The server validates the vote.
12. The vote is securely recorded.

IMPORTANT:

Scanning a QR code must NOT automatically cast a vote.

The voter must deliberately select and confirm their choice.

## QR-code security

- Use unique, unpredictable credentials.
- Do not use sequential database IDs as public voting tokens.
- Validate credentials on the server.
- Reject expired credentials.
- Reject already-used credentials.
- Reject credentials belonging to another election.
- Prevent duplicate voting.
- Never trust browser-side validation alone.
- Do not store personal information or vote choices inside QR codes.

The scanner should handle:

- Camera permission.
- Camera unavailable.
- Invalid QR codes.
- Expired credentials.
- Already-used credentials.
- Network errors.
- Successful verification.

Provide manual code entry where appropriate.

Stop camera tracks when the scanner closes or finishes.

---

# 12. ELECTION TIMER AND AUTOMATIC CLOSING

Every election may have a configured voting duration or deadline.

The interface should display a countdown when appropriate.

Countdown format may include:

- Days.
- Hours.
- Minutes.
- Seconds.

When the deadline expires, the election must stop accepting votes.

IMPORTANT:

Do not rely on a frontend countdown to determine whether voting is allowed.

The server or database must enforce the election deadline.

An organizer may also be allowed to end an active election early.

After an election closes:

- Reject additional votes.
- Finalize the election status.
- Calculate the accepted votes.
- Determine the winner.
- Display the final results.

Handle simultaneous vote submissions and election closure safely.

---

# 13. VOTE COUNTING AND RESULTS

The system must calculate results from accepted database records.

Results may include:

- Candidate names.
- Candidate images.
- Total votes.
- Vote percentages.
- Winner.
- Election status.

Do not calculate authoritative results using client-side state.

Only show final winners when an election has completed.

Handle ties explicitly.

Do not arbitrarily select a winner when two candidates receive equal votes.

Protect individual ballot choices.

If anonymous voting is required, design the database so voter participation records cannot be casually linked to individual vote choices.

Never claim that an election is anonymous unless the architecture actually protects ballot secrecy.

---

# 14. SECURITY AND DATABASE RULES

Security is extremely important because VoteSphere handles elections and voting.

Always:

- Use Supabase Row Level Security.
- Validate data on the server.
- Verify user permissions.
- Protect election ownership.
- Prevent duplicate voting.
- Prevent unauthorized candidate modifications.
- Protect voting credentials.
- Validate election status before accepting votes.
- Use database constraints where appropriate.
- Use secure server-side operations for sensitive actions.
- Handle concurrent voting safely.

Never:

- Trust client-side user IDs.
- Trust client-side election ownership.
- Trust client-side vote counts.
- Allow users to modify their roles through ordinary requests.
- Expose service-role credentials.
- Store passwords manually.
- Reveal private voting credentials.
- Disable RLS simply to make a feature work.

For sensitive voting operations, use secure database transactions or appropriate atomic server-side operations.

---

# 15. PERFORMANCE

VoteSphere should remain fast, including on computers with limited hardware.

Performance is important.

Follow these rules:

- Prefer Server Components.
- Keep Client Components small.
- Avoid unnecessary dependencies.
- Avoid unnecessary useEffect hooks.
- Avoid unnecessary state.
- Use efficient database queries.
- Fetch only the required data.
- Use pagination for large lists.
- Avoid unnecessary realtime subscriptions.
- Clean up timers and subscriptions.
- Lazy-load heavy components.
- Load QR-scanning functionality only when needed.
- Avoid unnecessarily large images.
- Avoid expensive animations.
- Prevent unnecessary component re-renders.

Do not introduce complicated libraries when simpler solutions already exist.

---

# 16. CODE ORGANIZATION

Keep the code professional and maintainable.

Use:

- TypeScript interfaces and types.
- Reusable components.
- Meaningful component names.
- Reusable utility functions.
- Clear folder organization.
- Consistent naming conventions.
- Proper error handling.

Avoid:

- Unnecessary code duplication.
- Massive components when separation would improve maintainability.
- Unnecessary abstractions.
- The `any` type.
- Unused imports.
- Unused variables.
- Fake production functionality.
- Empty buttons.
- Unnecessary dependencies.

When modifying existing files, preserve their working functionality.

Do not rewrite unrelated components.

---

# 17. RESPONSIVE DESIGN

Every page must work properly on:

- Desktop.
- Laptop.
- Tablet.
- Mobile phones.

Ensure:

- Navigation adapts to screen size.
- Cards fit smaller screens.
- Forms remain usable.
- Tables have appropriate mobile handling.
- Buttons are accessible.
- Text does not overflow.
- Modals fit within the viewport.
- Scanning works on supported mobile browsers.

The application should not create unnecessary horizontal or vertical scrolling.

---

# 18. ACCESSIBILITY

Always provide:

- Accessible form labels.
- Keyboard navigation.
- Visible focus states.
- Appropriate button labels.
- Readable text contrast.
- Meaningful error messages.
- Accessible modal behavior.
- Reduced-motion support.

Do not rely on color alone to communicate election status.

---

# 19. AI CODING AGENT WORKFLOW

Before making any changes:

1. Read this AGENTS.md file.
2. Inspect the existing project structure.
3. Inspect the relevant source files.
4. Check existing dependencies.
5. Understand the existing Supabase implementation.
6. Identify whether the feature belongs on the server or client.
7. Consider security and database implications.
8. Implement the requested feature.
9. Preserve existing working functionality.
10. Check TypeScript and build errors where possible.

When the user requests a complete component:

- Provide the complete file.
- Include all necessary imports.
- Include all required types.
- Include all required handlers.
- Do not omit important code.
- Provide the correct file path.

When a database change is required:

- Explain the required SQL.
- Explain any required RLS policies.
- Explain any required indexes or constraints.
- Never silently modify existing database architecture.

When a feature requires additional configuration:

- Explain the exact configuration needed.
- Do not pretend configuration has already been completed.

Do not claim that code has been tested unless it has actually been tested.

---

# 20. FINAL PROJECT PRINCIPLES

Every development decision must support these principles:

1. SECURITY — Protect users, elections, credentials, and votes.
2. ACCURACY — Every accepted vote must be counted correctly.
3. FAIRNESS — Eligible voters must be treated equally.
4. PRIVACY — Protect voter information and ballot choices.
5. PERFORMANCE — Keep the application fast and lightweight.
6. SIMPLICITY — Make election management easy to understand.
7. CONSISTENCY — Maintain the dark emerald VoteSphere identity.
8. RELIABILITY — Prevent duplicate votes and invalid election states.
9. RESPONSIVENESS — Make the application work across devices.
10. MAINTAINABILITY — Keep the code clean and easy to extend.

---

# PROJECT SUMMARY

Project: VoteSphere

Framework: Next.js 16

Architecture: App Router

Language: TypeScript

Styling: Tailwind CSS

Font: Geist

Theme: Dark mode only

Primary palette: Emerald

Backend: Existing Supabase project

Authentication: Supabase Email/Password and Google OAuth

Animations: GSAP

Icons: Lucide React

Core functionality:
- Election management
- Candidate management
- Voter management
- QR-code scanning
- Secure voting
- Election countdown
- Automatic election closure
- Vote counting
- Winner determination
- Election results

**IMPORTANT FINAL INSTRUCTION:**

Always prioritize the user's exact request, preserve existing working code, follow this project's design system, and implement features securely and efficiently.

Build VoteSphere professionally, one feature at a time.
