package com.kozmos.providers

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Compose has one analytics pipeline: `LocalKozmosAnalytics` in
 * `com.kozmos.providers`, which every component reads, with its
 * `KozmosAnalyticsEvent` and `KozmosAnalyticsTracker`, and the batching
 * `KozmosAnalyticsProvider` (public, and on a test's clock) that puts its
 * tracker there, with its `KozmosAnalyticsBatcher` (GAP-177). Until 17 Oct
 * `com.kozmos.utils` declared a second, no-op `LocalKozmosAnalytics`, a second
 * event and tracker, and an `object KozmosAnalytics`. Kotlin allows the same
 * name in two packages, so it compiled, and a product that provided its
 * tracker through the `utils` local received no event.
 *
 * Read from the module's Kotlin sources, found by walking up from the
 * directory Gradle runs the tests in, so a second declaration anywhere in
 * `src/main` fails here.
 */
class KozmosAnalyticsDeclarationsTest {
    private val declaration = Regex(
        """^\s*(?:(?:public|internal|private|data|sealed|open|abstract|inline|value)\s+)*""" +
            """(?:val|var|class|object|interface|typealias|fun)\s+((?:Local)?KozmosAnalytics\w*)\b""",
        RegexOption.MULTILINE,
    )

    private fun mainSources(): File {
        var directory: File? = File(System.getProperty("user.dir")).absoluteFile
        while (directory != null) {
            val candidate = File(directory, "packages/android/src/main/java")
            if (candidate.isDirectory) return candidate
            val module = File(directory, "src/main/java/com/kozmos")
            if (module.isDirectory) return File(directory, "src/main/java")
            directory = directory.parentFile
        }
        error("no packages/android/src/main/java above ${System.getProperty("user.dir")}")
    }

    @Test
    fun eachAnalyticsNameIsDeclaredOnceInProviders() {
        val root = mainSources()
        val files = root.walkTopDown().filter { it.isFile && it.extension == "kt" }.toList()
        check(files.size > 100) { "read only ${files.size} Kotlin files under $root" }
        val found = files.flatMap { file ->
            declaration.findAll(file.readText()).map { match ->
                "${match.groupValues[1]} in ${file.relativeTo(root).invariantSeparatorsPath}"
            }.toList()
        }.sorted()
        assertEquals(
            listOf(
                "KozmosAnalyticsBatcher in com/kozmos/providers/KozmosAnalyticsProvider.kt",
                "KozmosAnalyticsEvent in com/kozmos/providers/LocalKozmosAnalytics.kt",
                "KozmosAnalyticsProvider in com/kozmos/providers/KozmosAnalyticsProvider.kt",
                "KozmosAnalyticsProvider in com/kozmos/providers/KozmosAnalyticsProvider.kt",
                "KozmosAnalyticsTracker in com/kozmos/providers/LocalKozmosAnalytics.kt",
                "LocalKozmosAnalytics in com/kozmos/providers/LocalKozmosAnalytics.kt",
            ),
            found,
        )
    }
}
