---
"@kozmos-ds/react": minor
---

Add RouteLocationField for controlled origin/destination search with stable resolved identity, secondary place context, explicit clearing and a separate map-selection action. Loading, empty and error states do not offer stale suggestions. SwiftUI and Compose counterparts are provided from the repository; native Combobox fields retain their accessible labels and SwiftUI selection no longer writes its binding twice.

Combobox disclosure/clear controls have 44 px/pt web/iOS and 48 dp Android targets and localizable labels. Initial uncontrolled search drafts no longer disappear on mount; subsequent selected-identity changes still update the display. SwiftUI option accessibility includes secondary location context.

RouteLocationField omits location IDs from automatic selection analytics. Generic web Combobox retains its legacy value event by default and gains an explicit includeValueInAnalytics opt-out.
