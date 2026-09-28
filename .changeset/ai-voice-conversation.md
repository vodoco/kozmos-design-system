---
"@kozmos-ds/react": minor
---

`AIInputBar` draws a microphone that starts a spoken conversation with the assistant, which answers aloud, when the product passes `onVoiceStart`. Without it there is no microphone, so voice stays off unless the product has a voice model and turns it on: an App Clip leaves it out. The microphone sits between the field and send, 44px. The product keeps `voiceState` (`AIVoiceState`: `idle`, `connecting`, `listening`, `speaking`, `unavailable`, `error`) and ends the conversation in `onVoiceEnd`. Kozmos records and plays nothing: the voice model, its connection, the microphone permission and the audio are the product's.

The control is named for what a press does, "Start voice conversation" or "End voice conversation", with no `aria-pressed`. A polite live region announces each change of state, and while the conversation is live the empty field shows it in place of its placeholder. `unavailable` is `aria-disabled`, so it stays focusable and a press does nothing. Offline, `disabled` shows a microphone that is not in use as unavailable, while a live one can still be ended. Every string is a prop with an English default (`voiceStartLabel`, `voiceEndLabel`, `voiceConnectingLabel`, `voiceListeningLabel`, `voiceSpeakingLabel`, `voiceEndedLabel`, `voiceUnavailableLabel`, `voiceErrorLabel`); an empty string leaves that announcement out.
