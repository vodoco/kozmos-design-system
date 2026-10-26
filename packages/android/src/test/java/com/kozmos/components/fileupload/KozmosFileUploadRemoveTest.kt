package com.kozmos.components.fileupload

import android.net.Uri
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import androidx.compose.runtime.CompositionLocalProvider
import androidx.core.app.ActivityOptionsCompat
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-185: React's FileUpload calls `onFilesChange` when the visitor removes
 * a file; Compose's took only `onFileSelected`, so a product never heard of
 * the removal. It takes `onFileRemoved`, told the file removed. GAP-182: the
 * drop area's "Tap to upload file" and the remove button's "Remove" were
 * fixed English; they are `browseLabel`, as React's, and `removeLabel`.
 */
class KozmosFileUploadRemoveTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val plan = Uri.parse("file:///storage/emulated/0/Download/Grundriss.pdf")

    /** The system's picker, answering a launch at once with [uri]. */
    private fun picker(uri: Uri) = object : ActivityResultRegistryOwner {
        override val activityResultRegistry = object : ActivityResultRegistry() {
            override fun <I, O> onLaunch(
                requestCode: Int,
                contract: ActivityResultContract<I, O>,
                input: I,
                options: ActivityOptionsCompat?
            ) {
                dispatchResult(requestCode, uri)
            }
        }
    }

    /** Taps the drop area: the one control with words and a click. */
    private fun LiveSemantics.pick() = read().merged.single { it.click != null && it.texts.isNotEmpty() }.click!!.invoke()

    /** Every word the part shows or says. */
    private fun LiveSemantics.words() = read().unmerged.flatMap { listOfNotNull(it.description) + it.texts }

    @Test fun removingTheFileTellsTheProductWhichFile() {
        val removed = mutableListOf<Uri>()
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker(plan)) {
                KozmosMaterialTheme { KozmosFileUpload(onFileRemoved = { removed += it }) {} }
            }
        }) {
            frames(2)
            pick()
            frames(3)
            assertEquals(listOf("Grundriss.pdf", "Remove"), words())
            read().merged.single { it.description == "Remove" }.click!!.invoke()
            frames(3)
            assertEquals(listOf(plan), removed)
            assertEquals("the drop area is back", listOf("Tap to upload file"), words())
        }
    }

    @Test fun theWordsAreAProductsOwn() {
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker(plan)) {
                KozmosMaterialTheme {
                    KozmosFileUpload(browseLabel = "Zum Hochladen tippen", removeLabel = "Entfernen") {}
                }
            }
        }) {
            frames(2)
            assertEquals(listOf("Zum Hochladen tippen"), words())
            pick()
            frames(3)
            assertEquals(listOf("Grundriss.pdf", "Entfernen"), words())
        }
    }

    @Test fun theDropAreaKeepsTheEnglishWhenLeftOut() {
        val tree = paparazzi.readSemantics {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker(plan)) {
                KozmosMaterialTheme { KozmosFileUpload {} }
            }
        }
        assertEquals(listOf("Tap to upload file"), tree.unmerged.flatMap { listOfNotNull(it.description) + it.texts })
    }
}
