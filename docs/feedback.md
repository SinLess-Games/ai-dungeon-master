# Feedback submissions

Give feedback in the shared navbar opens a responsive dialog with Bug Report and Feature Request options. Signed-in users supply a title, description, and optional reproduction steps or problem statement. Guests can open the dialog and sign in. Successful submissions show a confirmation; failures retain form content.

POST /api/feedback requires an authoritative Better Auth session and matching website Origin. Input lengths and type are validated on the server, with a 40 KB body limit. The server supplies the user ID and initial status, inserts into existing bug_reports or feature_requests tables, and returns only the new ID and type. No migrations are required. Administrators can read submissions in the Feedback inbox at /admin. The inbox separates bugs and features, shows reporter email and current status, and expands to show full details. It refreshes every 30 seconds and supports 20-item pages. GET /api/admin/feedback requires the authoritative admin session and excludes internal notes. Status editing is not included.

Validation: production build/typecheck, focused ESLint, and isolated browser tests for both submission types, invalid input, unauthenticated rejection, and Escape dismissal.
