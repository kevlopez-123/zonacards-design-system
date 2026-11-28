package com.zonacards.ui.compose

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.zxing.BarcodeFormat
import com.google.zxing.MultiFormatWriter
import com.google.zxing.common.BitMatrix
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDateStyle
import com.zonacards.ui.tokens.domain.ZcDates
import com.zonacards.ui.tokens.domain.ZcMoney
import java.time.LocalDate
import java.time.ZoneOffset

enum class ZcWalletOs { APPLE, GOOGLE }
enum class ZcBarcode { QR, CODE128, CODE39 }

/** Código QR o de barras real (ZXing), siempre negro sobre blanco (`--qr-*`) con el número debajo. */
@Composable
fun ZcCodeImage(value: String, format: ZcBarcode, modifier: Modifier = Modifier, caption: String? = value) {
    val c = ZonacardsTheme.colors
    val matrix: BitMatrix? = remember(value, format) {
        runCatching {
            when (format) {
                ZcBarcode.QR -> MultiFormatWriter().encode(value, BarcodeFormat.QR_CODE, 0, 0, mapOf(com.google.zxing.EncodeHintType.MARGIN to 0))
                ZcBarcode.CODE128 -> MultiFormatWriter().encode(value, BarcodeFormat.CODE_128, 0, 0)
                ZcBarcode.CODE39 -> MultiFormatWriter().encode(value, BarcodeFormat.CODE_39, 0, 0)
            }
        }.getOrNull()
    }
    Column(modifier.clip(RoundedCornerShape(ZcRadius.sm)).background(c.qrBg).padding(8.dp).clearAndSetSemantics { }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        if (matrix != null) Canvas(if (format == ZcBarcode.QR) Modifier.size(120.dp) else Modifier.widthIn(max = 240.dp).fillMaxWidth().height(56.dp)) {
            val cw = size.width / matrix.width; val ch = if (format == ZcBarcode.QR) size.height / matrix.height else size.height
            for (x in 0 until matrix.width) for (y in 0 until (if (format == ZcBarcode.QR) matrix.height else 1)) {
                if (matrix[x, y]) drawRect(c.qrFg, Offset(x * cw, y * ch), Size(cw + 0.5f, ch + 0.5f))
            }
        }
        if (caption != null) ZcText(caption, style = ZcType.tiny.copy(letterSpacing = 0.9.sp), weight = ZcWeight.medium, color = c.qrFg)
    }
}

/** Datos de un pase de fidelidad. Los colores del pase vienen de la marca del programa (no de los tokens del sistema). */
data class ZcLoyaltyPass(val program: String, val member: String, val points: Int, val tier: String, val bg: Color, val fg: Color, val label: Color, val code: String, val art: Painter? = null)

/**
 * Pase de puntos en Apple o Google Wallet (zc-wallet-pass): vista aproximada del pase real, ancho máximo 320. TalkBack lo lee
 * como imagen ("Pase de Apple Wallet: …"). `back` muestra el reverso.
 */
@Composable
fun ZcWalletPass(pass: ZcLoyaltyPass, modifier: Modifier = Modifier, os: ZcWalletOs = ZcWalletOs.APPLE, country: String = "pe", back: Boolean = false) {
    val ctx = LocalContext.current
    val pts = java.text.NumberFormat.getIntegerInstance(java.util.Locale.US).format(pass.points)
    val worth = ZcMoney.format(pass.points / 100.0, country)
    val a11y = if (os == ZcWalletOs.APPLE) ctx.getString(R.string.zc_mol_wallet_aria_apple, pass.program, pts, pass.tier) else ctx.getString(R.string.zc_mol_wallet_aria_google, pass.program, pts)
    val labelStyle = TextStyle(fontSize = 10.sp, letterSpacing = 0.6.sp)
    Box(modifier.widthIn(max = 320.dp).androidxSemantics(a11y)) {
        if (back) { PassBack(os, listOf(
            ctx.getString(R.string.zc_mol_wallet_programa) to pass.program,
            ctx.getString(R.string.zc_mol_wallet_como_usar) to ctx.getString(R.string.zc_mol_wallet_como_usar_texto),
        )); return@Box }
        if (os == ZcWalletOs.APPLE) Column(
            Modifier.shadow(12.dp, RoundedCornerShape(ZcRadius.md)).clip(RoundedCornerShape(ZcRadius.md)).background(pass.bg).padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)).background(pass.fg), contentAlignment = Alignment.Center) { ZcText(pass.program.take(1), style = ZcTextTw.xs, weight = ZcWeight.bold, color = pass.bg) }
                ZcText(pass.program, weight = ZcWeight.semibold, color = pass.fg, modifier = Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.End) {
                    ZcText(ctx.getString(R.string.zc_mol_wallet_nivel), style = labelStyle, weight = ZcWeight.semibold, color = pass.label)
                    ZcText(pass.tier, style = ZcType.body, weight = ZcWeight.semibold, color = pass.fg)
                }
            }
            if (pass.art != null) Image(pass.art, null, contentScale = ContentScale.Crop, modifier = Modifier.bleed(14.dp).aspectRatio(3f))
            Column {
                ZcText(ctx.getString(R.string.zc_mol_wallet_puntos), style = labelStyle, weight = ZcWeight.semibold, color = pass.label)
                ZcText(pts, style = TextStyle(fontSize = 30.sp, lineHeight = 33.sp).merge(Tabular), weight = ZcWeight.semibold, color = pass.fg)
            }
            Row {
                Column(Modifier.weight(1f)) { ZcText(ctx.getString(R.string.zc_mol_wallet_miembro), style = labelStyle, weight = ZcWeight.semibold, color = pass.label); ZcText(pass.member, color = pass.fg) }
                Column(horizontalAlignment = Alignment.End) { ZcText(ctx.getString(R.string.zc_mol_wallet_equivale), style = labelStyle, weight = ZcWeight.semibold, color = pass.label); ZcText(worth, color = pass.fg) }
            }
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { ZcCodeImage(pass.code, ZcBarcode.QR) }
        } else Column(Modifier.clip(RoundedCornerShape(ZcRadius.lg)).background(pass.bg).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(32.dp).clip(CircleShape).background(pass.fg), contentAlignment = Alignment.Center) { ZcText(pass.program.take(1), style = ZcTextTw.xs, weight = ZcWeight.bold, color = pass.bg) }
                ZcText(pass.program, color = pass.fg)
            }
            ZcText(pass.member, style = ZcType.heading, weight = ZcWeight.semibold, color = pass.fg)
            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Column { ZcText(ctx.getString(R.string.zc_mol_wallet_puntos_g), style = ZcTextTw.xs, color = pass.fg.copy(alpha = 0.8f)); ZcText(pts, weight = ZcWeight.semibold, color = pass.fg) }
                Column { ZcText(ctx.getString(R.string.zc_mol_wallet_nivel_g), style = ZcTextTw.xs, color = pass.fg.copy(alpha = 0.8f)); ZcText(pass.tier, weight = ZcWeight.semibold, color = pass.fg) }
            }
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { ZcCodeImage(pass.code, ZcBarcode.QR) }
            if (pass.art != null) Image(pass.art, null, contentScale = ContentScale.Crop, modifier = Modifier.bleed(16.dp).aspectRatio(3f))
        }
    }
}

/** Reverso de un pase: filas etiqueta/valor separadas (como el reverso de Apple o los "Detalles" de Google). */
@Composable
private fun PassBack(os: ZcWalletOs, rows: List<Pair<String, String>>) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Column(Modifier.clip(RoundedCornerShape(ZcRadius.md)).background(c.surface).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ZcText(if (os == ZcWalletOs.APPLE) rows.first().second else ctx.getString(R.string.zc_mol_wallet_detalles), weight = ZcWeight.semibold, modifier = Modifier.weight(1f))
            if (os == ZcWalletOs.APPLE) ZcText(ctx.getString(R.string.zc_mol_wallet_listo), color = c.primary, style = ZcType.body.copy(textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline))
        }
        for ((k, v) in rows) Column {
            ZcDivider()
            Column(Modifier.padding(vertical = 8.dp)) { ZcText(k, style = ZcType.caption, color = c.textMuted); ZcText(v) }
        }
    }
}

/** Datos de una giftcard en wallet. `expires` en ISO; colores del emisor. */
data class ZcGiftcardData(
    val issuer: String, val title: String, val balance: Double, val number: String, val pin: String? = null, val expires: String? = null,
    val barcode: ZcBarcode = ZcBarcode.CODE128, val image: Painter? = null, val bg: Color, val fg: Color, val label: Color,
    val terms: String? = null, val support: String? = null,
)

/**
 * Giftcard en Apple o Google Wallet (zc-giftcard-pass): saldo, número enmascarado (•••• 1234), vencimiento y código.
 * En Apple el PIN solo va en el reverso y CODE 39 se muestra como QR con aviso. Debajo, siempre, la nota de vista aproximada.
 */
@Composable
fun ZcGiftcardPass(card: ZcGiftcardData, country: String, modifier: Modifier = Modifier, os: ZcWalletOs = ZcWalletOs.GOOGLE, back: Boolean = false) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val balance = ZcMoney.format(card.balance, country)
    val masked = "•••• " + card.number.takeLast(4)
    val expires = card.expires?.let { ZcDates.format(LocalDate.parse(it).atStartOfDay().toInstant(ZoneOffset.UTC), ZcDateStyle.SHORT, timeZone = "UTC") }
    val walletName = if (os == ZcWalletOs.APPLE) "Apple Wallet" else "Google Wallet"
    val label = TextStyle(fontSize = 10.sp, letterSpacing = 0.6.sp)
    val code = if (os == ZcWalletOs.APPLE && card.barcode == ZcBarcode.CODE39) ZcBarcode.QR else card.barcode
    Column(modifier.widthIn(max = 320.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(Modifier.androidxSemantics(ctx.getString(R.string.zc_mol_giftcard_aria, card.issuer, walletName, balance))) {
            if (back) PassBack(os, buildList {
                add(ctx.getString(R.string.zc_mol_giftcard_tarjeta) to card.number)
                if (os == ZcWalletOs.APPLE && card.pin != null) add(ctx.getString(R.string.zc_mol_giftcard_pin) to card.pin)
                if (expires != null) add(ctx.getString(R.string.zc_mol_giftcard_vence_g) to expires)
                add(ctx.getString(R.string.zc_mol_wallet_como_usar) to ctx.getString(R.string.zc_mol_giftcard_como_usar))
                card.terms?.let { add(ctx.getString(R.string.zc_mol_giftcard_terminos) to it) }
                card.support?.let { add(ctx.getString(R.string.zc_mol_wallet_atencion) to it) }
            })
            else if (os == ZcWalletOs.APPLE) Column(Modifier.shadow(12.dp, RoundedCornerShape(ZcRadius.md)).clip(RoundedCornerShape(ZcRadius.md)).background(card.bg).padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ZcText(card.issuer, weight = ZcWeight.semibold, color = card.fg, modifier = Modifier.weight(1f))
                    ZcText(ctx.getString(R.string.zc_mol_giftcard_saldo).uppercase(), style = label, weight = ZcWeight.semibold, color = card.label)
                }
                Box(Modifier.bleed(14.dp).aspectRatio(375f / 144f).background(card.label.copy(alpha = 0.2f))) {
                    if (card.image != null) Image(card.image, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    ZcText(balance, style = TextStyle(fontSize = 30.sp, shadow = Shadow(Color(0x59000000), Offset(0f, 2f), 6f)).merge(Tabular), weight = ZcWeight.semibold, color = Color.White, modifier = Modifier.align(Alignment.BottomStart).padding(14.dp))
                }
                Row {
                    Column(Modifier.weight(1f)) { ZcText(ctx.getString(R.string.zc_mol_giftcard_tarjeta).uppercase(), style = label, weight = ZcWeight.semibold, color = card.label); ZcText(masked, color = card.fg) }
                    if (expires != null) Column(horizontalAlignment = Alignment.End) { ZcText(ctx.getString(R.string.zc_mol_giftcard_vence).uppercase(), style = label, weight = ZcWeight.semibold, color = card.label); ZcText(expires, color = card.fg) }
                }
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { ZcCodeImage(card.number, code) }
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                    Box(Modifier.size(24.dp).border(1.dp, card.label, CircleShape), contentAlignment = Alignment.Center) { ZcText("i", style = ZcTextTw.xs, weight = ZcWeight.bold, color = card.label) }
                }
            } else Column(Modifier.clip(RoundedCornerShape(ZcRadius.lg)).background(card.bg).padding(bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(Modifier.size(32.dp).clip(CircleShape).background(card.fg), contentAlignment = Alignment.Center) { ZcText(card.issuer.take(1), style = ZcTextTw.xs, weight = ZcWeight.bold, color = card.bg) }
                    ZcText(card.issuer, color = card.fg, maxLines = 1, modifier = Modifier.weight(1f))
                    ZcText(balance, weight = ZcWeight.bold, color = card.fg)
                }
                ZcText(card.title, style = ZcType.heading.copy(lineHeight = 28.sp), weight = ZcWeight.semibold, color = card.fg, modifier = Modifier.padding(horizontal = 16.dp))
                if (card.image != null) Image(card.image, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().aspectRatio(5f / 4f))
                Row(Modifier.padding(horizontal = 16.dp)) {
                    if (card.pin != null) Column(Modifier.weight(1f)) { ZcText(ctx.getString(R.string.zc_mol_giftcard_pin), style = label, weight = ZcWeight.semibold, color = card.label); ZcText("••••", color = card.fg) }
                    if (expires != null) Column { ZcText(ctx.getString(R.string.zc_mol_giftcard_vence_g), style = label, weight = ZcWeight.semibold, color = card.label); ZcText(expires, color = card.fg) }
                }
                Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp), contentAlignment = Alignment.Center) { ZcCodeImage(card.number, code) }
            }
        }
        if (os == ZcWalletOs.APPLE && card.barcode == ZcBarcode.CODE39 && !back) ZcText(ctx.getString(R.string.zc_mol_giftcard_respaldo_apple), style = ZcTextTw.xs, color = c.textMuted)
        ZcText(ctx.getString(R.string.zc_mol_giftcard_aproximada), style = ZcTextTw.xs, color = c.textMuted)
    }
}

/** El pase se anuncia como una sola imagen con su descripción (como role="img" de la web). */
private fun Modifier.androidxSemantics(label: String) = this.clearAndSetSemantics { contentDescription = label }

/** Imagen "a sangre": ocupa el ancho del contenedor más su padding lateral (Compose no admite padding negativo). */
private fun Modifier.bleed(x: androidx.compose.ui.unit.Dp) = this.then(Modifier.layout { m, cons ->
    val extra = (x * 2).roundToPx()
    val p = m.measure(cons.copy(minWidth = cons.maxWidth + extra, maxWidth = cons.maxWidth + extra))
    layout(cons.maxWidth, p.height) { p.place(-x.roundToPx(), 0) }
})
