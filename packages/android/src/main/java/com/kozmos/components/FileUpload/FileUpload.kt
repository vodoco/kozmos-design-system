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
    onFileSelected: (Uri) -> Unit
) {
    val words = fileUploadBrowseLabel(browseLabel, variant)
    var file by remember { mutableStateOf<Uri?>(null) }
    var fileName by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    // Which pick, or removal, is the latest: a name that arrives for an
    // earlier one is dropped.
    val latest = remember { AtomicInteger() }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            // The file's own name, as React shows a File's name. The URI's last
            // segment shows until it arrives, and stays where the provider
            // gives none: for a document provider's URI it is the document's
            // ID, not its name. It was all this showed until 2026-10-20. With
            // neither, nothing, as React shows a nameless File: the fixed
            // English "Selected File" it fell back to is gone.
            val pick = latest.incrementAndGet()
            file = it
            fileName = it.lastPathSegment.orEmpty()
            onFileSelected(it)
            val resolver = context.contentResolver
            // Asked off the main thread: a provider may answer over the network.
            scope.launch {
                val name = withContext(Dispatchers.IO) { displayNameOf(resolver, it) }
                if (name != null && latest.get() == pick) fileName = name
            }
        }
    }

    val remove: () -> Unit = {
        latest.incrementAndGet()
        val removed = file
        file = null
        fileName = null
        if (removed != null) onFileRemoved?.invoke(removed)
    }
    val pickerInput = fileUploadPickerInput(preview)

    val shown = file
    if (preview == KozmosFileUploadPreview.Image && fileName != null && shown != null) {
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
                text = fileName!!,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground100,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            KozmosButton(
                onClick = { launcher.launch(pickerInput) },
                variant = KozmosButtonVariant.Outline,
                size = KozmosButtonSize.Sm
            ) {
                Text(changeLabel)
            }
            IconButton(onClick = remove) {
                Icon(Icons.Default.Close, contentDescription = removeLabel)
            }
        }
    } else if (fileName != null) {
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
                text = fileName!!,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground100
            )
            IconButton(onClick = remove) {
                Icon(Icons.Default.Close, contentDescription = removeLabel)
            }
        }
    } else if (variant == KozmosFileUploadVariant.Button) {
        // In place of the drop area: the outline Button, opening the same
        // picker for the same files (GAP-274).
        KozmosButton(
            onClick = { launcher.launch(pickerInput) },
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
                .clickable { launcher.launch(pickerInput) },
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
