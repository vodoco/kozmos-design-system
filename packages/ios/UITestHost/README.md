# Native interaction test host

This offline app exercises Kozmos's public SwiftUI API through XCUITest. It has no
Pointr SDK, tenant configuration or credentials. `InteractionTests` replaces the
in-process tests that enabled accessibility with undocumented `_AXS` symbols.
The fixture's callback log records what the component reports; it does not
implement selection or scrolling on the component's behalf.

Run `node scripts/check-ios-poi.mjs` from the repository root. It runs the whole
package test target, then this host on the same pinned simulator. Both xcresult
bundles are retained. The runner verifies every declared interaction test by
name, so an accidentally empty or skipped target cannot pass.

The Xcode project is generated with XcodeGen 2.45.4 from `project.yml` and committed
so CI needs no additional downloaded project generator. After changing targets
or source membership, run `xcodegen generate` here and review its diff. Do not
commit `xcuserdata` or build output. The two documentation fixtures are shared
with the package's compile tests, not copied into this app.

These checks cover accessibility names, roles, enabled/selected states and real
input/callback behaviour. They are not a manual VoiceOver speech, reading-order
or physical-device acceptance review. Keep that evidence separate.
