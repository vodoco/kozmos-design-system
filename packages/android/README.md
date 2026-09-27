# Kozmos Android UI Library

This is the Android side of the Kozmos Design System, built with **Jetpack Compose**.

## Building Locally

Gradle needs to know where the Android SDK lives. Either export `ANDROID_HOME`:

```bash
ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew assembleDebug
```

or create `packages/android/local.properties` (gitignored) with:

```properties
sdk.dir=/Users/<you>/Library/Android/sdk
```

Without one of these, every Gradle task fails with `SDK location not found` before
compilation starts. The module targets `compileSdk 34`, so the `android-34`
platform and `34.0.0` build-tools must be installed.

## Conventions

Component packages are lowercase and match the directory name — directory
`components/POIResultCard` declares `package com.kozmos.components.poiresultcard`.

Platform-neutral presentation models live in `com.kozmos.contracts` and mirror
the TypeScript `@kozmos-ds/product-contracts` package. Product / SDK components
take these contracts rather than loose primitives so React, SwiftUI, and Compose
describe the same shape.

## Performance & Memory Leak Tracking

Since this is an Android Library (`com.android.library`), we cannot run memory leak detection natively within this package on its own.

**Consumer Requirement:**
Any host application (e.g., the Pointr SDK consumer app, or a future `playground-android` app) MUST include `LeakCanary` to detect Composable retention leaks during development.

Add the following to your application's `app/build.gradle.kts`:

```kotlin
dependencies {
    // Detects memory leaks automatically in debug builds
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.12")
}
```

LeakCanary will automatically install itself and notify you of any retained Kozmos Composables.
