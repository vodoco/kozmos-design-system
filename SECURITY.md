# Security

## Reporting a vulnerability

Report anything you believe is a security problem privately, not as a public
issue or pull request.

**Communication setup pending (confirmed by the owner, 2026-10-01):** no
security mailbox has been established, and GitHub private vulnerability
reporting is not enabled. The previously documented mailbox did not exist.
The owner will add a verified private contact here when it is ready; this
document must not advertise an unverified address or reporting form.

Until then, ask the repository owner for a private reporting channel. If you
use a public issue, say only that you need a private security contact. Do not
include vulnerability details, credentials, sensitive files or a proof of
concept in that issue. Wait for a confirmed private channel before sending them.

Please include what you found, where (a file, a package and version, or a
URL), and what an attacker could do with it. A proof of concept helps. If you
have already published the details somewhere, say so.

The reporting contact and response commitment still need owner confirmation.
Do not rely on an acknowledgement deadline until that setup is complete.

## What is in scope

- The published packages: `@kozmos-ds/react`, `@kozmos-ds/tokens`,
  `@kozmos-ds/icons`, `@kozmos-ds/product-contracts`.
- The source in this repository, including the build and release scripts.
- The website published from this repository.

The site is a documentation site: it holds no accounts and no personal data,
and every example runs on data committed beside it.

## What is not

- Findings against a Pointr product that only uses these packages — report
  those to that product's team.
- Vulnerabilities in a dependency that are already public and have no
  exploitable path through this code. Tell us anyway if the path exists.
- Reports produced only by a scanner, without a description of the impact.

## Supported versions

Only the latest published version of each package is supported. Fixes go out
as a new release; we do not backport.
