package com.kozmos.components.fileupload

import android.net.Uri
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.Role
import androidx.core.app.ActivityOptionsCompat
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-270: New Client's logo. React's FileUpload takes `preview="image"` and
 * shows the chosen image as an avatar-sized thumbnail with Change and
 * Remove; Compose's showed a picked image only as its name. It takes
 * `preview = KozmosFileUploadPreview.Image`.
 */
class KozmosFileUploadPreviewTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val logo = Uri.parse("file:///storage/emulated/0/Pictures/acme.png")
    private val second = Uri.parse("file:///storage/emulated/0/Pictures/acme-2.jpg")

    /** The system's picker: answers each launch with the next of [uris], and keeps what it was asked for. */
    private class Picker(private val uris: List<Uri>) : ActivityResultRegistryOwner {
        val asked = mutableListOf<Any?>()
        override val activityResultRegistry = object : ActivityResultRegistry() {
            override fun <I, O> onLaunch(
                requestCode: Int,
                contract: ActivityResultContract<I, O>,
                input: I,
                options: ActivityOptionsCompat?
            ) {
                asked += input
                dispatchResult(requestCode, uris[asked.size - 1])
            }
        }
    }

    private fun LiveSemantics.pick() = read().merged.single { it.click != null && it.texts.isNotEmpty() }.click!!.invoke()

    /** Every word the part shows or says. */
    private fun LiveSemantics.words() = read().unmerged.flatMap { listOfNotNull(it.description) + it.texts }

    @Test fun theChosenImageShowsWithChangeAndRemove() {
        val picker = Picker(listOf(logo, second))
        val picked = mutableListOf<Uri>()
        val removed = mutableListOf<Uri>()
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker) {
                KozmosMaterialTheme {
                    KozmosFileUpload(
                        preview = KozmosFileUploadPreview.Image,
                        previewAlt = "Acme logo",
                        onFileRemoved = { removed += it }
                    ) { picked += it }
                }
            }
        }) {
            frames(2)
            pick()
            frames(3)
            assertEquals("the picker offers images", listOf<Any?>("image/*"), picker.asked)
            assertEquals(listOf("Acme logo", "acme.png", "Change", "Remove"), words())
            val image = read().unmerged.single { it.description == "Acme logo" }
            assertEquals(Role.Image, image.role)

            read().merged.single { it.click != null && it.texts == listOf("Change") }.click!!.invoke()
            frames(3)
            assertEquals(listOf<Any?>("image/*", "image/*"), picker.asked)
            assertEquals(listOf(logo, second), picked)
            assertEquals(listOf("Acme logo", "acme-2.jpg", "Change", "Remove"), words())

            read().merged.single { it.description == "Remove" }.click!!.invoke()
            frames(3)
            assertEquals(listOf(second), removed)
            assertEquals("the drop area is back", listOf("Tap to upload file"), words())
        }
    }

    @Test fun theImageIsNamedByItsFileAndTheWordsAreAProductsOwn() {
        val picker = Picker(listOf(logo))
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker) {
                KozmosMaterialTheme {
                    KozmosFileUpload(
                        removeLabel = "Entfernen",
                        preview = KozmosFileUploadPreview.Image,
                        changeLabel = "Ändern"
                    ) {}
                }
            }
        }) {
            frames(2)
            pick()
            frames(3)
            assertEquals(listOf("acme.png", "acme.png", "Ändern", "Entfernen"), words())
        }
    }

    /** Without a preview the picker offers any file and the part shows its name, as before. */
    @Test fun withoutAPreviewThePickerOffersAnyFile() {
        val picker = Picker(listOf(logo))
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker) {
                KozmosMaterialTheme { KozmosFileUpload {} }
            }
        }) {
            frames(2)
            pick()
            frames(3)
            assertEquals(listOf<Any?>("*/*"), picker.asked)
            assertEquals(listOf("acme.png", "Remove"), words())
        }
    }
}
