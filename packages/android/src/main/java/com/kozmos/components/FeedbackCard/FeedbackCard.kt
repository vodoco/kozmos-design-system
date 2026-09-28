package com.kozmos.components.feedbackcard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.rating.KozmosRating
import com.kozmos.components.input.KozmosWashedField
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground

/**
 * [surface] is what the card is made of, as React's `surface` prop:
 * [KozmosSurfaceStyle.Solid] (the default) or [KozmosSurfaceStyle.Glass], for a
 * card over the map. Until 2026-09-22 Compose drew it solid only.
 */
@Composable
fun KozmosFeedbackCard(
    modifier: Modifier = Modifier,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    title: String = "Rate your experience",
    description: String = "How was your navigation today?",
    isSubmitting: Boolean = false,
    successMessage: String = "Thank you for the feedback!",
    onSubmitFeedback: ((Int, String) -> Unit)? = null
) {
    val trackEvent = LocalKozmosAnalytics.current
    var rating by remember { mutableStateOf(0) }
    var comment by remember { mutableStateOf("") }
    var submitted by remember { mutableStateOf(false) }

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel),
        // The solid surface React's card sits on by default, themed: the
        // background with the subtle border. It was the background at 90 %
        // under a near-black hairline at 8 % until 2026-09-22.
        color = KozmosSurfaceDefaults.tint(surface),
        tonalElevation = 6.dp,
        shadowElevation = 12.dp,
        border = KozmosSurfaceDefaults.border(surface)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200),
            modifier = Modifier
                .fillMaxWidth()
                .padding(KozmosDimensions.primitivesLayoutSpacing300)
        ) {
            if (submitted) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = KozmosThemeTokens.primitivesColorsEmotionalSuccess600,
                    modifier = Modifier.size(48.dp)
                )
                Text(
                    text = successMessage,
                    style = MaterialTheme.typography.titleMedium,
                    color = KozmosThemeTokens.primitivesColorsForeground100,
                    textAlign = TextAlign.Center
                )
            } else {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = KozmosThemeTokens.primitivesColorsForeground100,
                    textAlign = TextAlign.Center
                )
                // Muted, and on glass the foreground colour (decision 48).
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = kozmosMutedForeground(surface),
                    textAlign = TextAlign.Center
                )

                KozmosRating(value = rating, onValueChange = { rating = it })

                // Washed, as React's comment box is, not the outlined text
                // area: it was the standard one, 96 high, until 2026-09-22.
                KozmosWashedField(
                    value = comment,
                    onValueChange = { comment = it },
                    placeholder = "Tell us more about your experience...",
                    modifier = Modifier.fillMaxWidth(),
                    multiline = true
                )

                KozmosButton(
                    onClick = {
                        trackEvent(KozmosAnalyticsEvent(component = "FeedbackCard", eventName = "feedback_submitted", properties = mapOf("rating" to rating.toString())))
                        onSubmitFeedback?.invoke(rating, comment)
                        submitted = true
                    },
                    enabled = rating > 0 && !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(if (isSubmitting) "Submitting..." else "Submit Feedback")
                }
            }
        }
    }
}
