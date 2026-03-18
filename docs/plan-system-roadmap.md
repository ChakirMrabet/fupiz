# Plan System Roadmap

## Goal

Introduce a third plan so current and upcoming link-management features can be split more cleanly across user segments.

## Plan Structure

### FREE

- Basic shortening
- QR codes
- Small limits
- No advanced link controls

### PRO

- Custom codes
- Password protection
- Date-based expiration
- Analytics access
- Intended for serious individual users

### BUSINESS

- Higher limits than PRO
- Reserved for scale, automation, and brand-oriented features
- Target home for upcoming features such as:
  - bulk link creation
  - webhooks
  - branded domains

## Implementation Notes

### 2026-03-17

- Decided to add a third plan before implementing the next wave of advanced link features.
- Current codebase only models `FREE` and `PRO`.
- Implemented `BUSINESS` as a third first-class plan in the backend plan config.
- Added future-facing entitlement flags to the plan model for:
  - destination editing
  - click limits
  - one-time links
  - custom landing pages
  - bulk creation
  - webhooks
  - branded domains
- Updated the plans API to return plans in a stable order: `FREE`, `PRO`, `BUSINESS`.
- Added server-side validation so user plan updates only accept known plan ids.
- Updated the pricing UI to render all three plans and show the future feature split.
- Updated the dashboard billing UI to simulate upgrades from:
  - `FREE` to `PRO`
  - `FREE` to `BUSINESS`
  - `PRO` to `BUSINESS`
