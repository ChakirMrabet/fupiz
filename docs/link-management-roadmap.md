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
