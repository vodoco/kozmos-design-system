package com.kozmos.components.fileupload

import android.content.ContentProvider
import android.content.ContentResolver
import android.content.ContentValues
import android.content.Context
import android.content.ContextWrapper
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalContext
import androidx.core.app.ActivityOptionsCompat
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React shows a picked file by its name (`File.name`), and SwiftUI by its
 * file URL's last component, which on iOS is the file's name. Compose showed
 * the content URI's last segment, which for a document provider's URI is the
 * document's ID ("1742"), not its name: Android gives a file's name as the
 * provider's `OpenableColumns.DISPLAY_NAME`.
 */
class KozmosFileUploadNameTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** What the system's picker hands back: a document provider's URI, ending in an ID. */
    private val picked = Uri.parse("content://com.example.documents/document/1742")

    /** A document provider that knows the file by [name], or by nothing when it is null. */
    private class Documents(private val name: String?) : ContentProvider() {
        override fun onCreate() = true
        override fun query(
            uri: Uri,
            projection: Array<out String>?,
            selection: String?,
            selectionArgs: Array<out String>?,
            sortOrder: String?
        ): Cursor = MatrixCursor(arrayOf(OpenableColumns.DISPLAY_NAME)).apply {
            if (name != null) addRow(arrayOf(name))
        }
        override fun getType(uri: Uri): String? = null
        override fun insert(uri: Uri, values: ContentValues?): Uri? = null
        override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?) = 0
        override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?) = 0
    }

    /**
     * A resolver that answers from [provider], as `ContentResolver.wrap` makes
     * one. Paparazzi's own resolver, layoutlib's, answers every query with
     * nothing, and `wrap` fails there: it asks for the running Application,
     * which layoutlib has none of. So the class `wrap` makes is made here,
     * with the test's context.
     */
    private fun resolverAnswering(context: Context, provider: ContentProvider): ContentResolver {
        val contentInterface = Class.forName("android.content.ContentInterface")
        val made = (1..9).asSequence()
            .mapNotNull { runCatching { Class.forName("android.content.ContentResolver\$$it") }.getOrNull() }
            .first { ContentResolver::class.java.isAssignableFrom(it) }
        val constructor = made.getDeclaredConstructor(Context::class.java, contentInterface)
        constructor.isAccessible = true
        return constructor.newInstance(context, provider) as ContentResolver
    }

    /** The system's picker, answering every launch with [uri] at once. */
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

    /** Picks [picked] from a provider that names it [name], and returns the words then shown. */
    private fun shownAfterPicking(name: String?): List<String> {
        var shown = emptyList<String>()
        paparazzi.live(content = {
            val base = LocalContext.current
            val resolver = resolverAnswering(base, Documents(name))
            val context = object : ContextWrapper(base) {
                override fun getContentResolver(): ContentResolver = resolver
            }
            CompositionLocalProvider(
                LocalContext provides context,
                LocalActivityResultRegistryOwner provides picker(picked)
            ) {
                KozmosMaterialTheme { KozmosFileUpload(onFileSelected = {}) }
            }
        }) {
            frames(2)
            val upload = read().merged.single { it.click != null }
            upload.click!!.invoke()
            frames(3)
            shown = read().unmerged.flatMap { it.texts }
        }
        return shown
    }

    @Test fun aPickedFileIsShownByTheNameItsProviderGivesIt() {
        assertEquals(listOf("Grundriss Ebene 2.pdf"), shownAfterPicking("Grundriss Ebene 2.pdf"))
    }

    @Test fun aProviderThatGivesNoNameLeavesTheUrisLastSegment() {
        assertEquals(listOf("1742"), shownAfterPicking(null))
    }
}
