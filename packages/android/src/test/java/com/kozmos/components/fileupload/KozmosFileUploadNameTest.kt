package com.kozmos.components.fileupload

import android.content.ContentProvider
import android.content.ContentResolver
import android.content.ContentValues
import android.content.Context
import android.content.ContextWrapper
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.Looper
import android.provider.OpenableColumns
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.activity.result.ActivityResultRegistry
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContract
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalContext
import androidx.core.app.ActivityOptionsCompat
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React shows a picked file by its name (`File.name`, with no fallback of its
 * own), and SwiftUI by its file URL's last component, which on iOS is the
 * file's name. Compose showed the content URI's last segment, which for a
 * document provider's URI is the document's ID ("1742"), not its name:
 * Android gives a file's name as the provider's
 * `OpenableColumns.DISPLAY_NAME`. A provider may answer that over the
 * network, so the part asks off the main thread, shows the last segment
 * until the name arrives, and drops a name that arrives for an earlier pick.
 */
class KozmosFileUploadNameTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** What the system's picker hands back: a document provider's URI, ending in an ID. */
    private val picked = Uri.parse("content://com.example.documents/document/1742")

    /**
     * A document provider that names each document by [names], or by nothing
     * where it has none. A query for a document in [held] waits, up to two
     * seconds, until the test lets it answer. [onMain] says, for each query,
     * whether it ran on the main thread.
     */
    private class Documents(
        private val names: Map<Uri, String>,
        private val held: Map<Uri, CountDownLatch> = emptyMap()
    ) : ContentProvider() {
        private val queries = mutableListOf<Boolean>()
        val onMain: List<Boolean> get() = synchronized(queries) { queries.toList() }

        override fun onCreate() = true
        override fun query(
            uri: Uri,
            projection: Array<out String>?,
            selection: String?,
            selectionArgs: Array<out String>?,
            sortOrder: String?
        ): Cursor {
            synchronized(queries) { queries += Looper.myLooper() == Looper.getMainLooper() }
            held[uri]?.await(2, TimeUnit.SECONDS)
            return MatrixCursor(arrayOf(OpenableColumns.DISPLAY_NAME)).apply {
                names[uri]?.let { addRow(arrayOf(it)) }
            }
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

    /** The system's picker, answering each launch at once with the next of [uris]. */
    private fun picker(vararg uris: Uri) = object : ActivityResultRegistryOwner {
        private var next = 0
        override val activityResultRegistry = object : ActivityResultRegistry() {
            override fun <I, O> onLaunch(
                requestCode: Int,
                contract: ActivityResultContract<I, O>,
                input: I,
                options: ActivityOptionsCompat?
            ) {
                dispatchResult(requestCode, uris[next++])
            }
        }
    }

    /** Composes the part over [documents] and [picker], and runs [script] against it. */
    private fun upload(documents: Documents, picker: ActivityResultRegistryOwner, script: suspend LiveSemantics.() -> Unit) =
        paparazzi.live(durationMillis = 6000, content = {
            val base = LocalContext.current
            val resolver = resolverAnswering(base, documents)
            val context = object : ContextWrapper(base) {
                override fun getContentResolver(): ContentResolver = resolver
            }
            CompositionLocalProvider(
                LocalContext provides context,
                LocalActivityResultRegistryOwner provides picker
            ) {
                KozmosMaterialTheme { KozmosFileUpload(onFileSelected = {}) }
            }
        }, script = script)

    /** The words the part shows. */
    private fun LiveSemantics.shown() = read().unmerged.flatMap { it.texts }

    /** Taps the upload area: the one control with words and a click. */
    private fun LiveSemantics.pick() = read().merged.single { it.click != null && it.texts.isNotEmpty() }.click!!.invoke()

    /** Frames, with the real time a lookup on another thread needs, until [done] or [frames] run out. */
    private suspend fun LiveSemantics.framesUntil(frames: Int = 60, done: () -> Boolean) {
        repeat(frames) {
            if (done()) return
            Thread.sleep(10)
            frames(1)
        }
    }

    /** Picks [picked] from a provider that names it [name], and returns the words then shown. */
    private fun shownAfterPicking(name: String?, uri: Uri = picked): List<String> {
        var shown = emptyList<String>()
        val documents = Documents(names = listOfNotNull(name?.let { uri to it }).toMap())
        upload(documents, picker(uri)) {
            frames(2)
            pick()
            framesUntil { documents.onMain.isNotEmpty() && shown() != listOf(uri.lastPathSegment.orEmpty()) }
            frames(3)
            shown = shown()
        }
        return shown
    }

    @Test fun aPickedFileIsShownByTheNameItsProviderGivesIt() {
        assertEquals(listOf("Grundriss Ebene 2.pdf"), shownAfterPicking("Grundriss Ebene 2.pdf"))
    }

    @Test fun aProviderThatGivesNoNameLeavesTheUrisLastSegment() {
        assertEquals(listOf("1742"), shownAfterPicking(null))
    }

    @Test fun aFileWithNoNameAndNoSegmentIsShownByNoWordsOfKozmos() {
        // As React shows a nameless File by its empty name: no fixed English.
        val quoted = shownAfterPicking(null, Uri.parse("content://com.example.documents")).map { "\"$it\"" }
        assertEquals("the words shown", listOf("\"\""), quoted)
    }

    @Test fun theNameIsAskedForOffTheMainThread() {
        val documents = Documents(names = mapOf(picked to "Grundriss Ebene 2.pdf"))
        upload(documents, picker(picked)) {
            frames(2)
            pick()
            framesUntil { shown() == listOf("Grundriss Ebene 2.pdf") }
            assertEquals("for each query, whether it ran on the main thread", listOf(false), documents.onMain)
        }
    }

    @Test fun aNameThatArrivesForAnEarlierPickIsDropped() {
        val earlier = Uri.parse("content://com.example.documents/document/1742")
        val later = Uri.parse("content://com.example.documents/document/1743")
        val slow = CountDownLatch(1)
        val documents = Documents(
            names = mapOf(earlier to "Grundriss Ebene 2.pdf", later to "Lageplan.pdf"),
            held = mapOf(earlier to slow)
        )
        upload(documents, picker(earlier, later)) {
            frames(2)
            pick()
            frames(3)
            // The earlier name is still on its way: the last segment shows.
            assertEquals("while the earlier name is on its way", listOf("1742"), shown())
            // Removed, and picked again; the later name arrives first.
            read().merged.single { it.description == "Remove" }.click!!.invoke()
            frames(2)
            pick()
            framesUntil { shown() == listOf("Lageplan.pdf") }
            assertEquals("once the later name arrives", listOf("Lageplan.pdf"), shown())
            // Then the earlier pick's name arrives, and is dropped.
            slow.countDown()
            framesUntil(frames = 20) { false }
            assertEquals("once the earlier name arrives too", listOf("Lageplan.pdf"), shown())
        }
    }
}
