The code the Get started page shows. Each file is a real module that `tsc`
checks against the built packages, and the page imports its text with `?raw`,
so a snippet that stops compiling fails the build instead of misleading a
reader. Nothing imports these files as code.
