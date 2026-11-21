// Tokens, íconos, textos, tipografías y banderas de Zonacards para Jetpack Compose.
// Lo de src/main/kotlin/.../generated y src/main/res sale de `npm run native` (no editar a mano).
plugins {
    id("com.android.library") // AGP 9 trae Kotlin integrado
    id("org.jetbrains.kotlin.plugin.compose")
    id("maven-publish")
}

android {
    namespace = "com.zonacards.ui.tokens"
    compileSdk = 37
    defaultConfig { minSdk = 26 }
    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    testOptions { unitTests.isReturnDefaultValues = true }
    publishing { singleVariant("release") { withSourcesJar() } }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.animation:animation-core")
    implementation("androidx.annotation:annotation:1.9.1")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}

// Publicación a Maven: coordenadas com.zonacards:zonacards-tokens:<versión del sistema de diseño> (gradle.properties). Sin variables de entorno solo se
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
                    name.set("Zonacards · zonacards-tokens")
                    description.set("Tokens, íconos, textos, tipografías, banderas y dominio del sistema de diseño Zonacards para Android.")
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
