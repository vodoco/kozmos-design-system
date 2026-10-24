package com.kozmos.components.surface

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import com.kozmos.components.KeptFrames
import com.kozmos.components.icon.KozmosIconColor
import com.kozmos.components.icon.resolveIconTint
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import java.io.File
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The muted colour is the contract's: packages/tokens/src/contrast-contract.json
 * pairs muted foreground with foreground/400 at 4.5:1, on background/0 and on
 * background/100, and React draws it so (`text-muted-foreground`,
 * `.kozmos-muted-text`). Every muted default here was foreground/500 until
 * 2026-10-24: #747B8B, 4.24:1 on white, under AA. Foreground/400, #5D626F,
 * reads 6.10:1. In the dark both pass on black: 500 #8B8474 5.65:1, 400
 * #A29D90 7.76:1.
 *
 * Each default is read in each theme and its WCAG ratio computed with each of
 * the contract's muted backgrounds, read from the contract itself, found by
 * walking up from the directory Gradle runs the tests in.
 */
class KozmosMutedForegroundContrastTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private class ContractPair(val name: String, val background: String, val foreground: String, val minimum: Double)

    /** The contract's muted pairs: every pair whose name starts "muted foreground". */
    private fun mutedPairs(): List<ContractPair> {
        var directory: File? = File(checkNotNull(System.getProperty("user.dir"))).absoluteFile
        while (directory != null) {
            val candidate = File(directory, "packages/tokens/src/contrast-contract.json")
            if (candidate.isFile) {
                val pair = Regex(
                    "\\{\\s*\"name\"\\s*:\\s*\"(muted foreground[^\"]*)\"\\s*,\\s*\"background\"\\s*:\\s*\"([^\"]+)\"\\s*," +
                        "\\s*\"foreground\"\\s*:\\s*\"([^\"]+)\"\\s*,\\s*\"minimum\"\\s*:\\s*([0-9.]+)\\s*\\}"
                )
                val pairs = pair.findAll(candidate.readText()).map {
                    ContractPair(it.groupValues[1], it.groupValues[2], it.groupValues[3], it.groupValues[4].toDouble())
                }.toList()
                assertTrue(
                    "the contract has no muted pair on background/0: ${pairs.map { it.name }}",
                    pairs.any { it.background == "primitives-colors-background-0" }
                )
                return pairs
            }
            directory = directory.parentFile
        }
        error("no packages/tokens/src/contrast-contract.json above ${System.getProperty("user.dir")}")
    }

    /** The contract's tokens this test can resolve, by their CSS names. */
    @Composable
    private fun token(name: String): Color? = when (name) {
        "primitives-colors-background-0" -> KozmosThemeTokens.primitivesColorsBackground0
        "primitives-colors-background-100" -> KozmosThemeTokens.primitivesColorsBackground100
        "primitives-colors-foreground-400" -> KozmosThemeTokens.primitivesColorsForeground400
        else -> null
    }

    /** Every muted default, and the contract's [names], read in one theme. */
    private fun read(dark: Boolean, names: Set<String>): kotlin.Pair<Map<String, Color>, Map<String, Color?>> {
        var defaults = emptyMap<String, Color>()
        var tokens = emptyMap<String, Color?>()
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                defaults = linkedMapOf(
                    "kozmosMutedForeground(null)" to kozmosMutedForeground(null),
                    "kozmosMutedForeground(Solid)" to kozmosMutedForeground(KozmosSurfaceStyle.Solid),
                    "KozmosIconColor.Muted" to resolveIconTint(KozmosIconColor.Muted)
                )
                tokens = names.associateWith { token(it) }
            }
        }
        return defaults to tokens
    }

    private fun luminance(c: Color): Double {
        fun channel(v: Float): Double = if (v <= 0.03928f) v / 12.92 else ((v + 0.055) / 1.055).pow(2.4)
        return 0.2126 * channel(c.red) + 0.7152 * channel(c.green) + 0.0722 * channel(c.blue)
    }

    private fun contrast(a: Color, b: Color): Double {
        val (la, lb) = luminance(a) to luminance(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    private fun hex(c: Color) = String.format("#%06X", c.toArgb() and 0xFFFFFF)

    /** Each default is the contract's muted token, in both themes. */
    @Test
    fun everyMutedDefaultIsTheContractsMutedForeground() {
        val foregrounds = mutedPairs().map { it.foreground }.toSet()
        assertEquals("the contract's muted pairs name more than one foreground: $foregrounds", 1, foregrounds.size)
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val (defaults, tokens) = read(dark, foregrounds)
            for (foreground in foregrounds) {
                val want = checkNotNull(tokens[foreground]) { "no colour for the contract's $foreground" }
                for ((name, got) in defaults) {
                    println("Muted Android, $name, $theme: ${hex(got)}, the contract's $foreground ${hex(want)}")
                    if (got.toArgb() != want.toArgb()) wrong += "$name, $theme: ${hex(got)}, not $foreground ${hex(want)}"
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /**
     * Each default reaches the contract's minimum on each muted background,
     * light and dark, computed from the colours it resolves to.
     */
    @Test
    fun everyMutedDefaultReadsAtTheContractsMinimum() {
        val pairs = mutedPairs()
        val low = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val (defaults, tokens) = read(dark, pairs.map { it.background }.toSet())
            for (pair in pairs) {
                val surface = checkNotNull(tokens[pair.background]) { "no colour for the contract's ${pair.background}" }
                for ((name, text) in defaults) {
                    val ratio = contrast(text, surface)
                    val line = "$name on ${pair.background}, $theme: ${hex(text)} on ${hex(surface)}, ${String.format("%.2f", ratio)}:1"
                    println("Muted Android, $line")
                    if (ratio < pair.minimum) low += "$line, under ${pair.minimum} (${pair.name})"
                }
            }
        }
        assertTrue(low.joinToString("; "), low.isEmpty())
    }
}
