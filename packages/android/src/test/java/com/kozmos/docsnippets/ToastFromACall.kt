// Toast.mdx's Compose snippet ("From a call: toast() and Toaster"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.toast.KozmosToastAction
import com.kozmos.components.toast.KozmosToastTone
import com.kozmos.components.toast.KozmosToaster
import com.kozmos.components.toast.toast
import kotlin.time.Duration

// toast() shows one from anywhere, on any thread: a click, a request's
// callback, a view model. The second call, given the first's id, replaces it
// where it is and is announced again. Call this as the request starts, and
// what it returns with whether the place was saved.
fun startSavingPlace(retry: () -> Unit): (Boolean) -> Unit {
    val id = toast("Saving", duration = Duration.INFINITE)
    return { saved ->
        if (saved) {
            toast(
                "Location saved",
                id = id,
                tone = KozmosToastTone.Success,
                description = "Find it in your saved places."
            )
        } else {
            toast(
                "Could not save",
                id = id,
                tone = KozmosToastTone.Critical,
                description = "Check your connection and try again.",
                action = KozmosToastAction("Retry", onClick = retry)
            )
        }
    }
}

// One KozmosToaster over the screen's content draws them, at its bottom end.
@Composable
fun SavePlaceScreen(onSave: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize()) {
        KozmosButton(onClick = onSave) { Text("Save") }
        KozmosToaster(closeLabel = "Dismiss notification")
    }
}
