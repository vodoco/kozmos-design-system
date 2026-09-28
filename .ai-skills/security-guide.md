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

```typescript
// Use textContent for text insertion
element.textContent = userInput;

// React JSX auto-escapes
<div>{userInput}</div>

// Use DOMPurify for HTML
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

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

```yaml
# .github/workflows/security.yml
- name: Audit dependencies
  run: pnpm audit --audit-level=moderate

- name: Snyk scan
  uses: snyk/actions/node@master
```

```json
// renovate.json
{
  "vulnerabilityAlerts": { "enabled": true, "automerge": true }
}
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

// React Native
import * as SecureStore from "expo-secure-store";
await SecureStore.setItemAsync("token", value);
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

- Use react-native-keychain
- Prevent screenshots on sensitive screens
- Detect jailbreak/root in production

---

## 7. CI/CD Security

- Use OIDC for cloud auth (no long-lived secrets)
- Generate SBOM for supply chain visibility
- Sign packages with npm provenance

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
