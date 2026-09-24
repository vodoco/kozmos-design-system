package com.kozmos.components.stepper

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosStepper(
    steps: List<String>,
    currentStep: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        steps.forEachIndexed { index, step ->
            val isCompleted = index < currentStep
            val isCurrent = index == currentStep
            
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
            ) {
                Box(
                    modifier = Modifier
                        .size(KozmosDimensions.primitivesLayoutSizing400)
                        .clip(CircleShape)
                        // React's primary pair: theme/600 with foreground/1000
                        // on it, the current number in ink. It was theme/500
                        // with background/0: black on the blue in the dark.
                        .background(if (isCompleted) KozmosThemeTokens.primitivesColorsTheme600 else Color.Transparent)
                        // 2 for the current and completed steps, 1 for a
                        // pending one, as the plugin paints them and React
                        // draws them. Every step was 2 until 2026-09-22.
                        .border(
                            width = if (isCompleted || isCurrent) KozmosDimensions.primitivesLayoutSpacing25 else 1.dp,
                            color = if (isCompleted || isCurrent) KozmosThemeTokens.primitivesColorsTheme600 else KozmosThemeTokens.primitivesColorsForeground500,
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (isCompleted) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = KozmosThemeTokens.primitivesColorsForeground1000,
                            modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing200)
                        )
                    } else {
                        Text(
                            text = (index + 1).toString(),
                            style = MaterialTheme.typography.labelMedium,
                            color = if (isCurrent) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground400
                        )
                    }
                }
                
                // React's label: the current step's in the foreground at medium
                // weight, every other in the muted foreground, foreground/400
                // (4.8:1 even on a sheet's grey). It was foreground/100 and /500
                // until 2026-09-22.
                Text(
                    text = step,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = if (isCurrent) FontWeight.Medium else FontWeight.Normal,
                    color = if (isCurrent) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground400
                )
            }
            
            if (index < steps.size - 1) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(KozmosDimensions.primitivesLayoutSpacing25)
                        .background(if (index < currentStep) KozmosThemeTokens.primitivesColorsTheme600 else KozmosThemeTokens.semanticsBorderSubtle)
                )
            }
        }
    }
}
