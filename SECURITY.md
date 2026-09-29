# Security

## Reporting a vulnerability

Report anything you believe is a security problem privately, not as a public
issue or pull request.

Private vulnerability reporting is not enabled on this repository yet, so
GitHub's advisory form is not open to reporters. Until it is, email the
maintainers at kozmos-maintainers@pointr.tech, the address in
[`CONTRIBUTING.md`](./CONTRIBUTING.md). Once it is enabled, the form —
<https://github.com/vodoco/kozmos-design-system/security/advisories/new> — is
the way, and is visible only to the maintainers.

If you cannot email, open an ordinary issue saying only that you have a
security report and how we can reach you privately. Do not put the details in
it.

Please include what you found, where (a file, a package and version, or a
URL), and what an attacker could do with it. A proof of concept helps. If you
have already published the details somewhere, say so.

We will acknowledge a report within five working days and tell you what we
intend to do about it. Please give us 90 days before disclosing publicly, or
less if we have shipped a fix sooner.

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
