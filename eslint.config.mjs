import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      // Disable this rule since it might complain about React in Scope in React 17+
      'react/react-in-jsx-scope': 'off',
      // Allow any for testing purposes
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      // No disabled rules
      'react/prop-types': 'off'
    }
  },
  {
    // A server render runs no layout effect, and React 18 warns for each one it
    // meets. A part's layout effect goes through its file's
    // `typeof window === "undefined" ? React.useEffect : React.useLayoutEffect`.
    files: ['packages/react/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='React'][callee.property.name='useLayoutEffect']",
          message:
            'React 18 warns on every server render that meets React.useLayoutEffect: call the file\'s `typeof window === "undefined" ? React.useEffect : React.useLayoutEffect` instead.'
        },
        {
          selector: "ImportSpecifier[imported.name='useLayoutEffect']",
          message:
            'React 18 warns on every server render that meets useLayoutEffect: call the file\'s `typeof window === "undefined" ? React.useEffect : React.useLayoutEffect` instead.'
        }
      ]
    }
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/android/**',
      '**/ios/**',
      '**/.cache/**',
      '**/playwright-report/**',
      '**/test-results/**'
    ]
  }
);
