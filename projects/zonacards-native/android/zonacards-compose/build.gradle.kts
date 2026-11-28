// Componentes de Zonacards en Jetpack Compose (fase 3 del plan nativo). Usa los tokens de :zonacards-tokens.
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.plugin.compose")
    id("maven-publish")
}

android {
    namespace = "com.zonacards.ui.compose"
    compileSdk = 37
    defaultConfig { minSdk = 26 }
    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    testOptions {
        unitTests {
            isIncludeAndroidResources = true; isReturnDefaultValues = true
            // Un fallo muestra su mensaje completo (valor esperado y obtenido), no solo la línea.
            all { t -> t.testLogging { exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL } }
        }
    }
    publishing { singleVariant("release") { withSourcesJar() } }
}

dependencies {
    api(project(":zonacards-tokens"))
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    api("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.13.0") // Atrás predictivo
    implementation("androidx.biometric:biometric:1.1.0") // diálogo de huella / rostro del sistema
    implementation("com.google.zxing:core:3.5.3") // QR y códigos de barras de los pases
    implementation("androidx.camera:camera-camera2:1.4.2") // escáner
    implementation("androidx.camera:camera-lifecycle:1.4.2")
    implementation("androidx.camera:camera-view:1.4.2")
    implementation("com.google.mlkit:barcode-scanning:17.3.0") // lectura de QR, Code 128 y EAN-13 en el teléfono
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation(platform("androidx.compose:compose-bom:2026.09.00"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.16")
}

// Publicación a Maven: coordenadas com.zonacards:zonacards-compose:<versión del sistema de diseño> (gradle.properties). Sin variables de entorno solo se
// puede publicar a Maven local; con ZC_MAVEN_URL (y ZC_MAVEN_USER / ZC_MAVEN_PASSWORD) también al repositorio privado. Nada se publica solo.
group = providers.gradleProperty("zonacards.group").get()
version = providers.gradleProperty("zonacards.version").get()
afterEvaluate {
    publishing {
        publications {
            register<MavenPublication>("release") {
                from(components["release"])
                artifactId = project.name
                pom {
                    name.set("Zonacards · zonacards-compose")
                    description.set("Componentes Jetpack Compose del sistema de diseño Zonacards.")
                    url.set("https://zonacards.com")
                    licenses { license { name.set("MIT License"); url.set("https://opensource.org/licenses/MIT") } }
                    developers { developer { name.set("Kevin López") } }
                }
            }
        }
        repositories {
            System.getenv("ZC_MAVEN_URL")?.let { target ->
                maven {
                    url = uri(target)
                    System.getenv("ZC_MAVEN_USER")?.let { user -> credentials { username = user; password = System.getenv("ZC_MAVEN_PASSWORD") } }
                }
            }
        }
    }
}
