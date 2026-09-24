package com.kozmos.components.button

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Color
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosButtonVariant {
    Default,
    Destructive,
    Outline,
    Secondary,
    Ghost,
    Link,
    Glass
}

enum class KozmosButtonEmotion {
    Themed,
    Neutral,
    Success,
    Danger,
    Informative,
    Alert
}

enum class KozmosButtonSize {
    Default,
    Sm,
    Lg,
    Icon
}

// The emotion decides the colour where the variant has a tier: Primary is
// filled, Secondary is bordered or text. Glass is an effect and keeps its
// own ground.
@Composable
private fun emotionPrimaryBackground(e: KozmosButtonEmotion): Color = when (e) {
    KozmosButtonEmotion.Themed -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    KozmosButtonEmotion.Neutral -> KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundIdle
    KozmosButtonEmotion.Success -> KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundIdle
    KozmosButtonEmotion.Danger -> KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundIdle
    KozmosButtonEmotion.Informative -> KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonBackgroundIdle
    KozmosButtonEmotion.Alert -> KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle
}

@Composable
private fun emotionPrimaryForeground(e: KozmosButtonEmotion): Color = when (e) {
    KozmosButtonEmotion.Themed -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    KozmosButtonEmotion.Neutral -> KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
    KozmosButtonEmotion.Success -> KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonForegroundContentIdle
    KozmosButtonEmotion.Danger -> KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentIdle
    KozmosButtonEmotion.Informative -> KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonForegroundContentIdle
    KozmosButtonEmotion.Alert -> KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentIdle
}

@Composable
private fun emotionSecondaryForeground(e: KozmosButtonEmotion): Color = when (e) {
    KozmosButtonEmotion.Themed -> KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
    KozmosButtonEmotion.Neutral -> KozmosThemeTokens.componentsSecondaryButtonsNeutralButtonForegroundContentIdle
    KozmosButtonEmotion.Success -> KozmosThemeTokens.componentsSecondaryButtonsSuccessButtonForegroundContentIdle
    KozmosButtonEmotion.Danger -> KozmosThemeTokens.componentsSecondaryButtonsDangerButtonForegroundContentIdle
    KozmosButtonEmotion.Informative -> KozmosThemeTokens.componentsSecondaryButtonsInformativeButtonForegroundContentIdle
    KozmosButtonEmotion.Alert -> KozmosThemeTokens.componentsSecondaryButtonsAlertButtonForegroundContentIdle
}

@Composable
fun KozmosButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosButtonVariant = KozmosButtonVariant.Default,
    emotion: KozmosButtonEmotion? = null,
    size: KozmosButtonSize = KozmosButtonSize.Default,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    content: @Composable RowScope.() -> Unit
) {
    val height = when (size) {
        KozmosButtonSize.Default -> 44.dp
        KozmosButtonSize.Sm -> 44.dp
        KozmosButtonSize.Lg -> 44.dp
        KozmosButtonSize.Icon -> 44.dp
    }

    val rootModifier = modifier
        .height(height)
        .then(if (size == KozmosButtonSize.Icon) Modifier.width(44.dp) else Modifier)
    
    val contentPadding = when (size) {
        KozmosButtonSize.Default -> PaddingValues(horizontal = KozmosDimensions.primitivesLayoutSpacing200, vertical = 0.dp)
        KozmosButtonSize.Sm -> PaddingValues(horizontal = KozmosDimensions.primitivesLayoutSpacing150, vertical = 0.dp)
        KozmosButtonSize.Lg -> PaddingValues(horizontal = KozmosDimensions.primitivesLayoutSpacing400, vertical = 0.dp)
        KozmosButtonSize.Icon -> PaddingValues(0.dp)
    }

    // Dimension token graph synced from build.mjs
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)

    when (variant) {
        KozmosButtonVariant.Outline -> {
            val outlineColor = if (emotion != null) emotionSecondaryForeground(emotion)
                else KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
            OutlinedButton(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                shape = shape,
                contentPadding = contentPadding,
                border = BorderStroke(1.dp, outlineColor),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = outlineColor)
            ) {
                ButtonContent(isLoading, content)
            }
        }
        KozmosButtonVariant.Ghost, KozmosButtonVariant.Link -> {
            val textColor = if (emotion != null) emotionSecondaryForeground(emotion)
                else KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
            TextButton(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                shape = shape,
                contentPadding = contentPadding,
                colors = ButtonDefaults.textButtonColors(contentColor = textColor)
            ) {
                ButtonContent(isLoading, content)
            }
        }
        else -> {
            // Default, Destructive, Secondary, Glass
            val containerColor = if (emotion != null && variant != KozmosButtonVariant.Glass) emotionPrimaryBackground(emotion) else when(variant) {
                KozmosButtonVariant.Destructive -> KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundIdle
                KozmosButtonVariant.Secondary -> KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundIdle
                // The glass variant is the glass surface, composed from the token.
                KozmosButtonVariant.Glass -> KozmosSurfaceDefaults.tint(KozmosSurfaceStyle.Glass)
                else -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
            }
            
            val contentColor = if (emotion != null && variant != KozmosButtonVariant.Glass) emotionPrimaryForeground(emotion) else when(variant) {
                 KozmosButtonVariant.Secondary -> KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
                 KozmosButtonVariant.Destructive -> KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentIdle
                 KozmosButtonVariant.Glass -> KozmosThemeTokens.primitivesColorsForeground100
                 else -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
            }
            
            Button(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                shape = shape,
                contentPadding = contentPadding,
                colors = ButtonDefaults.buttonColors(
                    containerColor = containerColor,
                    contentColor = contentColor
                ),
                border = if (variant == KozmosButtonVariant.Glass) KozmosSurfaceDefaults.border(KozmosSurfaceStyle.Glass) else null
            ) {
                ButtonContent(isLoading, content)
            }
        }
    }
}

@Composable
private fun RowScope.ButtonContent(
    isLoading: Boolean,
    content: @Composable RowScope.() -> Unit
) {
    // GAP-56: the loader and the caller's children keep 8 apart, as Figma's Button (itemSpacing
    // 8) and iOS's (HStack spacing 100) do. Both used to touch the label.
    Row(
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(14.dp),
                color = LocalContentColor.current,
                strokeWidth = 2.dp
            )
        }
        content()
    }
}
