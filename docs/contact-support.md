# Contact and Support

## Goal

Document the two user-facing ways people can reach the team from the product.

## Public Contact

- A public `Contact Us` section is available on the landing page.
- It is intended for:
  - general questions
  - onboarding questions
  - pricing questions
  - partnership or reachability requests
- The landing-page form collects:
  - name
  - email
  - subject
  - message
- The form submits to:
  - `POST /api/public/contact`

## Dashboard Support

- Authenticated users can send account-specific support requests from the dashboard.
- Support is exposed as a dedicated top-level dashboard menu section:
  - `Support`
- The dashboard form collects:
  - category
  - subject
  - message
- The user identity is taken from the authenticated account rather than typed manually.
- The form submits to:
  - `POST /api/support`

## Delivery

- Both public contact and dashboard support messages are delivered through the existing mail module.
- Messages are sent to the configured support inbox.
- Relevant environment variables:
  - `MAIL_FROM`
  - `SUPPORT_EMAIL`
  - SMTP configuration variables

## Intended Split

- Use the public contact form for pre-signup and general communication.
- Use dashboard support for account-specific problems so the request is tied to the signed-in user.
