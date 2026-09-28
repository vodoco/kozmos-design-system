buildscript {
    if (gradle.startParameter.taskNames.any { it.endsWith("parseCodeConnect") || it.endsWith("createCodeConnect") }) {
        repositories {
            google()
            mavenCentral()
            gradlePluginPortal()
        }
        dependencies {
            classpath("com.figma.code.connect:com.figma.code.connect.gradle.plugin:1.2.10")
        }
    }
}

plugins {
    id("com.android.library") version "8.4.2"
    id("org.jetbrains.kotlin.android") version "2.0.21"
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21"
    id("app.cash.paparazzi") version "1.3.5"
}

if (gradle.startParameter.taskNames.any { it.endsWith("parseCodeConnect") || it.endsWith("createCodeConnect") }) {
    apply(plugin = "com.figma.code.connect")
}

android {
    namespace = "com.kozmos"
    compileSdk = 34

    defaultConfig {
        minSdk = 26

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("io.coil-kt:coil-compose:2.5.0")
    compileOnly("com.figma.code.connect:code-connect-lib:1.1.3")
    testImplementation("junit:junit:4.13.2")
    testImplementation("app.cash.paparazzi:paparazzi:1.3.5")
    // Dispatchers.setMain: Paparazzi starts a new main looper for every test,
    // and Dispatchers.Main keeps the first. 1.9.0 is the coroutines version
    // the unit tests already resolve.
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
}

// A failing test says why in the log: a snapshot that differs names by how
// much and where its delta went, where Gradle's default prints only the
// exception's class — all CI showed when the search sheet's snapshot failed
// on Linux.
tasks.withType<Test>().configureEach {
    testLogging {
        events("failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}
