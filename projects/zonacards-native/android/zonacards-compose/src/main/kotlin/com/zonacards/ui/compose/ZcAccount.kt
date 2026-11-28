package com.zonacards.ui.compose

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcBreakpoint
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcDomainData
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// ---------- Sesión por expirar (zc-session-timeout) ----------

/**
 * Aviso de sesión por expirar (zc-session-timeout): cuenta regresiva en un diálogo. "Seguir conectado" y Atrás (o tocar fuera)
 * extienden la sesión, como Escape en la web; "Cerrar sesión" o llegar a 0 la cierran. La app lo abre cuando detecta inactividad
 * (por ejemplo, 14 de 15 minutos). TalkBack recibe la cuenta cada 15 s, no cada segundo.
 */
@Composable
fun ZcSessionTimeout(open: Boolean, onOpenChange: (Boolean) -> Unit, onExtend: () -> Unit, onLogout: () -> Unit, seconds: Int = 60) {
    if (!open) return
    val ctx = LocalContext.current
    var left by remember { mutableIntStateOf(seconds) }
    LaunchedEffect(Unit) { while (left > 0) { delay(1000); left-- }; onOpenChange(false); onLogout() }
    val text = ctx.getString(R.string.zc_sesion_expira_texto, left)
    fun extend() { onOpenChange(false); onExtend() }
    fun logout() { onOpenChange(false); onLogout() }
    ZcModal(
        onDismiss = { extend() }, title = ctx.getString(R.string.zc_sesion_expira_titulo), subtitle = text, closable = false,
        footer = {
            ZcFooterButton(ctx.getString(R.string.zc_sesion_expira_cerrar), { logout() }, ZcButtonVariant.OUTLINE)
            ZcFooterButton(ctx.getString(R.string.zc_sesion_expira_seguir), { extend() })
        },
    ) { Box(Modifier.size(1.dp).semantics { liveRegion = LiveRegionMode.Polite; contentDescription = if (left % 15 == 0) text else "" }) }
}

// ---------- País de operación (zc-country-switcher) ----------

/**
 * País de operación de la barra superior (zc-country-switcher): bandera y moneda. Abre la lista con moneda, identificador
 * tributario y zona horaria; elegir uno define moneda, impuesto y zona horaria. `allowed` limita la lista al alcance del rol:
 * con un solo país se muestra fijo (sin menú) y un valor fuera del alcance pasa al primer país permitido.
 */
@Composable
fun ZcCountrySwitcher(value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier, allowed: List<String>? = null) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val countries = remember(allowed) { ZcDomainData.countries.filter { allowed == null || it.code in allowed } }
    LaunchedEffect(countries, value) { if (countries.isNotEmpty() && countries.none { it.code == value }) onValueChange(countries.first().code) }
    val info = (countries.firstOrNull { it.code == value } ?: ZcDomainData.countries.first { it.code == value.ifEmpty { "pe" } })
    val showCurrency = zcScreenWidth() >= ZcBreakpoint.sm
    var open by rememberSaveable { mutableStateOf(false) }
    if (countries.size < 2) {
        Row(
            modifier.heightIn(min = ZcSize.targetSm).padding(horizontal = 12.dp)
                .semantics { contentDescription = ctx.getString(R.string.zc_top_pais_fijo, info.name, info.currency) },
            horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically,
        ) {
            ZcFlagImage(info.code)
            if (showCurrency) ZcText(info.currency, style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"))
        }
        return
    }
    Row(
        modifier.heightIn(min = ZcSize.targetSm).clip(RoundedCornerShape(ZcRadius.sm)).clickable(role = Role.Button) { open = true }
            .semantics { contentDescription = ctx.getString(R.string.zc_top_pais_boton, info.name, info.currency) }.padding(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically,
    ) {
        ZcFlagImage(info.code)
        if (showCurrency) ZcText(info.currency, style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"))
    }
    if (open) ZcBottomSheet({ open = false }, ctx.getString(R.string.zc_top_pais_titulo)) {
        Column(Modifier.padding(8.dp).selectableGroup(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            countries.forEach { cn ->
                val on = cn.code == value
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 44.dp).clip(RoundedCornerShape(ZcRadius.sm))
                        .selectable(on, role = Role.RadioButton) { onValueChange(cn.code); open = false }.padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(Modifier.size(18.dp).clip(CircleShape).border(2.dp, if (on) c.primary else c.borderStrong, CircleShape), contentAlignment = Alignment.Center) {
                        if (on) Box(Modifier.size(8.dp).clip(CircleShape).background(c.primary))
                    }
                    ZcFlagImage(cn.code)
                    Column(Modifier.weight(1f)) {
                        ZcText(cn.name, style = ZcType.body)
                        ZcText("${cn.currency} · ${cn.taxId} · ${cn.timeZone.substringAfter('/').replace('_', ' ')}", style = ZcType.caption, color = c.textMuted)
                    }
                }
            }
            ZcText(ctx.getString(R.string.zc_top_pais_ayuda), Modifier.padding(horizontal = 8.dp, vertical = 8.dp), style = ZcType.caption, color = c.textMuted)
        }
    }
}

// ---------- Notificaciones (zc-notifications) ----------

enum class ZcNotificationKind { APR, ALR, OTHER }

data class ZcNotification(
    val id: String,
    @DrawableRes val icon: Int,
    val title: String,
    /** Origen y hora relativa ("Aprobaciones · hace 5 min"). */
    val meta: String,
    val kind: ZcNotificationKind,
    val unread: Boolean,
    /** Grupo de fecha ("Hoy", "Anteriores"). */
    val group: String,
)

/**
 * Campana de la barra superior con su panel (zc-notifications): contador de no leídas, "Marcar todo como leído", pestañas
 * Todas / Aprobaciones / Alertas, grupos por fecha y "Ver todas". El panel es una hoja inferior. Abrir una notificación la marca
 * como leída y avisa por `onOpen` para navegar.
 */
@Composable
fun ZcNotifications(
    items: List<ZcNotification>,
    onItemsChange: (List<ZcNotification>) -> Unit,
    onOpen: (ZcNotification) -> Unit,
    onSeeAll: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    var open by rememberSaveable { mutableStateOf(false) }
    var filter by rememberSaveable { mutableStateOf("all") }
    val unread = items.count { it.unread }
    val badgeInk = if (c.dangerFg.luminance() > 0.4f) Color.Black else Color.White
    Box(modifier) {
        ZcIconButton(ZcIcons.sBell, ctx.getString(R.string.zc_top_notif_boton, unread), { open = true })
        if (unread > 0) Box(
            Modifier.align(Alignment.TopEnd).padding(top = 6.dp, end = 4.dp).heightIn(min = 18.dp).widthIn(min = 18.dp).clip(CircleShape).background(c.dangerFg).padding(horizontal = 4.dp).clearAndSetSemantics { },
            contentAlignment = Alignment.Center,
        ) { ZcText("$unread", style = ZcType.tiny.copy(fontFeatureSettings = "tnum"), weight = ZcWeight.semibold, color = badgeInk) }
    }
    if (!open) return
    ZcBottomSheet({ open = false }, ctx.getString(R.string.zc_top_notif_titulo)) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.End) {
                Box(Modifier.heightIn(min = ZcSize.targetSm).clickable(enabled = unread > 0, role = Role.Button) { onItemsChange(items.map { it.copy(unread = false) }) }.padding(horizontal = 4.dp), contentAlignment = Alignment.Center) {
                    ZcText(ctx.getString(R.string.zc_top_notif_marcar_todo), style = ZcType.caption.copy(textDecoration = if (unread > 0) TextDecoration.Underline else null), color = if (unread > 0) c.text else c.textSubtle)
                }
            }
            ZcTabs(
                listOf(ZcTab("all", ctx.getString(R.string.zc_top_notif_filtro_all)), ZcTab("apr", ctx.getString(R.string.zc_top_notif_filtro_apr)), ZcTab("alr", ctx.getString(R.string.zc_top_notif_filtro_alr))),
                filter, { filter = it }, Modifier.padding(horizontal = 16.dp), variant = ZcTabsVariant.SEGMENTED, label = ctx.getString(R.string.zc_top_notif_tipo),
            )
            val shown = items.filter { filter == "all" || (filter == "apr" && it.kind == ZcNotificationKind.APR) || (filter == "alr" && it.kind == ZcNotificationKind.ALR) }
            if (shown.isEmpty()) ZcState(ctx.getString(R.string.zc_top_notif_vacio), Modifier.padding(horizontal = 16.dp), icon = ZcIcons.sInbox, text = ctx.getString(R.string.zc_top_notif_vacio_texto))
            else Column {
                shown.groupBy { it.group }.forEach { (group, list) ->
                    ZcText(group, Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).semantics { heading() }, style = ZcTextTw.xs, color = c.textMuted)
                    list.forEach { n ->
                        Row(
                            Modifier.fillMaxWidth().heightIn(min = ZcSize.targetSm).clickable(role = Role.Button) {
                                onItemsChange(items.map { if (it.id == n.id) it.copy(unread = false) else it }); open = false; onOpen(n)
                            }.padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top,
                        ) {
                            Box(Modifier.size(36.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(n.icon, null, size = ZcSize.iconSm, tint = c.text) }
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                ZcText(n.title, style = ZcTextTw.sm, weight = if (n.unread) ZcWeight.semibold else null)
                                ZcText(n.meta, style = ZcType.caption, color = c.textMuted)
                            }
                            if (n.unread) Box(Modifier.padding(top = 6.dp).size(8.dp).clip(CircleShape).background(c.dangerFg).semantics { contentDescription = ctx.getString(R.string.zc_top_notif_sin_leer) })
                        }
                        ZcDivider()
                    }
                }
            }
            Box(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                ZcButton(ctx.getString(R.string.zc_top_notif_ver_todas), { open = false; onSeeAll() }, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM, block = true)
            }
        }
    }
}

// ---------- Segundo factor (zc-mfa-setup) ----------

@Composable
private fun AccountHeading(text: String, modifier: Modifier = Modifier, big: Boolean = false) =
    ZcText(text, modifier.semantics { heading() }, style = if (big) ZcTextTw.x2l else ZcTextTw.xl, weight = ZcWeight.semibold)

private fun mfaStepLabel(s: String) = when (s) { "scan" -> R.string.zc_mol_mfa_paso_scan; "verify" -> R.string.zc_mol_mfa_paso_verify; else -> R.string.zc_mol_mfa_paso_codes }

/**
 * Activar el segundo factor, TOTP (zc-mfa-setup). 1) Escanear el QR con una app de autenticación, o escribir la clave a mano.
 * 2) Escribir el código de 6 dígitos, que valida `verify`. 3) Si hay `recoveryCodes`: mostrarlos con copiar y guardar en un archivo
 * (selector de archivos del sistema), y confirmar que se guardaron. El servidor genera el secreto: aquí llega `qrPayload`
 * (la URI `otpauth://…`) y el componente no crea secretos. El QR va siempre sobre fondo claro.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcMfaSetup(
    qrPayload: String,
    secret: String,
    verify: suspend (String) -> Boolean,
    onFinished: () -> Unit,
    modifier: Modifier = Modifier,
    account: String = "",
    recoveryCodes: List<String> = emptyList(),
    fileName: String = "codigos-recuperacion",
    cancel: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var step by rememberSaveable { mutableStateOf("scan") }
    var code by remember { mutableStateOf("") }
    var codeError by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var saved by rememberSaveable { mutableStateOf(false) }
    val steps = if (recoveryCodes.isNotEmpty()) listOf("scan", "verify", "codes") else listOf("scan", "verify")
    val index = if (step == "done") steps.size else steps.indexOf(step)
    val groups = secret.replace(Regex("\\s+"), "").chunked(4).joinToString(" ")
    val save = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/plain")) { uri ->
        if (uri != null) runCatching { ctx.contentResolver.openOutputStream(uri)?.use { it.write((recoveryCodes.joinToString("\r\n") + "\r\n").toByteArray()) } }
    }
    fun go(next: String) { step = next; if (next == "verify") { code = ""; codeError = false; failed = false } }
    fun finish() { go("done"); onFinished() }
    fun check(entered: String) {
        if (entered.length < 6 || busy) return
        busy = true; failed = false
        scope.launch {
            try {
                if (verify(entered)) { if (recoveryCodes.isNotEmpty()) go("codes") else finish() } else { codeError = true; code = "" }
            } catch (e: CancellationException) { throw e } catch (e: Exception) { failed = true } finally { busy = false }
        }
    }

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(24.dp)) {
        FlowRow(Modifier.fillMaxWidth().semantics { contentDescription = ctx.getString(R.string.zc_mol_mfa_pasos) }, horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            steps.forEachIndexed { i, s ->
                val done = index > i
                val on = s == step
                val stepName = ctx.getString(mfaStepLabel(s))
                val stepDesc = if (on) ctx.getString(R.string.zc_org_paso_de, i + 1, steps.size, stepName) else if (done) ctx.getString(R.string.zc_org_paso_completado, stepName) else stepName
                Row(Modifier.clearAndSetSemantics { contentDescription = stepDesc }, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(20.dp).clip(CircleShape).background(if (done) c.successBg else if (on) c.primary else c.surface2), contentAlignment = Alignment.Center) {
                        if (done) ZcIcon(ZcIcons.lCheck, null, size = 12.dp, tint = c.successFg)
                        else ZcText("${i + 1}", style = ZcTextTw.xs, color = if (on) c.onPrimary else c.text)
                    }
                    ZcText(ctx.getString(mfaStepLabel(s)), style = ZcType.caption, weight = if (on) ZcWeight.semibold else null, color = if (on) c.text else c.textMuted)
                }
            }
        }
        when (step) {
            "scan" -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccountHeading(ctx.getString(R.string.zc_mol_mfa_escanear_titulo))
                    ZcText(ctx.getString(R.string.zc_mol_mfa_escanear_texto), color = c.textMuted)
                }
                val shape = RoundedCornerShape(ZcRadius.md)
                Column(Modifier.fillMaxWidth().clip(shape).background(c.surface).border(1.dp, c.border, shape).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    ZcCodeImage(qrPayload, ZcBarcode.QR, Modifier.size(192.dp).semantics { contentDescription = ctx.getString(R.string.zc_mol_mfa_escanear_qr_alt) }, caption = null)
                    if (account.isNotEmpty()) ZcText(account, style = ZcTextTw.sm, color = c.textMuted)
                }
                ZcAccordion(
                    listOf(ZcAccordionItem("manual", ctx.getString(R.string.zc_mol_mfa_escanear_manual), content = {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            ZcText(ctx.getString(R.string.zc_mol_mfa_escanear_manual_texto), style = ZcTextTw.sm)
                            Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.sm)).background(c.surface2).padding(horizontal = 12.dp, vertical = 8.dp).semantics { contentDescription = ctx.getString(R.string.zc_mol_mfa_escanear_clave) + ": " + groups }) {
                                androidx.compose.runtime.CompositionLocalProvider(LocalZcFontFamily provides FontFamily.Monospace) { ZcText(groups, style = ZcType.body.copy(fontFeatureSettings = "tnum"), color = c.text) }
                            }
                            ZcCopyButton(secret, showText = true, variant = ZcButtonVariant.OUTLINE)
                        }
                    })),
                )
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalAlignment = Alignment.CenterVertically) {
                    cancel?.invoke()
                    ZcButton(ctx.getString(R.string.zc_mol_mfa_continuar), { go("verify") })
                }
            }
            "verify" -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccountHeading(ctx.getString(R.string.zc_mol_mfa_verificar_titulo))
                    ZcText(ctx.getString(R.string.zc_mol_mfa_verificar_texto), color = c.textMuted)
                }
                ZcOtpField(code, { code = it; codeError = false }, ctx.getString(R.string.zc_mol_mfa_verificar_codigo), error = if (codeError) ctx.getString(R.string.zc_mol_mfa_verificar_error) else null, enabled = !busy, onComplete = { check(it) })
                if (failed) ZcAlert(ctx.getString(R.string.zc_mol_mfa_verificar_fallo), tone = ZcAlertTone.DANGER, text = ctx.getString(R.string.zc_mol_mfa_verificar_fallo_texto))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    ZcButton(ctx.getString(R.string.zc_ui_volver), { go("scan") }, variant = ZcButtonVariant.GHOST, leadingIcon = ZcIcons.sAltArrowLeft)
                    ZcButton(ctx.getString(R.string.zc_mol_mfa_verificar_boton), { check(code) }, enabled = code.length >= 6 && !busy, loading = busy)
                }
            }
            "codes" -> {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccountHeading(ctx.getString(R.string.zc_mol_mfa_codigos_titulo))
                    ZcText(ctx.getString(R.string.zc_mol_mfa_codigos_texto), color = c.textMuted)
                }
                ZcAlert(ctx.getString(R.string.zc_mol_mfa_codigos_aviso), tone = ZcAlertTone.WARNING, text = ctx.getString(R.string.zc_mol_mfa_codigos_aviso_texto))
                val shape = RoundedCornerShape(ZcRadius.md)
                FlowRow(
                    Modifier.fillMaxWidth().clip(shape).background(c.surface).border(1.dp, c.border, shape).padding(16.dp).semantics { contentDescription = ctx.getString(R.string.zc_mol_mfa_codigos_titulo) },
                    horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    recoveryCodes.forEach { cd ->
                        Box(Modifier.widthIn(min = 128.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(c.surface2).padding(horizontal = 12.dp, vertical = 8.dp), contentAlignment = Alignment.Center) {
                            androidx.compose.runtime.CompositionLocalProvider(LocalZcFontFamily provides FontFamily.Monospace) { ZcText(cd, style = ZcType.body.copy(fontFeatureSettings = "tnum")) }
                        }
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ZcCopyButton(recoveryCodes.joinToString("\n"), showText = true, variant = ZcButtonVariant.OUTLINE)
                    ZcButton(ctx.getString(R.string.zc_mol_mfa_codigos_descargar), { save.launch("$fileName.txt") }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM, leadingIcon = ZcIcons.sDownloadMinimalistic)
                }
                ZcCheckbox(saved, { saved = it }, label = ctx.getString(R.string.zc_mol_mfa_codigos_guarde))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { ZcButton(ctx.getString(R.string.zc_mol_mfa_terminar), { finish() }, enabled = saved) }
            }
            else -> Column(Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(56.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.successBg), contentAlignment = Alignment.Center) { ZcIcon(ZcIcons.sShieldCheck, null, size = ZcSize.iconLg, tint = c.successFg) }
                AccountHeading(ctx.getString(R.string.zc_mol_mfa_listo_titulo))
                ZcText(ctx.getString(R.string.zc_mol_mfa_listo_texto), color = c.textMuted, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            }
        }
    }
}

// ---------- Acceso (zc-auth) ----------

enum class ZcAuthVariant { ADMIN, SHOP }
enum class ZcAuthView { LOGIN, OTP, RECOVERY, SETUP, FORGOT, SENT, SIGNUP, DONE }

/** `OTP`: pedir el código; `SETUP`: la cuenta debe configurar el segundo factor antes de entrar; `OK`: entra; `BAD`: datos incorrectos. */
enum class ZcLoginResult { OTP, SETUP, OK, BAD }

/** Vista actual y conteo de intentos del acceso; `reset()` vuelve al inicio (demostraciones y cierre de sesión). */
@Stable
class ZcAuthState {
    var view by mutableStateOf(ZcAuthView.LOGIN)
    internal var fails by mutableIntStateOf(0)
    internal var lockUntil by mutableLongStateOf(0L)
    fun reset() { fails = 0; lockUntil = 0L; view = ZcAuthView.LOGIN }
}

@Composable
fun rememberZcAuthState() = remember { ZcAuthState() }

private val AUTH_EMAIL = Regex("""^[^\s@]+@[^\s@]+\.[^\s@]{2,}$""")
private const val AUTH_MAX_FAILS = 5
private const val AUTH_LOCK_MS = 15 * 60_000L
private const val AUTH_RESEND_MS = 30_000L

@Composable
private fun AuthLink(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    val c = ZonacardsTheme.colors
    Box(modifier.heightIn(min = ZcSize.targetSm).clickable(enabled = enabled, role = Role.Button, onClick = onClick), contentAlignment = Alignment.CenterStart) {
        ZcText(text, style = ZcTextTw.sm.copy(textDecoration = if (enabled) TextDecoration.Underline else null), color = if (enabled) c.text else c.textSubtle)
    }
}

@Composable
private fun AuthBack(onClick: () -> Unit) {
    val ctx = LocalContext.current
    Row(Modifier.heightIn(min = ZcSize.targetSm).clickable(role = Role.Button, onClick = onClick), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        ZcIcon(ZcIcons.sAltArrowLeft, null, size = ZcSize.iconSm)
        ZcText(ctx.getString(R.string.zc_ui_volver), style = ZcTextTw.sm)
    }
}

@Composable
private fun AuthDivider(text: String) {
    val c = ZonacardsTheme.colors
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f).height(1.dp).background(c.border))
        ZcText(text, style = ZcType.caption, color = c.textMuted)
        Box(Modifier.weight(1f).height(1.dp).background(c.border))
    }
}

@Composable
private fun AuthIconBox(@DrawableRes icon: Int, size: Int, tint: Color? = null, bg: Color? = null) {
    val c = ZonacardsTheme.colors
    Box(Modifier.size(size.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(bg ?: c.surface2), contentAlignment = Alignment.Center) { ZcIcon(icon, null, size = if (size > 44) 24.dp else 20.dp, tint = tint ?: c.text) }
}

/**
 * Acceso (zc-auth, o-auth de la web). `ADMIN`: Microsoft Entra ID primero y correo para usuarios externos. `SHOP`: Google y Apple,
 * correo y registro. Recuperar contraseña, segundo factor (OTP), código de recuperación, intentos fallidos con bloqueo de
 * 15 min tras 5, aviso de Bloq Mayús y mensajes que no revelan si una cuenta existe. `login` y `verifyOtp` los resuelve la app.
 * Desde 900 dp lleva un panel lateral con la marca (`logo` opcional). Si `login` devuelve `SETUP`, se muestra `mfaSetup` (con
 * [ZcMfaSetup] y llamando a `done` al terminar).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcAuth(
    login: suspend (email: String, password: String) -> ZcLoginResult,
    verifyOtp: suspend (String) -> Boolean,
    onSignedIn: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ZcAuthVariant = ZcAuthVariant.ADMIN,
    state: ZcAuthState = rememberZcAuthState(),
    userName: String = "",
    forgot: (suspend (email: String) -> Unit)? = null,
    resendOtp: (suspend () -> Unit)? = null,
    verifyRecoveryCode: (suspend (String) -> Boolean)? = null,
    onSsoStart: (ZcSsoProvider) -> Unit = {},
    termsUrl: String = "",
    privacyUrl: String = "",
    submitBlocked: Boolean = false,
    logo: (@Composable () -> Unit)? = null,
    captcha: (@Composable () -> Unit)? = null,
    mfaSetup: (@Composable (done: () -> Unit) -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val uri = LocalUriHandler.current
    var email by rememberSaveable { mutableStateOf("") }
    var pw by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var recovery by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    var pwError by remember { mutableStateOf<String?>(null) }
    var otpError by remember { mutableStateOf<String?>(null) }
    var recoveryError by remember { mutableStateOf<String?>(null) }
    var otpOk by remember { mutableStateOf(false) }
    var forgotFailed by remember { mutableStateOf(false) }
    var capsOn by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var sso by remember { mutableStateOf<ZcSsoProvider?>(null) }
    var rememberMe by remember { mutableStateOf(false) }
    var trust by remember { mutableStateOf(false) }
    var resendAt by remember { mutableLongStateOf(0L) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    val locked = state.lockUntil > now
    val resendIn = maxOf(0L, (resendAt - now + 999) / 1000).toInt()
    LaunchedEffect(locked || resendIn > 0) {
        while (true) { delay(1000); now = System.currentTimeMillis(); if (state.lockUntil <= now && resendAt <= now) break }
    }
    val lockText = run { val s = maxOf(0L, (state.lockUntil - now + 999) / 1000); "${s / 60}:${(s % 60).toString().padStart(2, '0')}" }
    val shop = variant == ZcAuthVariant.SHOP
    val side = if (shop) "shop" else "admin"

    fun go(v: ZcAuthView) {
        state.view = v; emailError = null; pwError = null; otpError = null; otpOk = false
        if (v == ZcAuthView.OTP) { otp = ""; resendAt = System.currentTimeMillis() + AUTH_RESEND_MS; now = System.currentTimeMillis() }
    }
    fun finish() { go(ZcAuthView.DONE); onSignedIn() }
    fun ssoGo(p: ZcSsoProvider) { scope.launch { sso = p; delay(900); sso = null; onSsoStart(p) } }

    fun submit() {
        val em = email.trim()
        val e1 = if (em.isEmpty()) ctx.getString(R.string.zc_auth_err_correo) else if (!AUTH_EMAIL.matches(em)) ctx.getString(R.string.zc_auth_err_correo_valido) else null
        val e2 = if (pw.isEmpty()) ctx.getString(R.string.zc_auth_err_clave) else null
        emailError = e1; pwError = e2
        if (e1 != null || e2 != null) return
        busy = true
        scope.launch {
            // Un error de red o del servidor no cuenta como intento fallido: se avisa y se puede reintentar.
            val r = try { login(em, pw) } catch (e: CancellationException) { throw e } catch (e: Exception) { pwError = ctx.getString(R.string.zc_auth_olvido_error_texto); null } finally { busy = false }
            when (r) {
                null -> Unit
                ZcLoginResult.OTP -> { state.fails = 0; go(ZcAuthView.OTP) }
                ZcLoginResult.SETUP -> { state.fails = 0; go(ZcAuthView.SETUP) }
                ZcLoginResult.OK -> finish()
                ZcLoginResult.BAD -> { state.fails += 1; pw = ""; if (state.fails >= AUTH_MAX_FAILS) { state.lockUntil = System.currentTimeMillis() + AUTH_LOCK_MS; now = System.currentTimeMillis() } }
            }
        }
    }
    fun checkOtp(code: String) {
        scope.launch {
            val ok = try { verifyOtp(code) } catch (e: CancellationException) { throw e } catch (e: Exception) { otpError = ctx.getString(R.string.zc_auth_olvido_error_texto); return@launch }
            if (ok) { otpOk = true; delay(500); finish() } else { otpError = ctx.getString(R.string.zc_auth_otp_error); otp = "" }
        }
    }
    fun sendLink() {
        val em = email.trim()
        if (!AUTH_EMAIL.matches(em)) { emailError = ctx.getString(R.string.zc_auth_err_correo_valido); return }
        forgotFailed = false; busy = true
        scope.launch {
            try { forgot?.invoke(em); go(ZcAuthView.SENT) } catch (e: CancellationException) { throw e } catch (e: Exception) { forgotFailed = true } finally { busy = false }
        }
    }
    fun checkRecovery() {
        val code = recovery.trim()
        if (code.isEmpty()) { recoveryError = ctx.getString(R.string.zc_auth_recuperacion_requerido); return }
        busy = true
        scope.launch {
            try { if (verifyRecoveryCode?.invoke(code) == true) finish() else recoveryError = ctx.getString(R.string.zc_auth_recuperacion_error) }
            catch (e: CancellationException) { throw e } catch (e: Exception) { recoveryError = ctx.getString(R.string.zc_auth_olvido_error_texto) } finally { busy = false }
        }
    }

    val wide = zcScreenWidth() >= ZcBreakpoint.wide
    val shape = RoundedCornerShape(ZcRadius.lg)
    Row(
        modifier.fillMaxWidth().clip(shape).background(c.bg).border(1.dp, c.border, shape).heightIn(min = if (wide) 620.dp else 0.dp)
            .then(if (wide) Modifier.drawBehind { drawRect(c.secondary, size = Size(size.width / 2.1f, size.height)) } else Modifier),
    ) {
        if (wide) Column(Modifier.weight(1f).heightIn(min = 620.dp).padding(32.dp).clearAndSetSemantics { }, verticalArrangement = Arrangement.SpaceBetween) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                logo?.invoke()
                ZcText(ctx.getString(if (shop) R.string.zc_auth_lado_shop_titulo else R.string.zc_auth_lado_admin_titulo), Modifier.widthIn(max = 320.dp), style = ZcTextTw.x2l, weight = ZcWeight.bold, color = c.onSecondary)
                ZcText(ctx.getString(if (shop) R.string.zc_auth_lado_shop_texto else R.string.zc_auth_lado_admin_texto), Modifier.widthIn(max = 360.dp), style = ZcType.body, color = c.onSecondary.copy(alpha = 0.85f))
            }
            Box(
                Modifier.fillMaxWidth().aspectRatio(16f / 10f).clip(RoundedCornerShape(ZcRadius.md)).background(Brush.linearGradient(listOf(lerp(c.secondary, c.infoFg, 0.55f), c.infoFg))),
                contentAlignment = Alignment.Center,
            ) { ZcIcon(ZcIcons.sFlag, null, size = ZcSize.iconXl, tint = c.onSecondary) }
        }
        Column(Modifier.weight(if (wide) 1.1f else 1f).padding(horizontal = 20.dp, vertical = 32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterVertically)) {
            Column(Modifier.fillMaxWidth().widthIn(max = 400.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                when (state.view) {
                    ZcAuthView.LOGIN -> {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AccountHeading(ctx.getString(if (shop) R.string.zc_auth_login_titulo_shop else R.string.zc_auth_login_titulo_admin), big = true)
                            if (!shop) ZcText(ctx.getString(R.string.zc_auth_login_sub), color = c.textMuted)
                            else FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.Center) {
                                ZcText(ctx.getString(R.string.zc_auth_login_sin_cuenta), Modifier.align(Alignment.CenterVertically), color = c.textMuted)
                                AuthLink(ctx.getString(R.string.zc_auth_login_registrate), { go(ZcAuthView.SIGNUP) })
                            }
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            (if (shop) listOf(ZcSsoProvider.GOOGLE, ZcSsoProvider.APPLE) else listOf(ZcSsoProvider.MICROSOFT)).forEach { p ->
                                ZcSsoButton(p, { ssoGo(p) }, block = true, text = if (shop) ZcSsoText.CONTINUE else ZcSsoText.SIGNIN, loading = sso == p)
                            }
                        }
                        AuthDivider(ctx.getString(if (shop) R.string.zc_auth_login_divisor_shop else R.string.zc_auth_login_divisor_admin))
                        if (locked) ZcAlert(ctx.getString(R.string.zc_auth_bloqueo_titulo), tone = ZcAlertTone.DANGER, text = ctx.getString(R.string.zc_auth_bloqueo_texto, lockText))
                        else if (state.fails > 0) ZcAlert(
                            ctx.getString(R.string.zc_auth_error_titulo), tone = ZcAlertTone.DANGER,
                            text = (if (state.fails >= 3) ctx.getString(R.string.zc_auth_error_quedan, AUTH_MAX_FAILS - state.fails) + " " else "") + ctx.getString(R.string.zc_auth_error_texto),
                        )
                        Column(
                            Modifier.onPreviewKeyEvent { e -> if (e.type == KeyEventType.KeyDown || e.type == KeyEventType.KeyUp) capsOn = e.nativeKeyEvent.isCapsLockOn; false },
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            ZcTextField(email, { email = it; emailError = null }, ctx.getString(R.string.zc_auth_correo), required = true, keyboardType = KeyboardType.Email, capitalization = KeyboardCapitalization.None, error = emailError, enabled = !locked, reserve = false)
                            ZcTextField(
                                pw, { pw = it; pwError = null }, ctx.getString(R.string.zc_auth_clave), required = true, password = true, imeAction = ImeAction.Done, onImeAction = { submit() },
                                error = pwError ?: if (capsOn) ctx.getString(R.string.zc_auth_bloq_mayus) else null, enabled = !locked, reserve = false,
                            )
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                ZcCheckbox(rememberMe, { rememberMe = it }, label = ctx.getString(R.string.zc_auth_recordarme))
                                AuthLink(ctx.getString(R.string.zc_auth_olvido), { go(ZcAuthView.FORGOT) })
                            }
                            captcha?.invoke()
                            ZcButton(
                                if (busy) ctx.getString(R.string.zc_auth_ingresando) else ctx.getString(R.string.zc_auth_ingresar), { submit() },
                                enabled = !locked && !busy && !submitBlocked, loading = busy, block = true,
                            )
                        }
                    }
                    ZcAuthView.OTP -> {
                        AuthBack { go(ZcAuthView.LOGIN) }
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AuthIconBox(ZcIcons.sShieldKeyhole, 44)
                            AccountHeading(ctx.getString(R.string.zc_auth_otp_titulo), big = true)
                            ZcText(ctx.getString(R.string.zc_auth_otp_texto), color = c.textMuted)
                        }
                        ZcOtpField(otp, { otp = it; otpError = null }, ctx.getString(R.string.zc_auth_otp_codigo), error = otpError, hint = if (otpOk) ctx.getString(R.string.zc_auth_otp_correcto) else null, valid = otpOk, onComplete = { checkOtp(it) })
                        ZcCheckbox(trust, { trust = it }, label = ctx.getString(R.string.zc_auth_otp_confiar))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            AuthLink(
                                if (resendIn > 0) ctx.getString(R.string.zc_auth_otp_reenviar_en, resendIn) else ctx.getString(R.string.zc_auth_otp_reenviar),
                                { resendAt = System.currentTimeMillis() + AUTH_RESEND_MS; now = System.currentTimeMillis(); scope.launch { resendOtp?.invoke() } }, enabled = resendIn == 0,
                            )
                            if (verifyRecoveryCode != null) AuthLink(ctx.getString(R.string.zc_auth_otp_recuperacion), { go(ZcAuthView.RECOVERY) })
                        }
                    }
                    ZcAuthView.FORGOT -> {
                        AuthBack { go(ZcAuthView.LOGIN) }
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AccountHeading(ctx.getString(R.string.zc_auth_olvido_titulo), big = true)
                            ZcText(ctx.getString(R.string.zc_auth_olvido_texto), color = c.textMuted)
                        }
                        ZcTextField(email, { email = it; emailError = null }, ctx.getString(R.string.zc_auth_correo), required = true, keyboardType = KeyboardType.Email, capitalization = KeyboardCapitalization.None, error = emailError, imeAction = ImeAction.Done, onImeAction = { sendLink() }, reserve = false)
                        if (forgotFailed) ZcAlert(ctx.getString(R.string.zc_auth_olvido_error), tone = ZcAlertTone.DANGER, text = ctx.getString(R.string.zc_auth_olvido_error_texto))
                        ZcButton(ctx.getString(R.string.zc_auth_enviar_enlace), { sendLink() }, enabled = !busy, loading = busy, block = true)
                    }
                    ZcAuthView.SENT -> {
                        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AuthIconBox(ZcIcons.sInbox, 56)
                            AccountHeading(ctx.getString(R.string.zc_auth_revisa_correo), big = true)
                            ZcText(ctx.getString(R.string.zc_auth_revisa_texto, email), color = c.textMuted, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        }
                        ZcButton(ctx.getString(R.string.zc_auth_volver_ingresar), { go(ZcAuthView.LOGIN) }, variant = ZcButtonVariant.OUTLINE, block = true)
                    }
                    ZcAuthView.SIGNUP -> {
                        AuthBack { go(ZcAuthView.LOGIN) }
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AccountHeading(ctx.getString(R.string.zc_auth_crear_titulo), big = true)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.Center) {
                                ZcText(ctx.getString(R.string.zc_auth_crear_ya_tienes), Modifier.align(Alignment.CenterVertically), color = c.textMuted)
                                AuthLink(ctx.getString(R.string.zc_auth_crear_ingresa), { go(ZcAuthView.LOGIN) })
                            }
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            ZcSsoButton(ZcSsoProvider.GOOGLE, { ssoGo(ZcSsoProvider.GOOGLE) }, block = true, text = ZcSsoText.SIGNUP)
                            ZcSsoButton(ZcSsoProvider.APPLE, { ssoGo(ZcSsoProvider.APPLE) }, block = true, text = ZcSsoText.SIGNUP)
                        }
                        AuthDivider(ctx.getString(R.string.zc_auth_login_divisor_shop))
                        ZcTextField(email, { email = it; emailError = null }, ctx.getString(R.string.zc_auth_correo), required = true, keyboardType = KeyboardType.Email, capitalization = KeyboardCapitalization.None, error = emailError, reserve = false)
                        ZcPasswordField(pw, { pw = it }, ctx.getString(R.string.zc_auth_clave), required = true)
                        ZcButton(ctx.getString(R.string.zc_auth_crear_boton), { if (!AUTH_EMAIL.matches(email.trim())) emailError = ctx.getString(R.string.zc_auth_err_correo_valido) else go(ZcAuthView.LOGIN) }, block = true)
                    }
                    ZcAuthView.RECOVERY -> {
                        AuthBack { go(ZcAuthView.OTP) }
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AuthIconBox(ZcIcons.sShieldKeyhole, 44)
                            AccountHeading(ctx.getString(R.string.zc_auth_recuperacion_titulo), big = true)
                            ZcText(ctx.getString(R.string.zc_auth_recuperacion_texto), color = c.textMuted)
                        }
                        ZcTextField(
                            recovery, { recovery = it.uppercase(); recoveryError = null }, ctx.getString(R.string.zc_auth_recuperacion_codigo), required = true, placeholder = "XXXX-XXXX",
                            capitalization = KeyboardCapitalization.Characters, imeAction = ImeAction.Done, onImeAction = { checkRecovery() }, error = recoveryError, reserve = false,
                        )
                        ZcButton(ctx.getString(R.string.zc_auth_recuperacion_boton), { checkRecovery() }, enabled = !busy, loading = busy, block = true)
                    }
                    ZcAuthView.SETUP -> {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AccountHeading(ctx.getString(R.string.zc_auth_configurar_titulo), big = true)
                            ZcText(ctx.getString(R.string.zc_auth_configurar_texto), color = c.textMuted)
                        }
                        mfaSetup?.invoke { finish() }
                    }
                    ZcAuthView.DONE -> {
                        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AuthIconBox(ZcIcons.sCheckCircle, 56, tint = c.successFg, bg = c.successBg)
                            AccountHeading(ctx.getString(R.string.zc_auth_hola, userName), big = true)
                            ZcText(ctx.getString(R.string.zc_auth_listo), color = c.textMuted, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        }
                        ZcProgress(1f, label = ctx.getString(R.string.zc_auth_listo), tone = ZcTone.SUCCESS)
                    }
                }
            }
            if (termsUrl.isNotEmpty() && privacyUrl.isNotEmpty()) FlowRow(Modifier.widthIn(max = 400.dp), horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterHorizontally), verticalArrangement = Arrangement.Center, itemVerticalAlignment = Alignment.CenterVertically) {
                ZcText(ctx.getString(R.string.zc_auth_legal_antes), style = ZcType.caption, color = c.textMuted)
                Box(Modifier.heightIn(min = 44.dp).widthIn(min = 44.dp).clickable(role = Role.Button) { uri.openUri(termsUrl) }, contentAlignment = Alignment.Center) { ZcText(ctx.getString(R.string.zc_auth_legal_terminos), style = ZcType.caption.copy(textDecoration = TextDecoration.Underline)) }
                ZcText(ctx.getString(R.string.zc_auth_legal_y), style = ZcType.caption, color = c.textMuted)
                Box(Modifier.heightIn(min = 44.dp).widthIn(min = 44.dp).clickable(role = Role.Button) { uri.openUri(privacyUrl) }, contentAlignment = Alignment.Center) { ZcText(ctx.getString(R.string.zc_auth_legal_privacidad), style = ZcType.caption.copy(textDecoration = TextDecoration.Underline)) }
            }
        }
    }
}
