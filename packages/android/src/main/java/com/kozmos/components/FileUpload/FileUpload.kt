package com.kozmos.components.fileupload

import com.kozmos.tokens.KozmosDimensions

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun KozmosFileUpload(
    modifier: Modifier = Modifier,
    onFileSelected: (Uri) -> Unit
) {
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

    if (fileName != null) {
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
            IconButton(onClick = {
                latest.incrementAndGet()
                fileName = null
            }) {
                Icon(Icons.Default.Close, contentDescription = "Remove")
            }
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
                .clickable { launcher.launch("*/*") },
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
                text = "Tap to upload file",
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
