# Admin Area Roadmap

## Goal

Create an internal admin area inside the same Angular application, backed by dedicated admin-only backend endpoints.

## Scope

- role-based access with `USER` and `ADMIN`
- admin-only backend module
- admin users list
- admin user detail page
- admin global links page
- admin audit log page
- ability to inspect and edit:
  - user profile
  - plan
  - activation state
  - user links
  - link properties
  - link deletion

## Implementation Notes

### 2026-03-20

- Decided to keep the admin area inside the same Angular application, but separate it through:
  - `/admin/...` routes
  - a dedicated admin layout
  - backend admin-only endpoints
- Added a `role` field to `User` with `USER` as the default.
- Added admin-role bootstrap support through `ADMIN_EMAILS` so an initial admin can be granted without manual JWT hacking.
- Added backend role handling in auth and profile flows.
- Added an admin guard/decorator layer on the backend to protect admin endpoints.
- Created a dedicated backend `admin` module with endpoints for:
  - listing users
  - viewing a user
  - updating a user
  - listing a user's links
  - updating a link as admin
  - deleting a link as admin
  - listing all links across the system
  - listing audit-log entries
- Added frontend admin route protection with a dedicated `AdminGuard`.
- Added initial admin UI pages for:
  - users list
  - user detail
  - user profile/subscription editing
  - link inspection and editing
- Expanded the admin users page with:
  - search
  - filters for role, plan, active state, and subscription status
  - pagination
- Added a dedicated global admin links page with:
  - search
  - filters for owner type, active state, owner plan, and subscription status
  - pagination
  - owner drill-in links
  - admin-side deletion
- Expanded the user-detail admin link editor so admins can update:
  - destination URL
  - short code
  - password
  - expiration
  - click limit
  - one-time state
  - landing page title
  - landing page description
  - landing page button label
  - active state
- Added link-state visibility in the admin user-detail list for:
  - password protection
  - expiration
  - click limits
  - one-time links
  - landing pages
  - active state
- Added persistent audit logging for admin mutations with a dedicated `AdminAuditLog` model.
- Audit entries now record:
  - acting admin user
  - action
  - target type and id
  - target label
  - change summary
  - IP address
  - user agent
  - timestamp
- Added an admin audit-log page with:
  - search
  - action filtering
  - target-type filtering
  - pagination
  - readable before/after change rendering
  - structured deleted-link summaries
  - direct navigation back to affected users for user-targeted entries

## Bootstrap

To make yourself an admin during development, add your email to:

```env
ADMIN_EMAILS=you@example.com
```

Then log out and log back in so the new role is reflected in your token and profile.

## Current Coverage

- Admins can view all users.
- Admins can filter and page through the users list.
- Admins can inspect an individual user.
- Admins can edit user name, role, plan, and activation state.
- Admins can see Stripe-related subscription status fields on user detail.
- Admins can inspect all links owned by a user.
- Admins can edit supported link properties from the admin area.
- Admins can delete links.
- Admins can view all links across the system.
- Admins can filter and page through the global links list.
- Admins can review audit-log entries for admin changes.

## Next Steps

- decide how manual admin plan changes should interact with Stripe webhook sync long term
- consider adding drill-in links from link-targeted audit events back into the admin links workspace
- consider exposing audit logs on user detail pages for per-user investigation
