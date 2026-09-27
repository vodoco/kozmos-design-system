# Kozmos Design System - Cross-Platform Component Mapping

> **Purpose:** This document provides a quick reference for how components map across all 6 Kozmos platforms. Use this when implementing features that need to work consistently across platforms.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Component Mapping Table](#2-component-mapping-table)
3. [Prop Mapping Reference](#3-prop-mapping-reference)
4. [Token Mapping](#4-token-mapping)
5. [Event Handling Mapping](#5-event-handling-mapping)
6. [Platform-Specific Features](#6-platform-specific-features)
7. [Code Examples by Platform](#7-code-examples-by-platform)

---

## 1. Platform Overview

### Platform Matrix

| Platform         | Package                | Language   | Framework       | Target                |
| ---------------- | ---------------------- | ---------- | --------------- | --------------------- |
| **React**        | `@kozmos/react`        | TypeScript | React 18+       | Web SDK               |
| **Vue**          | `@kozmos/vue`          | TypeScript | Vue 3 / Lit     | Dashboard             |
| **iOS**          | `KozmosSwiftUI`        | Swift      | SwiftUI         | iOS SDK               |
| **Android**      | `com.kozmos:compose`   | Kotlin     | Jetpack Compose | Android SDK           |
| **React Native** | `@kozmos/react-native` | TypeScript | React Native    | Cross-platform mobile |
| **Tokens**       | `@kozmos/tokens`       | Multiple   | —               | All platforms         |

### Import Patterns

```tsx
// React
import { Button, Input, Modal } from '@kozmos/react';

// Vue
import { KozmosButton, KozmosInput, KozmosModal } from '@kozmos/vue';

// iOS (Swift)
import KozmosSwiftUI

// Android (Kotlin)
import com.kozmos.compose.Button
import com.kozmos.compose.Input
import com.kozmos.compose.Modal

// React Native
import { Button, Input, Modal } from '@kozmos/react-native';
```

---

## 2. Component Mapping Table

### Legend

| Symbol | Meaning                              |
| ------ | ------------------------------------ |
| ✅     | Implemented with full feature parity |
| 🟡     | Implemented with partial features    |
| 🔄     | Uses platform-native equivalent      |
| ➖     | Not applicable to platform           |
| 🚧     | Planned / In development             |

### Foundation Components

| Component          | React | Vue | iOS | Android | React Native | Notes                         |
| ------------------ | :---: | :-: | :-: | :-----: | :----------: | ----------------------------- |
| **ThemeProvider**  |  ✅   | ✅  | ✅  |   ✅    |      ✅      | Required wrapper              |
| **Box**            |  ✅   | ✅  | 🔄  |   🔄    |      ✅      | Native: use native containers |
| **Stack**          |  ✅   | ✅  | ✅  |   ✅    |      ✅      | HStack/VStack on native       |
| **Grid**           |  ✅   | ✅  | ✅  |   ✅    |      🟡      | RN: use flex workaround       |
| **Text**           |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                               |
| **Heading**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      | Semantic levels               |
| **Spacer**         |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                               |
| **Divider**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                               |
| **VisuallyHidden** |  ✅   | ✅  | ✅  |   ✅    |      ✅      | Screen reader only            |

### Action Components

| Component       | React | Vue | iOS | Android | React Native | Notes        |
| --------------- | :---: | :-: | :-: | :-----: | :----------: | ------------ |
| **Button**      |  ✅   | ✅  | ✅  |   ✅    |      ✅      | All variants |
| **IconButton**  |  ✅   | ✅  | ✅  |   ✅    |      ✅      |              |
| **Link**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |              |
| **ButtonGroup** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |              |

### Form Components

| Component            | React | Vue | iOS | Android | React Native | Notes                    |
| -------------------- | :---: | :-: | :-: | :-----: | :----------: | ------------------------ |
| **Input**            |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **TextArea**         |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **Checkbox**         |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **Radio**            |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **RadioGroup**       |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **Switch**           |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **Select**           |  ✅   | ✅  | ✅  |   ✅    |      ✅      | Native pickers on mobile |
| **Slider**           |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |
| **DatePicker**       |  ✅   | ✅  | 🔄  |   🔄    |      🔄      | Uses native date pickers |
| **TimePicker**       |  ✅   | ✅  | 🔄  |   🔄    |      🔄      | Uses native time pickers |
| **FormField**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      | Label + input + error    |
| **FormErrorMessage** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                          |

### Feedback Components

| Component       | React | Vue | iOS | Android | React Native | Notes                   |
| --------------- | :---: | :-: | :-: | :-----: | :----------: | ----------------------- |
| **Modal**       |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |
| **Drawer**      |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |
| **Toast**       |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |
| **Alert**       |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |
| **AlertDialog** |  ✅   | ✅  | 🔄  |   🔄    |      🔄      | Native alerts on mobile |
| **Tooltip**     |  ✅   | ✅  | ✅  |   ✅    |      🟡      | Limited on RN           |
| **Popover**     |  ✅   | ✅  | ✅  |   ✅    |      🟡      |                         |
| **Progress**    |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |
| **Spinner**     |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |
| **Skeleton**    |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                         |

### Data Display Components

| Component       | React | Vue | iOS | Android | React Native | Notes              |
| --------------- | :---: | :-: | :-: | :-----: | :----------: | ------------------ |
| **Avatar**      |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **AvatarGroup** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **Badge**       |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **Card**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **List**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **ListItem**    |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **Table**       |  ✅   | ✅  | 🟡  |   🟡    |      ➖      | Limited on mobile  |
| **DataTable**   |  ✅   | ✅  | ➖  |   ➖    |      ➖      | Web/Dashboard only |
| **Tag**         |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **Chip**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |

### Navigation Components

| Component       | React | Vue | iOS | Android | React Native | Notes                |
| --------------- | :---: | :-: | :-: | :-----: | :----------: | -------------------- |
| **Tabs**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                      |
| **Accordion**   |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                      |
| **Breadcrumb**  |  ✅   | ✅  | ➖  |   ➖    |      ➖      | Web only             |
| **Pagination**  |  ✅   | ✅  | 🟡  |   🟡    |      🟡      | Mobile: simplified   |
| **Stepper**     |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                      |
| **Menu**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                      |
| **ContextMenu** |  ✅   | ✅  | 🔄  |   🔄    |      🔄      | Native context menus |

### SDK-Specific Components

| Component          | React | Vue | iOS | Android | React Native | Notes              |
| ------------------ | :---: | :-: | :-: | :-----: | :----------: | ------------------ |
| **MapView**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      | Core SDK           |
| **SearchPanel**    |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **SearchResults**  |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **POIDetailsCard** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **WayfindingCard** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **DirectionsList** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **LevelSwitcher**  |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **ZoomControls**   |  ✅   | ✅  | 🟡  |   🟡    |      🟡      | Gestures on mobile |
| **CompassControl** |  ✅   | ✅  | ✅  |   ✅    |      ✅      |                    |
| **AICompanion**    |  ✅   | 🚧  | ✅  |   ✅    |      ✅      | Complex composite  |

### Dashboard-Only Components

| Component           | React | Vue | iOS | Android | React Native | Notes          |
| ------------------- | :---: | :-: | :-: | :-----: | :----------: | -------------- |
| **DrawingToolbar**  |  ➖   | ✅  | ➖  |   ➖    |      ➖      | CMS only       |
| **LayerPanel**      |  ➖   | ✅  | ➖  |   ➖    |      ➖      | CMS only       |
| **PropertiesPanel** |  ➖   | ✅  | ➖  |   ➖    |      ➖      | CMS only       |
| **DataGrid**        |  ➖   | ✅  | ➖  |   ➖    |      ➖      | Dashboard only |

---

## 3. Prop Mapping Reference

### Common Prop Translations

| Concept            | React       | Vue                  | iOS           | Android           | React Native   |
| ------------------ | ----------- | -------------------- | ------------- | ----------------- | -------------- |
| **Click handler**  | `onClick`   | `@click`             | `action`      | `onClick`         | `onPress`      |
| **Change handler** | `onChange`  | `@update:modelValue` | `Binding`     | `onValueChange`   | `onChangeText` |
| **Value binding**  | `value`     | `v-model`            | `$value`      | `value`           | `value`        |
| **Disabled state** | `disabled`  | `:disabled`          | `.disabled()` | `enabled = false` | `disabled`     |
| **Loading state**  | `loading`   | `:loading`           | `.loading()`  | `loading`         | `loading`      |
| **Class/Style**    | `className` | `class`              | modifiers     | `Modifier`        | `style`        |

### Button Props Across Platforms

```tsx
// React
<Button
  variant="solid"
  size="md"
  disabled={false}
  loading={isLoading}
  onClick={handleClick}
>
  Submit
</Button>

// Vue
<KozmosButton
  variant="solid"
  size="md"
  :disabled="false"
  :loading="isLoading"
  @click="handleClick"
>
  Submit
</KozmosButton>

// iOS (SwiftUI)
KozmosButton("Submit", variant: .solid, size: .md) {
    handleSubmit()
}
.disabled(false)
.loading(isLoading)

// Android (Compose)
KozmosButton(
    text = "Submit",
    variant = ButtonVariant.Solid,
    size = ButtonSize.Md,
    enabled = true,
    loading = isLoading,
    onClick = { handleClick() }
)

// React Native
<Button
  variant="solid"
  size="md"
  disabled={false}
  loading={isLoading}
  onPress={handlePress}
>
  Submit
</Button>
```

### Input Props Across Platforms

```tsx
// React
<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter text"
  invalid={hasError}
  errorMessage={error}
/>

// Vue
<KozmosInput
  v-model="value"
  placeholder="Enter text"
  :invalid="hasError"
  :error-message="error"
/>

// iOS (SwiftUI)
KozmosInput(
    text: $value,
    placeholder: "Enter text",
    isInvalid: hasError,
    errorMessage: error
)

// Android (Compose)
KozmosInput(
    value = value,
    onValueChange = { value = it },
    placeholder = "Enter text",
    isError = hasError,
    errorMessage = error
)

// React Native
<Input
  value={value}
  onChangeText={setValue}
  placeholder="Enter text"
  invalid={hasError}
  errorMessage={error}
/>
```

---

## 4. Token Mapping

### Token Access by Platform

| Platform         | Access Pattern    | Example                            |
| ---------------- | ----------------- | ---------------------------------- |
| **React**        | CSS Variables     | `var(--kozmos-color-text-primary)` |
| **Vue**          | CSS Variables     | `var(--kozmos-color-text-primary)` |
| **iOS**          | Static Properties | `KozmosTokens.color.text.primary`  |
| **Android**      | Object Properties | `KozmosTokens.color.text.primary`  |
| **React Native** | JS Object         | `tokens.color.text.primary`        |

### Color Token Mapping

| Token        | CSS Variable                         | Swift                 | Kotlin                | JS                          |
| ------------ | ------------------------------------ | --------------------- | --------------------- | --------------------------- |
| Primary text | `--kozmos-color-text-primary`        | `.textPrimary`        | `.textPrimary`        | `color.text.primary`        |
| Background   | `--kozmos-color-bg-primary`          | `.bgPrimary`          | `.bgPrimary`          | `color.background.primary`  |
| Brand        | `--kozmos-color-interactive-primary` | `.interactivePrimary` | `.interactivePrimary` | `color.interactive.primary` |
| Error        | `--kozmos-color-status-error`        | `.statusError`        | `.statusError`        | `color.status.error`        |

### Spacing Token Mapping

| Token     | CSS Variable                | Swift            | Kotlin              | JS                |
| --------- | --------------------------- | ---------------- | ------------------- | ----------------- |
| space.100 | `--kozmos-space-100` (4px)  | `.space100` (4)  | `.space100` (4.dp)  | `space[100]` (4)  |
| space.200 | `--kozmos-space-200` (8px)  | `.space200` (8)  | `.space200` (8.dp)  | `space[200]` (8)  |
| space.400 | `--kozmos-space-400` (16px) | `.space400` (16) | `.space400` (16.dp) | `space[400]` (16) |
| space.600 | `--kozmos-space-600` (24px) | `.space600` (24) | `.space600` (24.dp) | `space[600]` (24) |

---

## 5. Event Handling Mapping

### Event Name Translations

| Event        | React         | Vue                  | iOS                   | Android          | React Native      |
| ------------ | ------------- | -------------------- | --------------------- | ---------------- | ----------------- |
| Click/Tap    | `onClick`     | `@click`             | `action:` closure     | `onClick`        | `onPress`         |
| Long Press   | `onLongPress` | `@longpress`         | `.onLongPressGesture` | `onLongClick`    | `onLongPress`     |
| Value Change | `onChange`    | `@update:modelValue` | `Binding<T>`          | `onValueChange`  | `onChangeText`    |
| Focus        | `onFocus`     | `@focus`             | `.focused()`          | `onFocusChanged` | `onFocus`         |
| Blur         | `onBlur`      | `@blur`              | `.focused()`          | `onFocusChanged` | `onBlur`          |
| Submit       | `onSubmit`    | `@submit`            | `.onSubmit`           | N/A              | `onSubmitEditing` |
| Scroll       | `onScroll`    | `@scroll`            | `.onChange`           | N/A              | `onScroll`        |

### Event Handler Patterns

```tsx
// React - Event object pattern
<Button onClick={(event: React.MouseEvent) => {
  event.preventDefault();
  handleClick();
}}>

// Vue - Native event
<KozmosButton @click="(event) => handleClick(event)">

// iOS - Closure pattern
KozmosButton("Submit") {
    await handleSubmit()
}

// Android - Lambda pattern
KozmosButton(
    onClick = { handleClick() }
)

// React Native - Gesture event
<Button onPress={(event: GestureResponderEvent) => {
  handlePress();
}}>
```

---

## 6. Platform-Specific Features

### Features by Platform

| Feature                | React | Vue | iOS | Android | React Native |
| ---------------------- | :---: | :-: | :-: | :-----: | :----------: |
| **Server Components**  |  ✅   | ➖  | ➖  |   ➖    |      ➖      |
| **SSR/SSG**            |  ✅   | ✅  | ➖  |   ➖    |      ➖      |
| **Native Date Picker** |  ➖   | ➖  | ✅  |   ✅    |      ✅      |
| **Haptic Feedback**    |  ➖   | ➖  | ✅  |   ✅    |      ✅      |
| **Native Share Sheet** |  ➖   | ➖  | ✅  |   ✅    |      ✅      |
| **Context Menu**       |  ✅   | ✅  | ✅  |   ✅    |      🟡      |
| **Keyboard Shortcuts** |  ✅   | ✅  | ✅  |   ➖    |      ➖      |
| **Drag and Drop**      |  ✅   | ✅  | ✅  |   🟡    |      🟡      |
| **RTL Support**        |  ✅   | ✅  | ✅  |   ✅    |      ✅      |
| **Dynamic Type**       |  ➖   | ➖  | ✅  |   ✅    |      🟡      |
| **Reduce Motion**      |  ✅   | ✅  | ✅  |   ✅    |      ✅      |

### Platform-Specific Component Variants

#### Select Component

```tsx
// React/Vue - Custom dropdown
<Select>
  <Select.Trigger>{selectedLabel}</Select.Trigger>
  <Select.Content>
    <Select.Option value="a">Option A</Select.Option>
    <Select.Option value="b">Option B</Select.Option>
  </Select.Content>
</Select>

// iOS - Native Picker
KozmosPicker(selection: $selection) {
    ForEach(options) { option in
        Text(option.label).tag(option.value)
    }
}

// Android - Native Spinner or ExposedDropdownMenu
KozmosSelect(
    options = options,
    selectedOption = selected,
    onOptionSelected = { selected = it }
)

// React Native - Native picker modal
<Select
  options={options}
  selectedValue={selected}
  onValueChange={setSelected}
  // Opens native picker sheet
/>
```

#### Date Picker Component

```tsx
// React/Vue - Custom calendar
<DatePicker
  value={date}
  onChange={setDate}
  minDate={minDate}
  maxDate={maxDate}
/>

// iOS - Native DatePicker
KozmosDatePicker(selection: $date)
    .datePickerStyle(.graphical)

// Android - Native DatePickerDialog
KozmosDatePicker(
    state = datePickerState,
    onDateSelected = { date = it }
)

// React Native - Opens native date picker
<DatePicker
  value={date}
  onChange={setDate}
  mode="date"
/>
```

---

## 7. Code Examples by Platform

### Complete Form Example

#### React

```tsx
import { FormField, Input, Select, Button, Stack } from "@kozmos/react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="400">
        <FormField label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="Enter your name"
          />
        </FormField>

        <FormField label="Email" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            placeholder="you@example.com"
          />
        </FormField>

        <FormField label="Category">
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                category: value,
              }))
            }
          >
            <Select.Option value="general">General</Select.Option>
            <Select.Option value="support">Support</Select.Option>
            <Select.Option value="sales">Sales</Select.Option>
          </Select>
        </FormField>

        <Button type="submit" variant="default">
          Submit
        </Button>
      </Stack>
    </form>
  );
}
```

#### Vue

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <KozmosStack gap="400">
      <KozmosFormField label="Name" required>
        <KozmosInput v-model="formData.name" placeholder="Enter your name" />
      </KozmosFormField>

      <KozmosFormField label="Email" required>
        <KozmosInput
          v-model="formData.email"
          type="email"
          placeholder="you@example.com"
        />
      </KozmosFormField>

      <KozmosFormField label="Category">
        <KozmosSelect v-model="formData.category">
          <KozmosSelectOption value="general">General</KozmosSelectOption>
          <KozmosSelectOption value="support">Support</KozmosSelectOption>
          <KozmosSelectOption value="sales">Sales</KozmosSelectOption>
        </KozmosSelect>
      </KozmosFormField>

      <KozmosButton type="submit" variant="solid"> Submit </KozmosButton>
    </KozmosStack>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  KozmosStack,
  KozmosFormField,
  KozmosInput,
  KozmosSelect,
  KozmosSelectOption,
  KozmosButton,
} from "@kozmos/vue";

const formData = ref({
  name: "",
  email: "",
  category: "",
});

function handleSubmit() {
  // Submit logic
}
</script>
```

#### iOS (SwiftUI)

```swift
import SwiftUI
import KozmosSwiftUI

struct ContactForm: View {
    @State private var name = ""
    @State private var email = ""
    @State private var category = ""

    var body: some View {
        Form {
            KozmosVStack(spacing: .space400) {
                KozmosFormField("Name", isRequired: true) {
                    KozmosInput(text: $name, placeholder: "Enter your name")
                }

                KozmosFormField("Email", isRequired: true) {
                    KozmosInput(text: $email, placeholder: "you@example.com")
                        .keyboardType(.emailAddress)
                }

                KozmosFormField("Category") {
                    KozmosPicker(selection: $category) {
                        Text("General").tag("general")
                        Text("Support").tag("support")
                        Text("Sales").tag("sales")
                    }
                }

                KozmosButton("Submit", variant: .solid) {
                    handleSubmit()
                }
            }
        }
    }

    private func handleSubmit() {
        // Submit logic
    }
}
```

#### Android (Compose)

```kotlin
import androidx.compose.runtime.*
import com.kozmos.compose.*

@Composable
fun ContactForm() {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }

    KozmosColumn(spacing = KozmosTokens.space400) {
        KozmosFormField(
            label = "Name",
            isRequired = true
        ) {
            KozmosInput(
                value = name,
                onValueChange = { name = it },
                placeholder = "Enter your name"
            )
        }

        KozmosFormField(
            label = "Email",
            isRequired = true
        ) {
            KozmosInput(
                value = email,
                onValueChange = { email = it },
                placeholder = "you@example.com",
                keyboardType = KeyboardType.Email
            )
        }

        KozmosFormField(label = "Category") {
            KozmosSelect(
                options = listOf(
                    SelectOption("general", "General"),
                    SelectOption("support", "Support"),
                    SelectOption("sales", "Sales")
                ),
                selectedValue = category,
                onValueChange = { category = it }
            )
        }

        KozmosButton(
            text = "Submit",
            variant = ButtonVariant.Solid,
            onClick = { handleSubmit() }
        )
    }
}
```

#### React Native

```tsx
import { FormField, Input, Select, Button, VStack } from "@kozmos/react-native";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
  });

  return (
    <VStack spacing="400">
      <FormField label="Name" required>
        <Input
          value={formData.name}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              name: text,
            }))
          }
          placeholder="Enter your name"
        />
      </FormField>

      <FormField label="Email" required>
        <Input
          value={formData.email}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              email: text,
            }))
          }
          placeholder="you@example.com"
          keyboardType="email-address"
        />
      </FormField>

      <FormField label="Category">
        <Select
          selectedValue={formData.category}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              category: value,
            }))
          }
          options={[
            { label: "General", value: "general" },
            { label: "Support", value: "support" },
            { label: "Sales", value: "sales" },
          ]}
        />
      </FormField>

      <Button variant="default" onPress={handleSubmit}>
        Submit
      </Button>
    </VStack>
  );
}
```

---

## Quick Reference Card

### Component Name Prefix Convention

| Platform     | Prefix   | Example        |
| ------------ | -------- | -------------- |
| React        | (none)   | `Button`       |
| Vue          | `Kozmos` | `KozmosButton` |
| iOS          | `Kozmos` | `KozmosButton` |
| Android      | `Kozmos` | `KozmosButton` |
| React Native | (none)   | `Button`       |

### Import Cheat Sheet

```
React:        import { Button } from '@kozmos/react';
Vue:          import { KozmosButton } from '@kozmos/vue';
iOS:          import KozmosSwiftUI
Android:      import com.kozmos.compose.Button
React Native: import { Button } from '@kozmos/react-native';
```

---

## Version History

| Version | Date       | Changes                  |
| ------- | ---------- | ------------------------ |
| 1.0.0   | 2026-02-07 | Initial platform mapping |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
