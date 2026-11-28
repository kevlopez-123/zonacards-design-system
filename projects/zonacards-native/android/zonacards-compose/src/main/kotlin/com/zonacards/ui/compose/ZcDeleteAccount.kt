package com.zonacards.ui.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.domain.ZcDateStyle
import com.zonacards.ui.tokens.domain.ZcDates
import java.time.Instant

/** Solicitud de eliminación ya registrada: abierta (en trámite) o rechazada. */
data class ZcDeletionRequest(
    val open: Boolean,
    /** Estado para mostrar ("Pendiente", "En revisión"). */
    val statusLabel: String,
    val requestedAt: Instant,
    val rejectReason: String? = null,
)

/**
 * Eliminar mi cuenta (las tiendas de apps lo exigen). Explica qué pasa, pide un código que llega al correo y un motivo opcional, y registra
 * una solicitud que atiende el equipo: la cuenta sigue activa hasta entonces. La app envía el código, valida y registra:
 * - Sin solicitud: consecuencias → "Enviar código" → (con `maskedEmail`) código de 6 dígitos, motivo y "Solicitar eliminación".
 * - Con una solicitud abierta: su estado y fecha, y Volver. Rechazada: aviso con el motivo y se puede volver a pedir.
 * `error` (código inválido, sin red) se muestra en el campo del código.
 */
@Composable
fun ZcDeleteAccount(
    request: ZcDeletionRequest?,
    maskedEmail: String?,
    onSendCode: () -> Unit,
    onSubmit: (code: String, reason: String?) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    sending: Boolean = false,
    submitting: Boolean = false,
    error: String? = null,
    consequences: List<String>? = null,
    lang: String = "es",
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    var code by rememberSaveable { mutableStateOf("") }
    var reason by rememberSaveable { mutableStateOf("") }
    var tried by rememberSaveable { mutableStateOf(false) }
    val items = consequences ?: listOf(R.string.zc_mol_eliminar_cuenta_consecuencia1, R.string.zc_mol_eliminar_cuenta_consecuencia2, R.string.zc_mol_eliminar_cuenta_consecuencia3).map { ctx.getString(it) }
    val shape = RoundedCornerShape(ZonacardsTheme.shape.card)

    Column(modifier.fillMaxWidth().clip(shape).border(1.dp, c.border, shape).background(c.surface).padding(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        if (request?.open == true) {
            val date = ZcDates.format(request.requestedAt, ZcDateStyle.MEDIUM, lang)
            ZcText(ctx.getString(R.string.zc_mol_eliminar_cuenta_estado, request.statusLabel), Modifier.semantics { heading() }, style = ZcTextTw.xl, weight = ZcWeight.semibold)
            ZcText(ctx.getString(R.string.zc_mol_eliminar_cuenta_registrada, date), color = c.textMuted)
            ZcButton(ctx.getString(R.string.zc_mol_eliminar_cuenta_volver), onBack, block = true)
            return@Column
        }
        if (request != null && !request.open) {
            ZcAlert(ctx.getString(R.string.zc_mol_eliminar_cuenta_rechazada), tone = ZcAlertTone.DANGER, text = request.rejectReason)
        }
        ZcText(ctx.getString(R.string.zc_mol_eliminar_cuenta_que_sucede), Modifier.semantics { heading() }, style = ZcTextTw.xl, weight = ZcWeight.semibold)
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items.forEachIndexed { i, t ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ZcText("${i + 1}.", weight = ZcWeight.bold)
                    ZcText(t, Modifier.weight(1f))
                }
            }
        }
        if (maskedEmail == null) {
            ZcButton(ctx.getString(R.string.zc_mol_eliminar_cuenta_enviar_codigo), onSendCode, variant = ZcButtonVariant.OUTLINE, block = true, loading = sending, leadingIcon = ZcIcons.sLetter)
        } else {
            Row(
                Modifier.fillMaxWidth().clip(shape).border(1.dp, c.border, shape).background(c.surface2).padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(Modifier.size(44.dp).clip(CircleShape).background(c.surface), contentAlignment = Alignment.Center) { ZcIcon(ZcIcons.sLetter, null, size = 20.dp) }
                ZcText(ctx.getString(R.string.zc_mol_eliminar_cuenta_enviado_a, maskedEmail), Modifier.weight(1f), color = c.textMuted)
            }
            ZcOtpField(
                code, { code = it }, ctx.getString(R.string.zc_mol_eliminar_cuenta_codigo),
                error = error ?: if (tried && code.length < 6) ctx.getString(R.string.zc_mol_eliminar_cuenta_codigo_incompleto) else null,
            )
            ZcTextField(reason, { reason = it.take(500) }, ctx.getString(R.string.zc_mol_eliminar_cuenta_motivo), optional = true, minLines = 3)
            ZcButton(
                ctx.getString(R.string.zc_mol_eliminar_cuenta_solicitar),
                { if (code.length == 6) onSubmit(code, reason.trim().ifEmpty { null }) else tried = true },
                variant = ZcButtonVariant.DANGER, block = true, loading = submitting,
            )
        }
    }
}
