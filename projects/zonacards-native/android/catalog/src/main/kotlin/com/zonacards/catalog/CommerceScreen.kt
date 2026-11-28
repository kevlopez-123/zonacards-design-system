package com.zonacards.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcMoney
import kotlinx.coroutines.delay

private val COUPONS = mapOf(
    "VERANO10" to ZcCoupon("VERANO10", ZcCouponKind.PCT, 0.10, "10 % de descuento"),
    "REGALO50" to ZcCoupon("REGALO50", ZcCouponKind.GC, 50.0, "Gift card con saldo"),
    "SOLO20" to ZcCoupon("SOLO20", ZcCouponKind.FIX, 20.0, "S/ 20 de descuento, no se combina", solo = true),
)

/** Comercio de la ola 5: monto, cupones y gift cards, anuncio, guía de inicio, ayuda y carrusel. */
@Composable
fun CommerceScreen() {
    Page {
        Section("Elegir un monto") {
            var amount by rememberSaveable { mutableStateOf<Double?>(100.0) }
            ZcAmountPicker("¿De cuánto será el valor?", listOf(50.0, 100.0, 150.0, 200.0), amount, { amount = it }, soldOut = listOf(500.0), required = true)
        }
        Section("Cupones y gift cards") {
            var applied by remember { mutableStateOf(listOf(COUPONS.getValue("VERANO10"))) }
            ZcCouponField(
                "Cupones y gift cards", applied, { applied = it },
                validate = { code ->
                    delay(400)
                    when {
                        code == "VENCIDO" -> ZcCouponCheck.Expired("01/10/2026")
                        COUPONS[code] != null -> ZcCouponCheck.Valid(COUPONS.getValue(code))
                        else -> ZcCouponCheck.NotFound
                    }
                },
                subtotal = 200.0, hint = "Prueba: VERANO10, REGALO50, SOLO20 o VENCIDO.",
            )
            ZcText("Descuento: ${ZcMoney.format(zcCouponsTotal(applied, 200.0), "pe")} de ${ZcMoney.format(200.0, "pe")}", style = ZcType.caption, color = ZonacardsTheme.colors.textMuted)
        }
        Section("Anuncio y guía de inicio") {
            var promo by rememberSaveable { mutableStateOf(true) }
            var guide by rememberSaveable { mutableStateOf(true) }
            ZcAnnouncement("Anuncio", "Aprovecha el Cyber: 20 % de descuento en gift cards hasta el domingo.", promo, { promo = it }, highlight = "20 % de descuento")
            ZcOnboarding("Optimiza tus compras en tres pasos", listOf("Elige la marca y el monto.", "Agrega los destinatarios.", "Paga y recibe los códigos al instante."), guide, { guide = it })
            if (!promo || !guide) ZcButton("Mostrar de nuevo", { promo = true; guide = true }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
        }
        Section("Ayuda en el checkout") {
            ZcHelpCard("¿Necesitas ayuda?", "Te asesoramos gratis para elegir el monto y los destinatarios.", action = { ZcButton("Escríbenos", {}, variant = ZcButtonVariant.SECONDARY, size = ZcButtonSize.SM) })
        }
        Section("Carrusel") {
            val templates = listOf("Cumpleaños", "Aniversario", "Gracias", "Navidad", "Bienvenida")
            ZcCarousel(templates, "Plantillas de mensaje", itemLabel = { it }) { name, i ->
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ZcIcon(if (i % 2 == 0) ZcIcons.sGift else ZcIcons.lSparkles, null, size = ZcSize.iconXl)
                    ZcText(name, style = ZcType.titleSm)
                    ZcText("Mensaje listo para personalizar.", style = ZcType.caption, color = ZonacardsTheme.colors.textMuted)
                }
            }
        }
    }
}
