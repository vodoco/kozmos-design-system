# Kozmos Design System - Contract Tests

This directory contains the provider contracts for the `@kozmos-ds/react` package using [Pact](https://docs.pact.io/).

## Purpose

As the SDK consumer base grows (e.g., Dashboard team, Pointr clients), we use contract testing to ensure that structural modifications to our UI components or design tokens do not break consuming applications.

## Structure

- `provider.ts`: The configured provider instance to verify contracts against consumer expectations.
- `consumers/`: Expected schemas and interactions defined by our downstream apps.

## Running Tests

The provider verifier starts a deterministic local provider for the POICard API fixture, so no Storybook or external API server is required:

```bash
pnpm test:contracts
```
