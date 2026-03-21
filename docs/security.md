# Security

## Goal

Document the security measures currently implemented across authentication, authorization, data protection, and admin operations.

## Authentication

- JWT authentication is required for protected backend areas such as:
  - `users`
  - `links`
  - `billing` authenticated actions
  - `webhooks`
  - `admin`
- `JWT_SECRET` is mandatory.
  - The application no longer falls back to a hardcoded default secret.
  - Startup fails if `JWT_SECRET` is missing.
- JWT expiration is enforced by Passport JWT with `ignoreExpiration: false`.
- User passwords are hashed with `bcrypt` before storage.
- Inactive accounts cannot log in.

## Authorization

- Dashboard and account APIs are protected by `AuthGuard('jwt')`.
- Admin APIs are protected by:
  - `AuthGuard('jwt')`
  - `RolesGuard`
  - `@Roles('ADMIN')`
- Admin authorization does not trust the role embedded in the JWT alone.
  - On every authenticated request, the backend reloads the user from the database.
  - Effective role is recalculated from current user state and `ADMIN_EMAILS`.
  - This makes admin revocation and account deactivation take effect immediately.
- `users/me` rejects direct self-service plan changes.
  - User-driven plan changes must go through billing.

## Frontend Route Protection

- The dashboard route uses an auth guard.
- Admin routes use a dedicated admin guard.
- Frontend guards now:
  - reject missing tokens
  - reject clearly expired tokens
  - validate the token against `/api/users/me` before allowing protected screens
  - clear local session state on backend auth failure
- The dashboard also logs the user out and redirects to login if profile loading fails after navigation.

## Link Protection

- Link ownership checks are enforced on authenticated user link updates, deletes, and analytics access.
- Admin link operations are isolated to admin-only endpoints.
- Protected links use hashed passwords.
  - Link passwords are hashed with `bcrypt` before storage.
  - Unlock flow verifies using `bcrypt.compare`.
  - Raw link passwords are not returned to the frontend.
- Link responses sent to the frontend expose only:
  - `passwordProtected: true|false`
  - never the stored hash

## Admin Security

- Admin area is protected on both frontend and backend.
- Admin mutations are audit logged.
- Audit entries record:
  - acting admin user
  - action
  - target type
  - target id
  - target label
  - change summary
  - IP address
  - user agent
  - timestamp
- Audit logging intentionally stores only password-protection state changes, not raw password values.

## Transport / Browser Access

- CORS is restricted to configured frontend origin values from `FRONTEND_URL`.
- The application no longer enables unrestricted cross-origin access by default.

## Public Endpoints

- Public endpoints remain available only for intended unauthenticated flows:
  - account registration
  - account activation
  - login
  - public short-link redirects
  - public anonymous link creation
  - public landing/visit flows
  - Stripe webhook receiver
- Public redirect flows still enforce:
  - active-state checks
  - expiration checks
  - click-limit checks
  - password verification where required

## Security Notes

- Admin plan edits are currently allowed for operational use.
- Stripe webhook synchronization remains in place for billing-driven plan state.
- The long-term policy for resolving conflicts between manual admin plan edits and later Stripe webhook events is still a product/security follow-up item.

## Recommended Next Hardening Steps

- Add rate limiting for:
  - login
  - activation attempts
  - password-protected link unlock attempts
  - anonymous link creation
- Add stronger request validation on public and admin endpoints.
- Consider shortening JWT lifetime and introducing refresh-token rotation if the product moves beyond local/dev-style usage.
- Consider exposing per-user audit views in the admin area for investigation workflows.
