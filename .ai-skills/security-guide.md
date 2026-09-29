# Kozmos Design System - Security Hardening Guide

> **Purpose:** Comprehensive security guidelines for the Kozmos Design System.

---

## 1. Security Principles

| Principle             | Implementation                           |
| --------------------- | ---------------------------------------- |
| **Defense in Depth**  | Input validation + output encoding + CSP |
| **Least Privilege**   | Scoped tokens, limited API access        |
| **Secure by Default** | XSS protection, HTTPS only               |

---

## 2. XSS Prevention

### Safe Patterns

```tsx
export function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}</p>; // JSX escapes what it renders
}

export function showStatus(element: HTMLElement, text: string) {
  element.textContent = text; // text, never parsed as HTML
}
```

HTML that comes from outside the app is sanitised before it is rendered, with a library of the
app's own (DOMPurify is one; Kozmos installs none), and never inserted as raw HTML as it arrived.

### URL Validation

```typescript
const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url, window.location.origin);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
```

---

## 3. Dependency Security

No workflow audits dependencies: there is no `security.yml`, no Snyk and no Renovate. GitHub's
Dependabot alerts are the dependency scanning, and an audit can be run by hand:

```bash
pnpm audit --audit-level=moderate
```

---

## 4. Content Security Policy

```typescript
const cspPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'strict-dynamic'"],
  "frame-ancestors": ["'none'"],
};
```

---

## 5. Authentication

```typescript
// Never store tokens in localStorage
// Use HttpOnly cookies or secure storage
```

---

## 6. Mobile Security

### iOS

- Use Keychain for sensitive data
- Enable certificate pinning
- Use `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`

### Android

- Use EncryptedSharedPreferences
- Enable certificate pinning with OkHttp
- Use hardware-backed keystore

### React Native

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 7. CI/CD Security

What the workflows do today ([ci-cd-configuration.md](./ci-cd-configuration.md)):

- The npm credential, `NPM_TOKEN`, is an environment secret that only the publish job in
  `release.yml` can read, after Olcay approves the deployment; it is never a repository secret.
- The publish job alone may mint an OIDC token, for npm provenance (from the release after 0.5.0).
- `release.yml` pins its third-party actions to commit SHAs, gives the GitHub token read-only
  permissions and never persists it at checkout.
- Nothing generates an SBOM.

---

## 8. Audit Checklist

### Pre-Release

- [ ] `pnpm audit` clean
- [ ] No secrets in code
- [ ] CSP configured
- [ ] Input validated
- [ ] HTTPS enforced

### Quarterly

- [ ] Dependency review
- [ ] Penetration test
- [ ] Secret rotation
- [ ] Threat model update

---

## Related Documents

- [CI/CD Configuration](./ci-cd-configuration.md)
- [Incident Playbook](./incident-playbook.md)

---

**Last updated:** 2026-02-08
