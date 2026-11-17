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
 * GAP-274: New Client's "Add logo" beside the client's name has no room for
 * a drop area. React's FileUpload takes `variant="button"`, an outline
 * Button-sized trigger that picks as the drop area does; Compose's takes
 * `variant = KozmosFileUploadVariant.Button`.
 */
class KozmosFileUploadButtonTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val logo = Uri.parse("file:///storage/emulated/0/Pictures/acme.png")

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

    private fun LiveSemantics.words() = read().unmerged.flatMap { listOfNotNull(it.description) + it.texts }

    @Test fun theButtonFormIsAButtonNamedWithItsWordsThatPicksAnImageAndComesBackWhenItIsRemoved() {
        val picker = Picker(listOf(logo))
        val picked = mutableListOf<Uri>()
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker) {
                KozmosMaterialTheme {
                    KozmosFileUpload(
                        browseLabel = "Add logo",
                        preview = KozmosFileUploadPreview.Image,
                        variant = KozmosFileUploadVariant.Button
                    ) { picked += it }
                }
            }
        }) {
            frames(2)
            val trigger = read().merged.single { it.click != null }
            assertEquals(listOf("Add logo"), trigger.texts)
            assertEquals("the trigger is a Button", Role.Button, trigger.role)
            trigger.click!!.invoke()
            frames(3)
            assertEquals("it opens the drop area's picker, for images", listOf<Any?>("image/*"), picker.asked)
            assertEquals(listOf(logo), picked)
            assertEquals(listOf("acme.png", "acme.png", "Change", "Remove"), words())
            read().merged.single { it.description == "Remove" }.click!!.invoke()
            frames(3)
            val back = read().merged.single { it.click != null }
            assertEquals(listOf("Add logo"), back.texts)
            assertEquals(Role.Button, back.role)
        }
    }

    @Test fun theButtonSaysChooseFileByDefaultAndOffersAnyFile() {
        val picker = Picker(listOf(logo))
        paparazzi.live(content = {
            CompositionLocalProvider(LocalActivityResultRegistryOwner provides picker) {
                KozmosMaterialTheme { KozmosFileUpload(variant = KozmosFileUploadVariant.Button) {} }
            }
        }) {
            frames(2)
            val trigger = read().merged.single { it.click != null }
            assertEquals(listOf("Choose file"), trigger.texts)
            assertEquals(Role.Button, trigger.role)
            trigger.click!!.invoke()
            frames(3)
            assertEquals(listOf<Any?>("*/*"), picker.asked)
            assertEquals(listOf("acme.png", "Remove"), words())
        }
    }

    /** Both forms ask the picker for the same files and keep their own default words. */
    @Test fun bothFormsShareThePickersFilterAndEachHasItsOwnDefaultWords() {
        assertEquals("image/*", fileUploadPickerInput(KozmosFileUploadPreview.Image))
        assertEquals("*/*", fileUploadPickerInput(KozmosFileUploadPreview.None))
        assertEquals("Choose file", fileUploadBrowseLabel(null, KozmosFileUploadVariant.Button))
        assertEquals("Tap to upload file", fileUploadBrowseLabel(null, KozmosFileUploadVariant.Dropzone))
        assertEquals("Add logo", fileUploadBrowseLabel("Add logo", KozmosFileUploadVariant.Button))
    }
}
