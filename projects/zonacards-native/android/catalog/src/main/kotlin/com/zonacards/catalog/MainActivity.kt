package com.zonacards.catalog

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.zonacards.ui.compose.ZcAction
import com.zonacards.ui.compose.ZcMenu
import com.zonacards.ui.compose.ZcToaster
import com.zonacards.ui.compose.ZcTopBar
import com.zonacards.ui.compose.ZonacardsTheme
import com.zonacards.ui.compose.rememberZcToastState
import com.zonacards.ui.tokens.ZcBrand
import com.zonacards.ui.tokens.ZcIcons

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { CatalogApp() }
    }
}

/** Secciones del catálogo (los mismos niveles que /catalogo de la web). */
enum class CatalogSection(val title: String, val subtitle: String) {
    FUNDAMENTOS("Fundamentos", "Color, tipografía, espacios y radios"),
    ATOMOS("Átomos", "Botones, badges, avatares, chips y controles"),
    FORMULARIOS("Formularios", "Campos, montos, documentos, selects y PIN"),
    ESTRUCTURA("Estructura", "Barras, sheets, modales, avisos y estados"),
    DOMINIO("Dominio", "Tarjetas, KPI, wallet, escáner y checkout"),
    PLANTILLAS("Plantillas", "App adaptable: barra inferior, riel y menú lateral; lista y detalle"),
    GRAFICOS("Gráficos", "Línea, barras, apiladas y dona; globo, vista de datos y segmentado"),
    OPERACION("Gráficos de operación", "Embudo, cascada, mapa de calor, treemap, calendario, sankey y medidor"),
    CONTENIDO("Contenido", "Pestañas, avisos, acordeón, lista de datos, historial, copiar, página de error y medidor de stock"),
    CAMPOS("Campos avanzados", "Pasos, resumen de errores, deslizadores, hora, contraseña, credencial y etiquetas"),
}

/** Raíz del catálogo: marca y modo elegibles, navegación con Atrás del sistema. */
@Composable
fun CatalogApp(initialSection: CatalogSection? = null, initialBrand: ZcBrand = ZcBrand.ZONACARDS, initialDark: Boolean? = null) {
    val systemDark = isSystemInDarkTheme()
    var brand by rememberSaveable { mutableStateOf(initialBrand) }
    var dark by rememberSaveable { mutableStateOf(initialDark ?: systemDark) }
    var section by rememberSaveable { mutableStateOf(initialSection) }
    BackHandler(enabled = section != null) { section = null }
    ZonacardsTheme(brand = brand, dark = dark) {
        val toasts = rememberZcToastState()
        Box(Modifier.fillMaxSize().background(ZonacardsTheme.colors.bg)) {
            Column(Modifier.fillMaxSize()) {
                ZcTopBar(
                    title = section?.title ?: "Zonacards UI",
                    subtitle = "${brand.name.lowercase().replaceFirstChar { it.uppercase() }} · ${if (dark) "oscuro" else "claro"}",
                    onBack = if (section != null) ({ section = null }) else null,
                    action = {
                        ZcMenu(
                            buildList {
                                ZcBrand.entries.forEachIndexed { i, b ->
                                    add(ZcAction("brand:${b.name}", b.name.lowercase().replaceFirstChar { it.uppercase() }, checked = b == brand, separatorBefore = false))
                                }
                                add(ZcAction("dark", if (dark) "Tema claro" else "Tema oscuro", if (dark) ZcIcons.sSun else ZcIcons.sMoon, separatorBefore = true))
                            },
                            { id -> if (id == "dark") dark = !dark else brand = ZcBrand.valueOf(id.removePrefix("brand:")) },
                            label = "Marca y tema",
                        )
                    },
                )
                when (section) {
                    null -> HomeScreen { section = it }
                    CatalogSection.FUNDAMENTOS -> FoundationsScreen()
                    CatalogSection.ATOMOS -> AtomsScreen()
                    CatalogSection.FORMULARIOS -> FormsScreen()
                    CatalogSection.ESTRUCTURA -> StructureScreen(toasts)
                    CatalogSection.DOMINIO -> DomainScreen(toasts)
                    CatalogSection.PLANTILLAS -> TemplatesScreen(toasts)
                    CatalogSection.GRAFICOS -> ChartsScreen()
                    CatalogSection.OPERACION -> OpsChartsScreen()
                    CatalogSection.CONTENIDO -> ContentScreen()
                    CatalogSection.CAMPOS -> FieldsMoreScreen(toasts)
                }
            }
            ZcToaster(toasts)
        }
    }
}
