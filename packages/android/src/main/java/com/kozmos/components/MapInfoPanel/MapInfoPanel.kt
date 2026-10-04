package com.kozmos.components.mapinfopanel

import androidx.compose.foundation.background
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.kozmos.components.accordion.*
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.utils.kozmosSafeLink

data class KozmosMapInfoEntry(val id: String, val label: String, val href: String? = null) {
    internal val destination: String? get() = kozmosSafeLink(href, contact = true)
}
data class KozmosMapInfoFAQ(val id: String, val question: String, val answer: String)
data class KozmosMapInfoVersion(val id: String, val label: String, val value: String)
/** Localized content, supplied by the host. No default legal copy or inferred provider. */
data class KozmosMapInfoContent(val title: String, val introduction: String? = null, val faqs: List<KozmosMapInfoFAQ> = emptyList(), val credits: List<KozmosMapInfoEntry> = emptyList(), val links: List<KozmosMapInfoEntry> = emptyList(), val versions: List<KozmosMapInfoVersion> = emptyList())
internal object KozmosMapInfoLayout {
    const val panelWidth = 384f
    fun isWide(width: Float) = width >= 720f + panelWidth
}

@Composable
fun KozmosMapInfoPanel(content: KozmosMapInfoContent, onClose: () -> Unit, modifier: Modifier = Modifier, brand: (@Composable () -> Unit)? = null, closeLabel: String = "Close information", faqLabel: String = "Frequently asked questions", copyrightLabel: String = "Copyright", expandedFAQ: String? = null, onExpandedFAQChange: ((String?) -> Unit)? = null) {
    var localFAQ by remember { mutableStateOf<String?>(null) }
    val selectedFAQ = if (onExpandedFAQChange != null) expandedFAQ else localFAQ
    val selectFAQ: (String?) -> Unit = { if (onExpandedFAQChange != null) onExpandedFAQChange(it) else localFAQ = it }
    Column(modifier.background(KozmosThemeTokens.primitivesColorsBackground0).padding(KozmosDimensions.primitivesLayoutSpacing300), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)) {
        Row(verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)) {
                if (brand != null) Box(Modifier.widthIn(max = 160.dp).heightIn(max = 48.dp)) { brand() }
                Text(content.title, style = MaterialTheme.typography.titleLarge, color = KozmosThemeTokens.primitivesColorsForeground100, modifier = Modifier.semantics { heading() })
            }
            KozmosIconButton(Icons.Outlined.Close, onClick = onClose, contentDescription = closeLabel)
        }
        content.introduction?.takeIf { it.isNotEmpty() }?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = KozmosThemeTokens.primitivesColorsForeground500) }
        if (content.faqs.isNotEmpty()) {
            Text(faqLabel, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
            KozmosAccordion {
                content.faqs.forEach { faq ->
                    key(faq.id) {
                        KozmosAccordionItem {
                            KozmosAccordionTrigger(value = faq.id, selectedValue = selectedFAQ, onValueChange = selectFAQ, title = faq.question,
                                modifier = Modifier.clearAndSetSemantics {
                                    contentDescription = faq.question
                                    role = Role.Button
                                    onClick { selectFAQ(if (selectedFAQ == faq.id) null else faq.id); true }
                                    if (selectedFAQ == faq.id) collapse { selectFAQ(null); true } else expand { selectFAQ(faq.id); true }
                                })
                            KozmosAccordionContent(value = faq.id, selectedValue = selectedFAQ) { Text(faq.answer, style = MaterialTheme.typography.bodyMedium) }
                        }
                    }
                }
            }
        }
        if (content.credits.isNotEmpty() || content.links.isNotEmpty() || content.versions.isNotEmpty()) {
            Spacer(Modifier.height(KozmosDimensions.primitivesLayoutSpacing400).weight(1f))
            Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
                if (content.credits.isNotEmpty()) {
                    Text(copyrightLabel, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
                    content.credits.forEach { InfoEntry(it) }
                }
                content.links.forEach { InfoEntry(it) }
                content.versions.forEach { Text("${it.label}: ${it.value}", style = MaterialTheme.typography.bodySmall, color = KozmosThemeTokens.primitivesColorsForeground500) }
            }
        }
    }
}
@Composable private fun InfoEntry(entry: KozmosMapInfoEntry) {
    val uriHandler = LocalUriHandler.current
    val destination = entry.destination
    Text(entry.label, style = MaterialTheme.typography.bodyMedium, color = if (destination == null) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.primitivesColorsTheme600,
        textDecoration = if (destination == null) null else TextDecoration.Underline,
        modifier = if (destination == null) Modifier else Modifier.clickable { uriHandler.openUri(destination) })
}

/** Keeps map content mounted. Compact hosts present full screen; wide hosts reserve an end pane. */
@Composable
fun KozmosMapInfo(isOpen: Boolean, onOpenChange: (Boolean) -> Unit, content: KozmosMapInfoContent, modifier: Modifier = Modifier, available: Boolean = true, brand: (@Composable () -> Unit)? = null, triggerLabel: String = "Information", closeLabel: String = "Close information", faqLabel: String = "Frequently asked questions", copyrightLabel: String = "Copyright", map: @Composable () -> Unit) {
    val triggerFocus = remember { FocusRequester() }
    var selectedFAQ by remember { mutableStateOf<String?>(null) }
    var wasOpen by remember { mutableStateOf(false) }
    LaunchedEffect(isOpen) {
        if (wasOpen && !isOpen && available) triggerFocus.requestFocus()
        wasOpen = isOpen
    }
    BoxWithConstraints(modifier) {
        val wide = KozmosMapInfoLayout.isWide(maxWidth.value)
        val shown = isOpen && available
        BackHandler(enabled = shown && wide) { onOpenChange(false) }
        val panel: @Composable () -> Unit = {
            BoxWithConstraints(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0)) {
                KozmosMapInfoPanel(content, { onOpenChange(false) }, Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).heightIn(min = maxHeight), brand, closeLabel, faqLabel, copyrightLabel, selectedFAQ, { selectedFAQ = it })
            }
        }
        Row(Modifier.fillMaxSize()) {
            Box(Modifier.weight(1f).fillMaxHeight()) {
                map()
                if (available && !shown) KozmosMapControlButton(label = triggerLabel, onClick = { onOpenChange(true) }, icon = { Icon(Icons.Outlined.Info, null) }, modifier = Modifier.align(Alignment.TopEnd).windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top + WindowInsetsSides.End)).padding(KozmosDimensions.primitivesLayoutSpacing200).focusRequester(triggerFocus))
            }
            if (shown && wide) Box(Modifier.width(KozmosMapInfoLayout.panelWidth.dp).fillMaxHeight().semantics { paneTitle = content.title }) { panel() }
        }
        if (shown && !wide) Dialog(onDismissRequest = { onOpenChange(false) }, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = true)) { panel() }
    }
}
