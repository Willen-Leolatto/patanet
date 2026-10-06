---
name: executar-qa
description: Validates feature implementation against PRD, Tech Spec, and Tasks through E2E testing with Playwright MCP, accessibility verification (WCAG 2.2), and visual analysis. Documents all bugs found with screenshot evidence and generates a comprehensive QA report. Use when the user asks to run QA, validate a feature, or test implementation completeness. Do not use for code review, bug fixing, or task implementation.
---

# QA Execution

## Procedures

**Step 1: Documentation Analysis (Mandatory)**
1. Read the PRD at `./tasks/prd-[feature-slug]/prd.md` and extract ALL numbered functional requirements.
2. Read the Tech Spec at `./tasks/prd-[feature-slug]/techspec.md` and verify implemented technical decisions.
3. Read Tasks at `./tasks/prd-[feature-slug]/tasks.md` and verify completion status of each task.
4. Create a verification checklist based on the requirements.
5. Do NOT skip this step — understanding requirements is fundamental for QA.

**Step 2: Environment Preparation (Mandatory)**
1. Verify the application is running on localhost.
2. Use `browser_navigate` from Playwright MCP to access the application.
3. Confirm the page loaded correctly with `browser_snapshot`.

**Step 3: E2E Tests with Playwright MCP (Mandatory)**
1. Read `references/playwright-tools.md` for the available tools reference.
2. For each functional requirement from the PRD:
   a. Navigate to the feature.
   b. Execute the expected flow.
   c. Verify the result.
   d. Capture screenshot evidence.
   e. Mark as PASSED or FAILED.
3. Always use `browser_snapshot` before interacting to understand current page state.
4. Check browser console for JavaScript errors with `browser_console_messages`.
5. Verify API calls with `browser_network_requests`.

**Step 4: Accessibility Verification (Mandatory)**
1. Verify for each screen/component:
   - Keyboard navigation works (Tab, Enter, Escape).
   - Interactive elements have descriptive labels.
   - Images have appropriate alt text.
   - Color contrast is adequate.
   - Forms have labels associated to inputs.
   - Error messages are clear and accessible.
2. Use `browser_press_key` to test keyboard navigation.
3. Use `browser_snapshot` to verify labels and semantic structure.
4. Follow WCAG 2.2 standard.

**Step 5: Visual Verification (Mandatory)**
1. Capture screenshots of main screens with `browser_take_screenshot`.
2. Verify layouts in different states (empty, with data, error).
3. Document visual inconsistencies found.
4. Verify responsiveness if applicable.

**Step 6: Bug Documentation**
1. For each bug found, document with:
   - Bug ID, Description, Severity (High/Medium/Low), Screenshot.
2. Save bugs to `./tasks/prd-[feature-slug]/bugs.md`.
3. If a blocking bug is found, document and report immediately.

**Step 7: Generate QA Report (Mandatory)**
1. Read the report template at `assets/qa-report-template.md`.
2. Fill in all sections with actual results.
3. Set status to APPROVED only when ALL PRD requirements are verified and functioning.

## Error Handling
- If the application is not running, instruct the user to start it with `bun run dev` before retrying.
- If Playwright MCP is unavailable, report the error and suggest running E2E tests manually with `bun run test:e2e`.
- If a blocking bug prevents testing subsequent features, document it and continue with testable areas.
