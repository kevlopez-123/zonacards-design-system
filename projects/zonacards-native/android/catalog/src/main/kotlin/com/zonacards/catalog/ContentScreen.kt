package com.zonacards.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType

/** Contenido base de la ola 5: pestañas, avisos, acordeón, lista de datos, historial, copiar, página de error y medidor de stock. */
@Composable
fun ContentScreen() {
    Page {
        var line by rememberSaveable { mutableStateOf("pendientes") }
        var seg by rememberSaveable { mutableStateOf("mes") }
        var many by rememberSaveable { mutableStateOf("t1") }
        Section("Pestañas de línea, con ícono y contador") {
            ZcTabs(
                listOf(ZcTab("pendientes", "Pendientes", count = 12), ZcTab("aprobados", "Aprobados", ZcIcons.sCheckCircle), ZcTab("rechazados", "Rechazados", count = 3), ZcTab("archivo", "Archivo", enabled = false)),
                line, { line = it }, label = "Estado de las solicitudes",
            )
            ZcText("Panel: $line", color = ZonacardsTheme.colors.textMuted)
        }
        Section("Pestañas segmentadas") {
            ZcTabs(listOf(ZcTab("sem", "Semana"), ZcTab("mes", "Mes"), ZcTab("anio", "Año")), seg, { seg = it }, variant = ZcTabsVariant.SEGMENTED, label = "Periodo")
        }
        Section("Pestañas que no caben: se desplazan") {
            ZcTabs(List(8) { ZcTab("t${it + 1}", "Sección ${it + 1}") }, many, { many = it })
        }
        Section("Avisos") {
            ZcAlert("Tenemos novedades", tone = ZcAlertTone.INFO, text = "Los lotes nuevos se aprueban en el día.")
            ZcAlert("Lote creado", tone = ZcAlertTone.SUCCESS, text = "Quedó pendiente de aprobación.")
            ZcAlert("Stock bajo el mínimo", tone = ZcAlertTone.WARNING, text = "Quedan 38 códigos de 500.", actions = { ZcAlertAction("Cargar lote", {}); ZcAlertAction("Ver detalle", {}) })
            ZcAlert("No pudimos guardar", tone = ZcAlertTone.DANGER, text = "Intenta de nuevo. Si sigue, escribe a soporte con la referencia ZC-48213.")
        }
        Section("Acordeón de uno a la vez") {
            ZcAccordion(
                listOf(
                    ZcAccordionItem("a", "¿Cuánto tarda la aprobación?", content = { ZcText("Hasta un día hábil.", color = ZonacardsTheme.colors.textMuted) }),
                    ZcAccordionItem("b", "¿Quién aprueba?", "Un usuario distinto de quien solicita", content = { ZcText("El maker-checker lo impide: nadie aprueba lo propio.", color = ZonacardsTheme.colors.textMuted) }),
                    ZcAccordionItem("c", "Envíos masivos", enabled = false, content = {}),
                ),
                initiallyOpen = setOf("a"),
            )
        }
        Section("Acordeón de varios, con ícono y estado") {
            ZcAccordion(
                listOf(
                    ZcAccordionItem("e", "Datos de la empresa", "Razón social y RUC", ZcIcons.sBox, aside = { ZcBadge("Completo", tone = ZcTone.SUCCESS) }, content = { ZcText("Interbank · 20100053455") }),
                    ZcAccordionItem("f", "Contactos", "Quién recibe los avisos", ZcIcons.sUserRounded, aside = { ZcBadge("Falta 1", tone = ZcTone.WARNING) }, content = { ZcText("Agrega un correo para los avisos.") }),
                ),
                multiple = true, label = "Datos del cliente", initiallyOpen = setOf("e"),
            )
        }
        Section("Lista de datos (dos columnas desde 448 dp) y en filas") {
            val items = listOf(ZcDescription("Cliente", "Interbank"), ZcDescription("País", "Perú", flag = "pe"), ZcDescription("Monto", "S/ 150,000.00"), ZcDescription("Vigencia", "31 dic 2026"), ZcDescription("Códigos", "1,200"))
            ZcDescriptionList(items)
            ZcDescriptionList(items.take(3), layout = ZcDescriptionLayout.ROWS)
        }
        Section("Historial") {
            ZcTimeline(
                listOf(
                    ZcTimelineItem(ZcIcons.sAddCircle, "Lote creado", "17 nov 2026 · Ana Quispe"),
                    ZcTimelineItem(ZcIcons.sCheckCircle, "Aprobado", "17 nov 2026 · Luis Mendoza"),
                    ZcTimelineItem(ZcIcons.sWallet, "Códigos entregados", "18 nov 2026"),
                ),
                label = "Historial del lote",
            )
        }
        Section("Copiar") {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                ZcText("ZC-2026-02829", style = ZcType.body)
                ZcCopyButton("ZC-2026-02829", label = "Copiar el número de pedido")
                ZcCopyButton("ZC-2026-02829", showText = true, variant = ZcButtonVariant.OUTLINE)
            }
        }
        Section("Página de error") {
            ZcErrorPage(
                "No encontramos esta página", "Puede que el enlace haya cambiado. Tu trabajo está guardado.", ZcIcons.sMagnifer,
                code = "404", reference = "ZC-48213",
                actions = { ZcButton("Ir al inicio", {}, size = ZcButtonSize.SM); ZcButton("Buscar", {}, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM) },
            )
        }
        Section("Medidor de stock") {
            ZcBullet(
                38.0, 50.0, 160.0, "Stock: 38 códigos; mínimo 50, punto de pedido 66, máximo 160", reorder = 66.0,
                head = { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { ZcText("Stock", style = ZcType.caption); ZcText("38 de 160", style = ZcType.caption, weight = androidx.compose.ui.text.font.FontWeight.SemiBold) } },
                legend = { ZcText("Bajo el mínimo · punto de pedido en 66", style = ZcType.caption, color = ZonacardsTheme.colors.textMuted) },
            )
            ZcBullet(110.0, 50.0, 160.0, "Stock: 110 códigos, dentro del rango sano")
        }
    }
}
