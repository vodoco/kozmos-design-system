The code the Get started page shows, and the theming page's `dark-mode.tsx`.
Each file is a real module that `tsc` checks against the built packages, and
the pages import its text with `?raw`, so a snippet that stops compiling fails
the build instead of misleading a reader. Nothing imports these files as code.
A component's own code, on each platform, is Storybook's.
