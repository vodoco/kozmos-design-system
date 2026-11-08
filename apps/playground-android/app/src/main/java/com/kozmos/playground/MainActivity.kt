package com.kozmos.playground

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.themeprovider.KozmosThemeProvider
import com.kozmos.components.badge.BadgeVariant
import com.kozmos.components.badge.KozmosBadge
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.otpinput.KozmosOTPInput
import com.kozmos.providers.LocalKozmosAnalytics
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import java.util.UUID

data class TodoTask(val id: UUID, val text: String, var completed: Boolean)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KozmosThemeProvider {
                val tasks = remember {
                    mutableStateListOf(
                        TodoTask(UUID.randomUUID(), "Validate React Virtual DOM", true),
                        TodoTask(UUID.randomUUID(), "Deploy to Android Jetpack", false)
                    )
                }
                var newTask by remember { mutableStateOf("") }
                
                val completedCount = tasks.count { it.completed }
                
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(32.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Application Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Kozmos Tasks", fontSize = 40.sp, fontWeight = FontWeight.Bold)
                        KozmosBadge(
                            text = "$completedCount / ${tasks.size} Done",
                            variant = if (completedCount == tasks.size && tasks.isNotEmpty()) BadgeVariant.Default else BadgeVariant.Outline
                        )
                    }
                    
                    OtpCheck()

                    // Input Capture Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        KozmosInput(
                            value = newTask,
                            onValueChange = { newTask = it },
                            placeholder = "What needs to be done?",
                            modifier = Modifier.weight(1f)
                        )
                        KozmosButton(
                            variant = KozmosButtonVariant.Default,
                            onClick = {
                                if (newTask.isNotBlank()) {
                                    tasks.add(TodoTask(UUID.randomUUID(), newTask.trim(), false))
                                    newTask = ""
                                }
                            }
                        ) {
                            Text("Add Task")
                        }
                    }
                    
                    // Native Task Map
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        tasks.forEach { task ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, Color.LightGray.copy(alpha=0.3f), RoundedCornerShape(8.dp))
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    KozmosCheckbox(
                                        checked = task.completed,
                                        onCheckedChange = { checked ->
                                            val index = tasks.indexOf(task)
                                            if (index != -1) {
                                                tasks[index] = task.copy(completed = checked)
                                            }
                                        }
                                    )
                                    Text(
                                        text = task.text,
                                        textDecoration = if (task.completed) TextDecoration.LineThrough else TextDecoration.None,
                                        color = if (task.completed) Color.Gray else Color.Unspecified
                                    )
                                }
                                
                                KozmosButton(
                                    variant = KozmosButtonVariant.Destructive,
                                    onClick = { tasks.remove(task) }
                                ) {
                                    Text("Delete")
                                }
                            }
                        }
                        
                        if (tasks.isEmpty()) {
                            Text("All tasks completed!", color = Color.Gray, modifier = Modifier.padding(top = 16.dp))
                        }
                    }
                }
            }
        }
    }
}

/**
 * OTPInput on a device, for what a test cannot press: a real keyboard, a
 * composing IME (Gboard's Japanese keyboard, full-width digits), the SMS
 * one-time code, paste and TalkBack. It shows the code the field passes on
 * and every analytics event it sends: `otp_code_completed` once, when the
 * user's typing or paste fills the last box, and never for a code the host
 * sets ("Host sets 1234").
 */
@Composable
private fun OtpCheck() {
    var code by remember { mutableStateOf("") }
    val events = remember { mutableStateListOf<String>() }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("OTPInput", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        CompositionLocalProvider(
            LocalKozmosAnalytics provides { event -> events.add("${event.eventName} ${event.properties.orEmpty()}") }
        ) {
            KozmosOTPInput(value = code, onValueChange = { code = it }, length = 6, label = "Verification code")
        }
        Text("Code: \"$code\"")
        Text("Events: ${if (events.isEmpty()) "none" else events.joinToString("; ")}")
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            KozmosButton(variant = KozmosButtonVariant.Outline, onClick = { code = "1234" }) { Text("Host sets 1234") }
            KozmosButton(variant = KozmosButtonVariant.Outline, onClick = { code = ""; events.clear() }) { Text("Clear") }
        }
    }
}
