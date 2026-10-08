package com.kozmos.components.fileupload

import com.kozmos.tokens.KozmosDimensions

import android.net.Uri
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

@Composable
fun KozmosFileUpload(
    modifier: Modifier = Modifier,
    onFileSelected: (Uri) -> Unit
) {
    var fileName by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            fileName = it.lastPathSegment ?: "Selected File" // Simplified name getting
            onFileSelected(it)
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
            IconButton(onClick = { fileName = null }) {
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
                tint = KozmosThemeTokens.primitivesColorsForeground500
            )
            Spacer(modifier = Modifier.height(KozmosDimensions.primitivesLayoutSpacing100))
            Text(
                text = "Tap to upload file",
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                color = KozmosThemeTokens.primitivesColorsForeground500
            )
        }
    }
}
