package com.kozmos.components.tag

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.KozmosEmotion
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosTagVariant {
    Default,
    Secondary,
    Destructive,
    Outline
}

@Composable
fun KozmosTag(
    text: String,
    variant: KozmosTagVariant = KozmosTagVariant.Default,
    /**
     * Unset and the variant draws as it always has; set and the emotion
     * decides the colour, whatever the variant.
     */
    emotion: KozmosEmotion? = null,
    onRemove: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)
    val emotionSurface = emotion?.surface
    val emotionOnSurface = emotion?.onSurface
    val emotionText = emotion?.text
    // Default is the theme fill with the theme foreground on it, the same in
    // both themes (decision 59): background/0 turned its words black on it in
    // the dark.
    val backgroundColor = when (variant) {
        KozmosTagVariant.Default -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
        KozmosTagVariant.Secondary -> KozmosThemeTokens.primitivesColorsBackground100
        KozmosTagVariant.Destructive -> KozmosThemeTokens.semanticsDataRed
        KozmosTagVariant.Outline -> Color.Transparent
    }
    val foregroundColor = when (variant) {
        KozmosTagVariant.Default -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        KozmosTagVariant.Destructive -> KozmosThemeTokens.primitivesColorsBackground0
        KozmosTagVariant.Secondary,
        KozmosTagVariant.Outline -> KozmosThemeTokens.primitivesColorsForeground900
    }
    val resolvedBackground = when {
        emotion == null -> backgroundColor
        variant == KozmosTagVariant.Outline -> Color.Transparent
        else -> emotionSurface!!
    }
    val resolvedForeground = when {
        emotion == null -> foregroundColor
        variant == KozmosTagVariant.Outline -> emotionText!!
        else -> emotionOnSurface!!
    }
    val borderedModifier = if (variant == KozmosTagVariant.Outline) {
        Modifier.border(
            width = 1.dp,
            color = emotionText ?: KozmosThemeTokens.primitivesColorsBackground200,
            shape = shape
        )
    } else {
        Modifier
    }

    Row(
        modifier = modifier
            .background(resolvedBackground, shape)
            .then(borderedModifier)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100, vertical = KozmosDimensions.primitivesLayoutSpacing50),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = text,
            color = resolvedForeground,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
        )
        if (onRemove != null) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Remove",
                tint = foregroundColor,
                modifier = Modifier
                    .padding(start = KozmosDimensions.primitivesLayoutSpacing50)
                    .size(KozmosDimensions.primitivesLayoutSizing200)
                    .clip(CircleShape)
                    .clickable { onRemove() }
            )
        }
    }
}
