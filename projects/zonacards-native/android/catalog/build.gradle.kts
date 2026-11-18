// App de catálogo de Zonacards para Android (fase 4): todos los componentes con sus variantes, por marca y modo.
// Se instala en teléfonos de prueba (Firebase App Distribution) y es la base de las capturas de referencia.
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.zonacards.catalog"
    compileSdk = 37
    defaultConfig {
        applicationId = "com.zonacards.catalog"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    // Ícono adaptativo de Zonacards generado por npm run native.
    sourceSets["main"].res.srcDirs("src/main/res", "../BrandAssets/zonacards/res")
    testOptions { unitTests { isIncludeAndroidResources = true; isReturnDefaultValues = true } }
}

dependencies {
    implementation(project(":zonacards-compose"))
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.foundation:foundation")
    testImplementation(platform("androidx.compose:compose-bom:2026.09.00"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    testImplementation("androidx.compose.ui:ui-test-junit4-accessibility")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.16")
}

// Capturas de referencia: ./gradlew :catalog:testDebugUnitTest -Psnapshots=record las vuelve a grabar.
tasks.withType<Test>().configureEach {
    systemProperty("zc.snapshots", project.findProperty("snapshots") ?: "verify")
    systemProperty("zc.snapshotsDir", file("src/test/snapshots").absolutePath)
}
