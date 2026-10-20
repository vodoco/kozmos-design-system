// ThemeProvider.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.themeprovider.KozmosThemeProvider

// The provider starts with the system's theme. Inside it,
// LocalThemeManager.current.setThemeMode(KozmosThemeMode.DARK) changes the
// theme of its content; the choice is not saved.
@Composable
fun ThemedScreen(onContinue: () -> Unit) {
    KozmosThemeProvider {
        KozmosButton(onClick = onContinue) { Text("Continue") }
    }
}
