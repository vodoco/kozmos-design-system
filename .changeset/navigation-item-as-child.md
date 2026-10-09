---
"@kozmos-ds/react": patch
---

`NavigationItem`'s `asChild` works. It threw on every render ("React.Children.only expected to receive a single React element child"), so a router's link could not be the item. Now the one child, such as `<Link to="/home">Home</Link>`, becomes the item: it takes the item's classes, `aria-current` and handlers, its own handler runs first, and the icon, the label (the child's own text) and the badge or trailing content are drawn inside it.
