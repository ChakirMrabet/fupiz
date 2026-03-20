# Admin Area Roadmap

## Goal

Create an internal admin area inside the same Angular application, backed by dedicated admin-only backend endpoints.

## Scope

- role-based access with `USER` and `ADMIN`
- admin-only backend module
- admin users list
- admin user detail page
- ability to inspect and edit:
  - user profile
  - plan
  - activation state
  - user links

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
- Added frontend admin route protection with a dedicated `AdminGuard`.
- Added initial admin UI pages for:
  - users list
  - user detail
  - user profile/subscription editing
  - link inspection and editing

## Bootstrap

To make yourself an admin during development, add your email to:

```env
ADMIN_EMAILS=you@example.com
```

Then log out and log back in so the new role is reflected in your token and profile.

## Next Steps

- add pagination and filters to admin users
- add a global links view for admins
- add audit logging for admin changes
- decide how manual admin plan changes should interact with Stripe webhook sync long term
