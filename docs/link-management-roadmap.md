# Link Management Roadmap

## Goal

Expand the existing link CRUD flow with higher-value management features that make links editable and more controllable after creation.

## Feature Sequence

1. Link edit after creation
2. Expiration by click count
3. One-time links
4. Custom landing pages
5. Bulk link creation
6. Webhooks
7. Branded domains

## Implementation Notes

### 2026-03-17

- Started implementation of `link edit after creation`.
- Scope for the first slice:
  - allow updating `originalUrl`
  - allow paid plans to update `shortCode`
  - keep ownership checks on update
  - reject short-code collisions explicitly
  - add dashboard edit UI
- Plan split for this feature:
  - `FREE`: can edit destination
  - `PRO` and `BUSINESS`: can edit destination and custom short code
- Implemented backend update rules so link owners can:
  - change `originalUrl`
  - change `shortCode` on paid plans
- Added explicit short-code collision checks on update.
- Added dashboard edit UI using a modal-based flow to keep the link list compact.
- Started implementation of `expiration by click count`.
- Scope for this slice:
  - add `maxClicks` to links
  - allow paid plans to set and edit a click limit
  - stop redirecting once the click limit has been reached
  - auto-mark links inactive when their click limit is exhausted
  - show click usage in the dashboard
- Implemented `maxClicks` on the `Link` model with a Prisma migration.
- Added backend validation so click limits must be positive whole numbers.
- Added paid-plan gating for click-limit creation and editing.
- Updated redirect and password-unlock flows to stop working once the click limit is reached.
- Added automatic link deactivation once the limit is exhausted.
- Added dashboard create/edit inputs and link badges for click-limit usage.
- Started implementation of `one-time links`.
- Scope for this slice:
  - add an explicit `singleUse` flag to links
  - treat one-time links as a specialized click-limit rule
  - allow paid plans to create and edit them
  - show one-time status in the dashboard
- Implemented `singleUse` on the `Link` model with a Prisma migration.
- Implemented one-time links on top of the click-limit runtime so they expire after the first successful visit.
- Added paid-plan gating for one-time link creation and editing.
- Updated dashboard create/edit flows with a dedicated one-time toggle.
- Added dashboard badges for one-time link status and `0 / 1` style usage visibility.
