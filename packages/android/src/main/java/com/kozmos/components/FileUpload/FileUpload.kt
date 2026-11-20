package com.kozmos.components.fileupload

import com.kozmos.tokens.KozmosDimensions

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.tokens.KozmosThemeTokens
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** What FileUpload shows of the file it holds, as React's `preview` prop. */
enum class KozmosFileUploadPreview {
    /** The file's name, with a remove button. */
    None,

    /**
     * One image, shown once chosen as an avatar-sized thumbnail beside its
     * name, with Change and Remove (GAP-270). The picker offers images only.
     */
    Image
}

/**
 * What the visitor picks with, as React's FileUpload `variant` (GAP-274).
 */
enum class KozmosFileUploadVariant {
    /** The drop area, the default. */
    Dropzone,

    /**
     * A Button-sized trigger: the outline KozmosButton with the upload icon
     * and the browse label ("Choose file" unless the product passes its own,
     * such as "Add logo"), for a field with no room for a drop area. It opens
     * the same picker, offering what the drop area offers, and shows what was
     * chosen, or the image preview, as the drop area does.
     */
    Button
}

/** What the picker is asked for: images only with the image preview, as React's `accept`. */
internal fun fileUploadPickerInput(preview: KozmosFileUploadPreview): String =
    if (preview == KozmosFileUploadPreview.Image) "image/*" else "*/*"

/** React's refusal of a pick past `maxFiles`: "Select up to 3 files." (GAP-280). */
fun kozmosFileUploadTooManyFiles(maxFiles: Int): String =
    "Select up to $maxFiles ${if (maxFiles == 1) "file" else "files"}."

/** React's refusal of a file over `maxSize`: "plan.pdf exceeds 2.0 MB." (GAP-280). */
fun kozmosFileUploadTooLarge(fileName: String, maxSize: String): String = "$fileName exceeds $maxSize."

/** A size as React's FileUpload writes it: "0 B", "512 B", "2.0 KB", "10 MB". */
internal fun fileUploadFormatBytes(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val units = listOf("B", "KB", "MB", "GB")
    val exponent = minOf(
        kotlin.math.floor(kotlin.math.ln(bytes.toDouble()) / kotlin.math.ln(1024.0)).toInt(),
        units.size - 1
    )
    val value = bytes / Math.pow(1024.0, exponent.toDouble())
    val digits = if (value >= 10 || exponent == 0) 0 else 1
    return String.format(java.util.Locale.ROOT, "%.${digits}f", value) + " " + units[exponent]
}

/**
 * How many files a pick may hold: one for an image preview, [maxFiles], or
 * with neither, any number with [multiple] and one without, as React's.
 */
internal fun fileUploadMaxFiles(preview: KozmosFileUploadPreview, maxFiles: Int?, multiple: Boolean?): Int =
    if (preview == KozmosFileUploadPreview.Image) 1 else maxFiles ?: if (multiple == true) Int.MAX_VALUE else 1

/** Whether the picker takes several files: [multiple] when given, else when the count allows. */
internal fun fileUploadPicksSeveral(preview: KozmosFileUploadPreview, maxFiles: Int?, multiple: Boolean?): Boolean =
    preview != KozmosFileUploadPreview.Image && (multiple ?: (fileUploadMaxFiles(preview, maxFiles, multiple) > 1))

/** A picked file as the refusal reads it: its name and its size in bytes, either unknown. */
internal data class FileUploadPicked(val name: String, val size: Long?)

/**
 * Why a pick is turned away, or null: past the count first, then the first
 * file over [maxSize], as React checks them. A size that cannot be read
 * refuses nothing.
 */
internal fun fileUploadRefusal(
    picked: List<FileUploadPicked>,
    maxFiles: Int,
    maxSize: Long?,
    tooManyFilesLabel: (Int) -> String,
    tooLargeLabel: (String, String) -> String
): String? {
    if (picked.size > maxFiles) return tooManyFilesLabel(maxFiles)
    if (maxSize != null) {
        picked.firstOrNull { (it.size ?: 0L) > maxSize }?.let {
            return tooLargeLabel(it.name, fileUploadFormatBytes(maxSize))
        }
    }
    return null
}

/** The words that open the picker: the product's own, or each form's own default. */
internal fun fileUploadBrowseLabel(browseLabel: String?, variant: KozmosFileUploadVariant): String =
    browseLabel ?: if (variant == KozmosFileUploadVariant.Button) "Choose file" else "Tap to upload file"

@Composable
fun KozmosFileUpload(
    modifier: Modifier = Modifier,
    /**
     * The words that open the picker, as React's `browseLabel`: "Tap to
     * upload file" on the drop area, "Choose file" on
     * [KozmosFileUploadVariant.Button]; a product passes its own, such as
     * "Add logo", or its translation.
     */
    browseLabel: String? = null,
    /**
     * The remove button's spoken name. "Remove" by default; a product that
     * translates passes its own.
     */
    removeLabel: String = "Remove",
    /** [KozmosFileUploadPreview.Image] shows the chosen image; see there. */
    preview: KozmosFileUploadPreview = KozmosFileUploadPreview.None,
    /**
     * The Change button's words in an image preview, "Change" by default; it
     * opens the picker again.
     */
    changeLabel: String = "Change",
    /** The thumbnail's content description; the file's name by default. */
    previewAlt: String? = null,
    /**
     * Told the file the visitor removed, as React's `onFilesChange` is told
     * the files left. The new parameters come before [onFileSelected], so a
     * trailing lambda is still [onFileSelected].
     */
    onFileRemoved: ((Uri) -> Unit)? = null,
    /**
     * [KozmosFileUploadVariant.Button] is the button form (GAP-274); the drop
     * area is the default. Before [onFileSelected], so a trailing lambda is
     * still [onFileSelected].
     */
    variant: KozmosFileUploadVariant = KozmosFileUploadVariant.Dropzone,
    /**
     * The largest file, in bytes, as React's `maxSize` (GAP-280): a larger
     * one is turned away with [tooLargeLabel], the files held staying.
     */
    maxSize: Long? = null,
    /**
     * How many files one pick may hold, as React's `maxFiles`: more are
     * turned away with [tooManyFilesLabel]. One by default, any number with
     * [multiple].
     */
    maxFiles: Int? = null,
    /**
     * Whether the picker takes several files, as React's `multiple`; unset,
     * it does when [maxFiles] is over 1. Each file held is listed with its
     * own remove button.
     */
    multiple: Boolean? = null,
    /** The refusal of a pick past [maxFiles], given the count; React's English by default. */
    tooManyFilesLabel: (Int) -> String = ::kozmosFileUploadTooManyFiles,
    /**
     * The refusal of a file over [maxSize], given its name and the limit as
     * written ("2.0 MB"); React's English by default.
     */
    tooLargeLabel: (String, String) -> String = ::kozmosFileUploadTooLarge,
    /** Told the files held after each pick or removal, as React's `onFilesChange`. */
    onFilesChange: ((List<Uri>) -> Unit)? = null,
    onFileSelected: (Uri) -> Unit
) {
    val words = fileUploadBrowseLabel(browseLabel, variant)
    // The files held, each with the name shown for it.
    var held by remember { mutableStateOf<List<Pair<Uri, String>>>(emptyList()) }
    // Why the last pick was turned away, said under the part as React's
    // field error is (GAP-280).
    var refusal by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    // Which pick, or removal, is the latest: a name that arrives for an
    // earlier one is dropped.
    val latest = remember { AtomicInteger() }
    val countLimit = fileUploadMaxFiles(preview, maxFiles, multiple)

    val hold: (List<Uri>) -> Unit = { uris ->
        // The file's own name, as React shows a File's name. The URI's last
        // segment shows until it arrives, and stays where the provider
        // gives none: for a document provider's URI it is the document's
        // ID, not its name. It was all this showed until 2026-10-20. With
        // neither, nothing, as React shows a nameless File: the fixed
        // English "Selected File" it fell back to is gone.
        val pick = latest.incrementAndGet()
        refusal = null
        held = uris.map { it to it.lastPathSegment.orEmpty() }
        onFilesChange?.invoke(uris)
        onFileSelected(uris.first())
        val resolver = context.contentResolver
        // Asked off the main thread: a provider may answer over the network.
        uris.forEach { uri ->
            scope.launch {
                val name = withContext(Dispatchers.IO) { displayNameOf(resolver, uri) }
                if (name != null && latest.get() == pick) {
                    held = held.map { if (it.first == uri) uri to name else it }
                }
            }
        }
    }

    val receive: (List<Uri>) -> Unit = receive@{ uris ->
        if (uris.isEmpty()) return@receive
        if (uris.size > countLimit) {
            refusal = tooManyFilesLabel(countLimit)
            return@receive
        }
        if (maxSize == null) {
            hold(uris)
            return@receive
        }
        // The sizes, and the names a refusal says, from the provider, off
        // the main thread, before a file over the size is held.
        val resolver = context.contentResolver
        val pick = latest.incrementAndGet()
        scope.launch {
            val picked = withContext(Dispatchers.IO) {
                uris.map { uri ->
                    val (name, size) = metadataOf(resolver, uri)
                    FileUploadPicked(name ?: uri.lastPathSegment.orEmpty(), size)
                }
            }
            if (latest.get() != pick) return@launch
            val reason = fileUploadRefusal(picked, countLimit, maxSize, tooManyFilesLabel, tooLargeLabel)
            if (reason != null) refusal = reason else hold(uris)
        }
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? -> uri?.let { receive(listOf(it)) } }
    val severalLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> -> receive(uris) }
    val picksSeveral = fileUploadPicksSeveral(preview, maxFiles, multiple)

    val removeFile: (Uri) -> Unit = { removed ->
        latest.incrementAndGet()
        held = held.filterNot { it.first == removed }
        refusal = null
        onFilesChange?.invoke(held.map { it.first })
        onFileRemoved?.invoke(removed)
    }
    val pickerInput = fileUploadPickerInput(preview)
    val openPicker: () -> Unit = {
        if (picksSeveral) severalLauncher.launch(pickerInput) else launcher.launch(pickerInput)
    }

    // The refusal goes under the part: the column adds no box of its own,
    // and the part keeps the caller's modifier, as it always had.
    Column {
        FileUploadBody(
            modifier = modifier,
            held = held,
            preview = preview,
            variant = variant,
            words = words,
            removeLabel = removeLabel,
            changeLabel = changeLabel,
            previewAlt = previewAlt,
            openPicker = openPicker,
            removeFile = removeFile
        )
        refusal?.let {
            Text(
                text = it,
                modifier = Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing75),
                style = MaterialTheme.typography.bodySmall,
                color = KozmosThemeTokens.primitivesColorsEmotionalDanger600
            )
        }
    }
}

@Composable
private fun FileUploadBody(
    modifier: Modifier,
    held: List<Pair<Uri, String>>,
    preview: KozmosFileUploadPreview,
    variant: KozmosFileUploadVariant,
    words: String,
    removeLabel: String,
    changeLabel: String,
    previewAlt: String?,
    openPicker: () -> Unit,
    removeFile: (Uri) -> Unit
) {
    val first = held.firstOrNull()
    if (preview == KozmosFileUploadPreview.Image && first != null) {
        val (shown, fileName) = first
        val remove = { removeFile(shown) }
        Row(
            modifier = modifier
                .fillMaxWidth()
                .padding(KozmosDimensions.primitivesLayoutSpacing100)
                .border(1.dp, KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                .padding(KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar-sized and round, as KozmosAvatar: the muted fill shows
            // until the image has drawn over it.
            Box(
                modifier = Modifier
                    .size(KozmosDimensions.primitivesLayoutSizing500)
                    .clip(CircleShape)
                    .background(KozmosThemeTokens.primitivesColorsBackground300)
            ) {
                AsyncImage(
                    model = shown,
                    contentDescription = previewAlt ?: fileName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.matchParentSize()
                )
            }
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing150))
            Text(
                text = fileName,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground100,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            KozmosButton(
                onClick = openPicker,
                variant = KozmosButtonVariant.Outline,
                size = KozmosButtonSize.Sm
            ) {
                Text(changeLabel)
            }
            IconButton(onClick = remove) {
                Icon(Icons.Default.Close, contentDescription = removeLabel)
            }
        }
    } else if (held.size == 1) {
        FileUploadRow(modifier, first!!.second, removeLabel) { removeFile(first.first) }
    } else if (held.isNotEmpty()) {
        // Each file held, with its own remove button (GAP-280).
        Column(modifier = modifier) {
            held.forEach { (uri, name) ->
                FileUploadRow(Modifier, name, removeLabel) { removeFile(uri) }
            }
        }
    } else if (variant == KozmosFileUploadVariant.Button) {
        // In place of the drop area: the outline Button, opening the same
        // picker for the same files (GAP-274).
        KozmosButton(
            onClick = openPicker,
            modifier = modifier,
            variant = KozmosButtonVariant.Outline
        ) {
            Icon(
                Icons.Default.UploadFile,
                contentDescription = null,
                modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing200)
            )
            // The Button's own row spaces the icon 8 from the words.
            Text(words)
        }
    } else {
        Column(
            modifier = modifier
                .fillMaxWidth()
                .height(120.dp)
                .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                .border(
                    width = 2.dp,
                    color = KozmosThemeTokens.primitivesColorsBackground300,
                    shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
                    // Note: Dashed border support in Compose often requires custom Canvas drawing
                    // We'll stick to solid for now or implement custom modifier later if needed
                )
                .clickable(onClick = openPicker),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.UploadFile, 
                contentDescription = null, 
                modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing400),
                tint = KozmosThemeTokens.primitivesColorsForeground400
            )
            Spacer(modifier = Modifier.height(KozmosDimensions.primitivesLayoutSpacing100))
            Text(
                text = words,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                color = KozmosThemeTokens.primitivesColorsForeground400
            )
        }
    }
}

/** One file held: its icon, its name and its remove button. */
@Composable
private fun FileUploadRow(modifier: Modifier, fileName: String, removeLabel: String, remove: () -> Unit) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(KozmosDimensions.primitivesLayoutSpacing100)
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .padding(KozmosDimensions.primitivesLayoutSpacing150),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // An icon on a surface: theme/600 (decision 59).
        Icon(Icons.Default.UploadFile, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsTheme600)
        Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
        Text(
            text = fileName,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.bodyMedium,
            color = KozmosThemeTokens.primitivesColorsForeground100
        )
        IconButton(onClick = remove) {
            Icon(Icons.Default.Close, contentDescription = removeLabel)
        }
    }
}

/**
 * The name and the size, in bytes, the provider that holds a picked file
 * gives it (`OpenableColumns.DISPLAY_NAME` and `SIZE`), each null where it
 * gives none, for any URI not a content URI, and for a provider that fails.
 */
private fun metadataOf(resolver: ContentResolver, uri: Uri): Pair<String?, Long?> {
    if (uri.scheme != ContentResolver.SCHEME_CONTENT) return null to null
    return runCatching {
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
            if (!cursor.moveToFirst()) return@use null to null
            val nameColumn = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            val sizeColumn = cursor.getColumnIndex(OpenableColumns.SIZE)
            val name = if (nameColumn >= 0) cursor.getString(nameColumn)?.takeIf { it.isNotBlank() } else null
            val size = if (sizeColumn >= 0 && !cursor.isNull(sizeColumn)) cursor.getLong(sizeColumn) else null
            name to size
        }
    }.getOrNull() ?: (null to null)
}

/**
 * The name the provider that holds a picked file gives it
 * (`OpenableColumns.DISPLAY_NAME`), the platform's way to name a content URI;
 * null for any other URI, and for a provider that gives none or fails.
 */
private fun displayNameOf(resolver: ContentResolver, uri: Uri): String? {
    if (uri.scheme != ContentResolver.SCHEME_CONTENT) return null
    return runCatching {
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            val column = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (column >= 0 && cursor.moveToFirst()) cursor.getString(column) else null
        }
    }.getOrNull()?.takeIf { it.isNotBlank() }
}
