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
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalContext
import androidx.core.app.ActivityOptionsCompat
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-280: React's FileUpload takes `maxSize`, `maxFiles` and `multiple`,
 * and says why it refused a file; Compose's took one file and no limit, so
 * an app checked them itself, after the picker. It takes all three, refuses
 * in React's words by default, or the product's, and lists each file held.
 * The sizes come from the provider, as a picked file's name does
 * (`OpenableColumns.SIZE`), off the main thread.
 */
class KozmosFileUploadLimitsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun doc(id: Int) = Uri.parse("content://com.example.documents/document/$id")

    /** A document provider that names and sizes each document. */
    private class Documents(private val files: Map<Uri, Pair<String, Long>>) : ContentProvider() {
        override fun onCreate() = true
        override fun query(
            uri: Uri,
            projection: Array<out String>?,
            selection: String?,
            selectionArgs: Array<out String>?,
            sortOrder: String?
        ): Cursor {
            val columns = projection ?: arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)
            return MatrixCursor(columns).apply {
                files[uri]?.let { (name, size) ->
                    addRow(columns.map { if (it == OpenableColumns.SIZE) size else name }.toTypedArray())
                }
            }
        }
        override fun getType(uri: Uri): String? = null
        override fun insert(uri: Uri, values: ContentValues?): Uri? = null
        override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?) = 0
        override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?) = 0
    }

    /** As KozmosFileUploadNameTest makes one: Paparazzi's own resolver answers nothing. */
    private fun resolverAnswering(context: Context, provider: ContentProvider): ContentResolver {
        val contentInterface = Class.forName("android.content.ContentInterface")
        val made = (1..9).asSequence()
            .mapNotNull { runCatching { Class.forName("android.content.ContentResolver\$$it") }.getOrNull() }
            .first { ContentResolver::class.java.isAssignableFrom(it) }
        val constructor = made.getDeclaredConstructor(Context::class.java, contentInterface)
        constructor.isAccessible = true
        return constructor.newInstance(context, provider) as ContentResolver
    }

    /**
     * The system's picker, answering each launch at once with the next of
     * [picks], one Uri for GetContent or the list for GetMultipleContents,
     * and keeping each launch's contract in [contracts].
     */
    private class Picker(private val picks: List<List<Uri>>) : ActivityResultRegistryOwner {
        private var next = 0
        val contracts = mutableListOf<ActivityResultContract<*, *>>()
        override val activityResultRegistry = object : ActivityResultRegistry() {
            override fun <I, O> onLaunch(
                requestCode: Int,
                contract: ActivityResultContract<I, O>,
                input: I,
                options: ActivityOptionsCompat?
            ) {
                contracts += contract
                val pick = picks[next++]
                if (contract is ActivityResultContracts.GetMultipleContents) dispatchResult(requestCode, pick)
                else dispatchResult(requestCode, pick.first())
            }
        }
    }

    private fun upload(
        documents: Documents,
        picker: Picker,
        part: @androidx.compose.runtime.Composable () -> Unit,
        script: suspend LiveSemantics.() -> Unit
    ) = paparazzi.live(durationMillis = 6000, content = {
        val base = LocalContext.current
        val resolver = resolverAnswering(base, documents)
        val context = object : ContextWrapper(base) {
            override fun getContentResolver(): ContentResolver = resolver
        }
        CompositionLocalProvider(LocalContext provides context, LocalActivityResultRegistryOwner provides picker) {
            KozmosMaterialTheme { part() }
        }
    }, script = script)

    private fun LiveSemantics.shown() = read().unmerged.flatMap { it.texts }
    private fun LiveSemantics.pick() = read().merged.single { it.click != null && it.texts.isNotEmpty() }.click!!.invoke()
    private suspend fun LiveSemantics.framesUntil(frames: Int = 80, done: () -> Boolean) {
        repeat(frames) {
            if (done()) return
            Thread.sleep(10)
            frames(1)
        }
    }

    @Test fun aFileOverMaxSizeIsRefusedByItsNameAndTheLimitAndNotHeld() {
        val big = doc(1)
        val small = doc(2)
        val documents = Documents(mapOf(big to ("Grundriss.pdf" to 4096L), small to ("Lageplan.pdf" to 100L)))
        val picker = Picker(listOf(listOf(big), listOf(small)))
        val selected = mutableListOf<Uri>()
        upload(documents, picker, { KozmosFileUpload(maxSize = 2048L) { selected += it } }) {
            frames(2)
            pick()
            framesUntil { shown().contains("Grundriss.pdf exceeds 2.0 KB.") }
            assertEquals(listOf("Tap to upload file", "Grundriss.pdf exceeds 2.0 KB."), shown())
            assertEquals("a refused file is not selected", emptyList<Uri>(), selected)
            pick()
            framesUntil { shown() == listOf("Lageplan.pdf") }
            assertEquals("the refusal goes once a file is held", listOf("Lageplan.pdf"), shown())
            assertEquals(listOf(small), selected)
        }
    }

    @Test fun severalFilesArePickedListedAndCounted() {
        val files = (1..3).map { doc(it) }
        val documents = Documents(files.mapIndexed { i, uri -> uri to ("plan-${i + 1}.pdf" to 10L) }.toMap())
        val picker = Picker(listOf(files, files.take(2)))
        val changes = mutableListOf<List<Uri>>()
        upload(documents, picker, {
            KozmosFileUpload(maxFiles = 2, onFilesChange = { changes += it }) {}
        }) {
            frames(2)
            pick()
            framesUntil { shown().contains("Select up to 2 files.") }
            assertEquals(listOf("Tap to upload file", "Select up to 2 files."), shown())
            assertEquals("a refused pick changes nothing", emptyList<List<Uri>>(), changes)
            pick()
            framesUntil { shown() == listOf("plan-1.pdf", "plan-2.pdf") }
            assertEquals(listOf("plan-1.pdf", "plan-2.pdf"), shown())
            assertEquals(listOf(files.take(2)), changes)
            val removes = read().merged.filter { it.description == "Remove" }
            assertEquals("each file has its own remove button", 2, removes.size)
            removes[0].click!!.invoke()
            framesUntil { shown() == listOf("plan-2.pdf") }
            assertEquals(listOf("plan-2.pdf"), shown())
            assertEquals("told the files left", listOf(files[1]), changes.last())
        }
        assertTrue(
            "the picker takes several",
            picker.contracts.all { it is ActivityResultContracts.GetMultipleContents }
        )
    }

    @Test fun theRefusalsAreAProductsOwnWords() {
        val files = (1..2).map { doc(it) }
        val documents = Documents(mapOf(files[0] to ("Grundriss.pdf" to 5000L), files[1] to ("b.pdf" to 1L)))
        val picker = Picker(listOf(files, files.take(1)))
        upload(documents, picker, {
            KozmosFileUpload(
                maxSize = 1024L,
                maxFiles = 1,
                multiple = true,
                tooManyFilesLabel = { "Höchstens $it Datei." },
                tooLargeLabel = { name, limit -> "$name ist größer als $limit." }
            ) {}
        }) {
            frames(2)
            pick()
            framesUntil { shown().contains("Höchstens 1 Datei.") }
            assertEquals(listOf("Tap to upload file", "Höchstens 1 Datei."), shown())
            pick()
            framesUntil { shown().contains("Grundriss.pdf ist größer als 1.0 KB.") }
            assertEquals(listOf("Tap to upload file", "Grundriss.pdf ist größer als 1.0 KB."), shown())
        }
    }

    @Test fun onePickerFileByDefaultAsBefore() {
        val picker = Picker(listOf(listOf(doc(1))))
        upload(Documents(mapOf(doc(1) to ("a.pdf" to 1L))), picker, { KozmosFileUpload {} }) {
            frames(2)
            pick()
            framesUntil { shown() == listOf("a.pdf") }
        }
        assertTrue(picker.contracts.single() is ActivityResultContracts.GetContent)
    }

    @Test fun theLimitsReadAsReacts() {
        assertEquals(1, fileUploadMaxFiles(KozmosFileUploadPreview.None, null, null))
        assertEquals(Int.MAX_VALUE, fileUploadMaxFiles(KozmosFileUploadPreview.None, null, true))
        assertEquals(1, fileUploadMaxFiles(KozmosFileUploadPreview.Image, 5, true))
        assertFalse(fileUploadPicksSeveral(KozmosFileUploadPreview.None, null, null))
        assertTrue(fileUploadPicksSeveral(KozmosFileUploadPreview.None, 3, null))
        assertFalse(fileUploadPicksSeveral(KozmosFileUploadPreview.None, 3, false))
        assertFalse(fileUploadPicksSeveral(KozmosFileUploadPreview.Image, null, true))
        assertEquals("0 B", fileUploadFormatBytes(0))
        assertEquals("512 B", fileUploadFormatBytes(512))
        assertEquals("1.5 KB", fileUploadFormatBytes(1536))
        assertEquals("2.0 MB", fileUploadFormatBytes(2L * 1024 * 1024))
        assertEquals("10 MB", fileUploadFormatBytes(10L * 1024 * 1024))
        // A size the provider does not give refuses nothing.
        assertNull(
            fileUploadRefusal(
                listOf(FileUploadPicked("a.pdf", null)), 1, 10L,
                ::kozmosFileUploadTooManyFiles, ::kozmosFileUploadTooLarge
            )
        )
    }
}
