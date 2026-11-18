// Tokens, íconos, textos, tipografías y banderas de Zonacards para Jetpack Compose.
// Lo de src/main/kotlin/.../generated y src/main/res sale de `npm run native` (no editar a mano).
plugins {
    id("com.android.library") // AGP 9 trae Kotlin integrado
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.zonacards.ui.tokens"
    compileSdk = 37
    defaultConfig { minSdk = 26 }
    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    testOptions { unitTests.isReturnDefaultValues = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.animation:animation-core")
    implementation("androidx.annotation:annotation:1.9.1")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
