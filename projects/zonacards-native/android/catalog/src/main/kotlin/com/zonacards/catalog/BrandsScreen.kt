package com.zonacards.catalog

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import com.zonacards.ui.tokens.ZcBrand
import com.zonacards.ui.tokens.ZcIcons

/** Misma pantalla con la forma y el estilo de cada marca: los componentes no cambian, solo los tokens. */
@Composable
fun BrandsScreen() {
    Page {
        Section("Una pantalla, tres marcas") {
            val dark = ZonacardsTheme.isDark
            listOf(ZcBrand.ZONACARDS to "Zonacards", ZcBrand.ENJOY to "Enjoy", ZcBrand.MOTIVA to "Motiva").forEach { (brand, name) ->
                ZonacardsTheme(brand = brand, dark = dark) {
                    val c = ZonacardsTheme.colors
                    val shape = ZonacardsTheme.shape
                    Column(Modifier.fillMaxWidth().background(c.bg).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        ZcText("$name · radio de control ${shape.control.value.toInt()}, tarjeta ${shape.card.value.toInt()}, hoja ${shape.sheet.value.toInt()}, campo ${shape.fieldH.value.toInt()}", color = c.textMuted)
                        var text by remember { mutableStateOf("") }
                        ZcTextField(text, { text = it }, "Correo", placeholder = "nombre@empresa.com", hint = "Te enviaremos el código.")
                        ZcCard("Lote #02830", subtitle = "Espera tu aprobación", icon = ZcIcons.sCheckCircle)
                        ZcButton("Continuar", {}, block = true)
                        ZcButton("Cancelar", {}, variant = ZcButtonVariant.OUTLINE, block = true)
                    }
                }
            }
        }
    }
}
