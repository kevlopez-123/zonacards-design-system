package com.zonacards.ui.compose

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcDomainData
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcPhone

// ---------- Hoja legal y consentimiento ----------

/** Una sección de un documento legal: encabezado y párrafos. */
data class ZcLegalSection(val title: String, val paragraphs: List<String>)

/** Términos o política de privacidad: título, versión y secciones. */
data class ZcLegalDocument(val title: String, val version: String? = null, val sections: List<ZcLegalSection>)

/**
 * Términos o privacidad en una hoja inferior: encabezados y párrafos, versión en el subtítulo y un botón en el pie. En un registro
 * `confirmLabel` es "Aceptar" y `onConfirm` marca la casilla; por defecto, "Entendido" solo cierra. El texto lo trae la app
 * (`document`; null mientras carga, con esqueleto). Con `error` muestra el aviso con Reintentar.
 */
@Composable
fun ZcLegalSheet(
    title: String,
    document: ZcLegalDocument?,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    error: Boolean = false,
    onRetry: () -> Unit = {},
    confirmLabel: String? = null,
    onConfirm: () -> Unit = onDismiss,
) {
    val ctx = LocalContext.current
    ZcBottomSheet(
        onDismiss = onDismiss, title = document?.title ?: title,
        subtitle = document?.version?.let { ctx.getString(R.string.zc_mol_legal_version, it) },
        footer = { ZcButton(confirmLabel ?: ctx.getString(R.string.zc_mol_legal_entendido), { onConfirm(); onDismiss() }, Modifier.weight(1f), enabled = document != null) },
    ) {
        Column(modifier, verticalArrangement = Arrangement.spacedBy(20.dp)) {
            when {
                error -> ZcAlert(
                    ctx.getString(R.string.zc_mol_legal_error_titulo), tone = ZcAlertTone.WARNING, text = ctx.getString(R.string.zc_mol_legal_error_texto),
                    actions = { ZcAlertAction(ctx.getString(R.string.zc_mol_legal_error_reintentar), onRetry) },
                )
                document == null -> ZcSkeleton(lines = 6)
                else -> document.sections.forEach { s ->
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        ZcText(s.title, Modifier.semantics { heading() }, style = ZcTextTw.base, weight = FontWeight.SemiBold)
                        s.paragraphs.forEach { ZcText(it, color = ZonacardsTheme.colors.textMuted) }
                    }
                }
            }
        }
    }
}

/**
 * Aceptación de términos en una caja: casilla, enlaces para leer los términos y la política (la app abre [ZcLegalSheet]) y, ya aceptados,
 * el chip "Términos aceptados". `error` marca la casilla cuando se intenta continuar sin aceptar.
 */
@Composable
fun ZcLegalConsent(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    onOpenTerms: () -> Unit,
    onOpenPrivacy: () -> Unit,
    modifier: Modifier = Modifier,
    error: Boolean = false,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    Column(modifier.fillMaxWidth().clip(RoundedCornerShape(ZonacardsTheme.shape.card)).background(c.surface2).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ZcCheckbox(checked, onCheckedChange, label = ctx.getString(R.string.zc_mol_legal_acepto), invalid = error && !checked)
        @OptIn(ExperimentalLayoutApi::class)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            ZcButton(ctx.getString(R.string.zc_mol_legal_leer_terminos), onOpenTerms, variant = ZcButtonVariant.LINK)
            ZcButton(ctx.getString(R.string.zc_mol_legal_leer_privacidad), onOpenPrivacy, variant = ZcButtonVariant.LINK)
        }
        if (error && !checked) ZcText(ctx.getString(R.string.zc_mol_legal_requerido), style = ZcTextTw.sm, color = c.dangerFg)
        if (checked) ZcBadge(ctx.getString(R.string.zc_mol_legal_aceptados), tone = ZcTone.SUCCESS, icon = ZcIcons.sCheckCircle)
    }
}

// ---------- Ayuda y soporte ----------

/** Canales de contacto; los que faltan no se muestran. Teléfonos en formato internacional (+51900000099). */
data class ZcSupportInfo(val hours: String? = null, val phone: String? = null, val whatsapp: String? = null, val email: String? = null, val url: String? = null)

/** Qué hace cada fila al tocarla. Por defecto abre la app del sistema (marcador, WhatsApp, correo o navegador). */
class ZcSupportActions(val call: (String) -> Unit, val whatsapp: (String) -> Unit, val email: (String) -> Unit, val web: (String) -> Unit) {
    companion object {
        fun system(ctx: Context): ZcSupportActions {
            fun open(intent: Intent) { runCatching { ctx.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }
            return ZcSupportActions(
                call = { open(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$it"))) },
                whatsapp = { open(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/" + it.filter(Char::isDigit)))) },
                email = { open(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$it"))) },
                web = { open(Intent(Intent.ACTION_VIEW, Uri.parse(it))) },
            )
        }
    }
}

/** "+51900000099" → "+51 900 000 099": prefijo de país conocido y el resto en grupos de tres (fijo de 8 dígitos: "1 700 8000"). */
fun zcPrettyPhone(e164: String): String {
    val digits = e164.filter(Char::isDigit)
    val dial = ZcDomainData.dialCountries.sortedByDescending { it.dial.length }.firstOrNull { digits.startsWith(it.dial.filter(Char::isDigit)) } ?: return e164
    val rest = digits.drop(dial.dial.count(Char::isDigit))
    return "${dial.dial} " + if (rest.length == 8) "${rest[0]} ${rest.substring(1, 4)} ${rest.substring(4)}" else ZcPhone.format(rest)
}

/**
 * "Ayuda y soporte" en una hoja inferior: horario y una fila por canal disponible (llamar, WhatsApp, correo, centro de ayuda). Cada
 * fila es un solo botón accesible con el canal y el dato, de 64 dp.
 */
@Composable
fun ZcSupportSheet(info: ZcSupportInfo, onDismiss: () -> Unit, modifier: Modifier = Modifier, actions: ZcSupportActions = ZcSupportActions.system(LocalContext.current)) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    ZcBottomSheet(
        onDismiss = onDismiss, title = ctx.getString(R.string.zc_mol_soporte_titulo), subtitle = ctx.getString(R.string.zc_mol_soporte_texto),
        footer = { ZcButton(ctx.getString(R.string.zc_ui_cerrar), onDismiss, Modifier.weight(1f), variant = ZcButtonVariant.OUTLINE) },
    ) {
        Column(modifier, verticalArrangement = Arrangement.spacedBy(16.dp)) {
            info.hours?.let { h ->
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(ZonacardsTheme.shape.card)).background(c.surface2).padding(16.dp).semantics(mergeDescendants = true) {}, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    ZcIcon(ZcIcons.sClockCircle, null, size = 20.dp)
                    Column {
                        ZcText(ctx.getString(R.string.zc_mol_soporte_horario), style = ZcTextTw.sm, weight = FontWeight.SemiBold)
                        ZcText(h, color = c.textMuted)
                    }
                }
            }
            info.phone?.let { SupportRow(ZcIcons.sPhone, ctx.getString(R.string.zc_mol_soporte_llamar), zcPrettyPhone(it)) { actions.call(it) } }
            info.whatsapp?.let { SupportRow(null, ctx.getString(R.string.zc_mol_soporte_whatsapp), zcPrettyPhone(it), logo = "whatsapp") { actions.whatsapp(it) } }
            info.email?.let { SupportRow(ZcIcons.sLetter, ctx.getString(R.string.zc_mol_soporte_correo), it) { actions.email(it) } }
            info.url?.let { SupportRow(ZcIcons.lExternalLink, ctx.getString(R.string.zc_mol_soporte_centro), ctx.getString(R.string.zc_mol_soporte_centro_texto)) { actions.web(it) } }
        }
    }
}

@Composable
private fun SupportRow(icon: Int?, channel: String, value: String, logo: String? = null, onClick: () -> Unit) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZonacardsTheme.shape.card)
    Row(
        Modifier.fillMaxWidth().heightIn(min = 64.dp).clip(shape).border(1.dp, c.border, shape).background(c.surface)
            .clickable(role = Role.Button, onClick = onClick)
            .semantics { contentDescription = ctx.getString(R.string.zc_mol_soporte_fila, channel, value) }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(44.dp).clip(CircleShape).background(c.surface2).clearAndSetSemantics { }, contentAlignment = Alignment.Center) {
            if (logo != null) ZcLogo(logo, size = 22.dp) else if (icon != null) ZcIcon(icon, null, size = 20.dp)
        }
        Column(Modifier.weight(1f).clearAndSetSemantics { }) {
            ZcText(channel, style = ZcTextTw.sm, weight = FontWeight.SemiBold)
            ZcText(value, color = c.textMuted, maxLines = 1)
        }
        ZcIcon(ZcIcons.sAltArrowRight, null, size = 16.dp, tint = c.textMuted)
    }
}
