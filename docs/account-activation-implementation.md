# Account Activation Implementation Log

## Goal

Strengthen account creation by introducing:

1. Password confirmation on the registration form.
2. Email-based account activation with a unique link.
3. Token expiration handling.
4. A frontend page in the Fupiz app that shows activation success or failure.

## Implementation Decisions

### Data model

- Store activation state directly on `User` instead of creating a separate token table.
- Add these fields to `User`:
  - `isActive`
  - `activationToken`
  - `activationTokenExpiresAt`
  - `activatedAt`

Reasoning:

- This keeps the first implementation small and aligned with the current codebase.
- The app only needs one active verification token per user right now.

### Registration flow

- Registration will no longer log the user in immediately.
- `POST /api/auth/register` will create an inactive user, generate an activation token, send an email, and return a message instructing the user to check their inbox.

### Login flow

- `POST /api/auth/login` will reject users whose accounts are not active yet.

### Activation flow

- The email link will point to the Angular app.
- The Angular activation page will call a backend activation endpoint.
- The backend activation endpoint will validate the token, check expiration, activate the user, and clear token data.

### Email delivery

- Use a dedicated backend mail service.
- Use environment variables for SMTP and frontend URL configuration.
- If SMTP is not configured, registration should fail clearly rather than silently skipping activation email delivery.

### Activation endpoint shape

- The email link opens the frontend route `/activate-account?token=...`.
- The frontend then calls `POST /api/auth/activate` with the token.

Reasoning:

- This keeps the user on an application page that can render success and failure states cleanly.
- It avoids backend HTML responses and keeps the activation UI in Angular.

### Duplicate unverified accounts

- Registration now rejects any existing email.
- If the email belongs to an inactive account, registration returns a specific conflict message indicating that activation is still pending.
- If the email belongs to an active account, registration returns the standard duplicate-account conflict.

Reasoning:

- The signup form should perform an explicit existence check and never silently reuse an existing account record.

## Change Log

### 2026-03-17

- Created documentation folder and implementation log.
- Confirmed current system behavior:
  - registration immediately returns a JWT
  - no email infrastructure exists
  - no activation state exists on `User`
- Added account activation fields to `User` in Prisma schema.
- Generated and applied Prisma migration `20260317224656_add_account_activation`.
- Regenerated Prisma client after schema changes.
- Added backend mail module and SMTP-backed activation email sender using `nodemailer`.
- Changed backend registration flow to create or refresh inactive users, generate activation tokens, send activation emails, and return a non-authenticated success message.
- Changed backend login flow to reject inactive accounts.
- Added backend activation endpoint to validate token, enforce expiration, activate the account, and clear token fields.
- Updated user response sanitization to avoid returning password and activation token fields.
- Updated frontend registration flow to require password confirmation and stop auto-login after registration.
- Added frontend activation page and route for success and failure states.
- Added backend dependency `nodemailer` and matching type definitions.
- Updated minimal backend and frontend test scaffolding to account for dependency injection changes.
- Tightened duplicate-email handling so registration now rejects both active and inactive existing accounts instead of refreshing inactive users.
- Explicitly loaded backend `.env` at application startup so mail configuration is available at runtime, not just to Prisma tooling.

## Environment Variables

The activation email flow depends on these backend environment variables:

- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FRONTEND_URL`
- `ACCOUNT_ACTIVATION_TTL_HOURS`

## Verification Notes

- Backend build passed after Prisma client regeneration.
- Frontend production build passed.
- Backend Jest initially failed because several existing placeholder specs were missing DI mocks; those specs were updated.
- Backend Jest passed after the spec harness fixes.
