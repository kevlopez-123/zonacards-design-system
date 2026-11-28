package com.zonacards.ui.compose

import android.app.TimePickerDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.PersistableBundle
import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcBreakpoint
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDates
import com.zonacards.ui.tokens.domain.ZcPassword
import kotlinx.coroutines.delay
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// ---------- Pasos (zc-stepper) ----------

/**
 * Pasos de un formulario largo (zc-stepper). Desde 768 dp: pasos en horizontal (hechos con check, el actual destacado; se
 * desplazan si no caben). En teléfono: compacto, "Paso 2 de 4: Contacto" con barra de progreso. No es interactivo: solo informa.
 */
@Composable
fun ZcStepper(steps: List<String>, current: Int, label: String, modifier: Modifier = Modifier) {
    if (steps.isEmpty()) return
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val pill = RoundedCornerShape(ZcRadius.full)
    if (zcScreenWidth() >= ZcBreakpoint.md) {
        Row(modifier.horizontalScroll(rememberScrollState()).semantics { contentDescription = label }, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            steps.forEachIndexed { i, s ->
                val done = i < current
                val on = i == current
                Row(
                    Modifier.height(44.dp).clip(pill).then(if (on) Modifier.background(c.surface2) else Modifier).padding(start = 8.dp, end = 12.dp)
                        .clearAndSetSemantics { selected = on; contentDescription = if (done) ctx.getString(R.string.zc_org_paso_completado, s) else s },
                    horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically,
                ) {
                    val (fill, line, ink) = when {
                        done -> Triple(c.successFg, c.successFg, c.surface)
                        on -> Triple(c.primary, c.primary, c.onPrimary)
                        else -> Triple(Color.Transparent, c.borderStrong, c.textMuted)
                    }
                    Box(Modifier.size(28.dp).clip(CircleShape).background(fill).border(1.5.dp, line, CircleShape), contentAlignment = Alignment.Center) {
                        if (done) ZcIcon(ZcIcons.lCheck, null, size = ZcSize.iconSm, tint = ink)
                        else ZcText("${i + 1}", style = ZcType.caption.copy(fontFeatureSettings = "tnum"), weight = ZcWeight.semibold, color = ink)
                    }
                    ZcText(s, style = ZcTextTw.sm, weight = if (on) ZcWeight.medium else null, color = if (on) c.text else c.textMuted, maxLines = 1)
                }
            }
        }
    } else {
        val progress by animateFloatAsState((current + 1f) / steps.size, tween(200), label = "stepProgress")
        Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            ZcText(
                ctx.getString(R.string.zc_org_paso_de, current + 1, steps.size, steps.getOrElse(current) { "" }),
                Modifier.semantics { liveRegion = LiveRegionMode.Polite }, style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"),
            )
            Box(
                Modifier.weight(1f).height(6.dp).clip(pill).background(c.surface3)
                    .semantics { contentDescription = ctx.getString(R.string.zc_org_progreso); progressBarRangeInfo = ProgressBarRangeInfo(current + 1f, 1f..max(steps.size.toFloat(), 1f)) },
            ) { Box(Modifier.fillMaxWidth(progress).fillMaxHeight().clip(pill).background(c.primary)) }
        }
    }
}

// ---------- Resumen de errores (zc-form-summary) ----------

data class ZcFormError(val id: String, val message: String)

/**
 * Resumen de errores al tope del formulario (zc-form-summary). Al fallar el envío, quien llama pide el foco con `focusRequester`:
 * el resumen se anuncia de inmediato y cada error es un toque que lleva al campo (`onGo`). Sin errores no ocupa espacio.
 */
@Composable
fun ZcFormSummary(errors: List<ZcFormError>, onGo: (String) -> Unit, modifier: Modifier = Modifier, focusRequester: FocusRequester? = null) {
    if (errors.isEmpty()) return
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val shape = RoundedCornerShape(ZcRadius.md)
    Row(
        modifier.fillMaxWidth().then(if (focusRequester != null) Modifier.focusRequester(focusRequester).focusable() else Modifier)
            .clip(shape).background(c.dangerBg).border(1.dp, c.dangerBd, shape).padding(16.dp)
            .semantics { liveRegion = LiveRegionMode.Assertive },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ZcIcon(ZcIcons.sDangerCircle, null, Modifier.padding(top = 2.dp), tint = c.dangerFg)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            ZcText(
                if (errors.size == 1) ctx.getString(R.string.zc_org_revisa_campo) else ctx.getString(R.string.zc_org_revisa_campos, errors.size),
                Modifier.semantics { heading() }, style = ZcTextTw.base, weight = ZcWeight.semibold, color = c.dangerFg,
            )
            errors.forEach { e ->
                Box(Modifier.fillMaxWidth().heightIn(min = ZcSize.targetSm).clickable(role = Role.Button) { onGo(e.id) }, contentAlignment = Alignment.CenterStart) {
                    ZcText(e.message, style = ZcTextTw.sm.copy(textDecoration = TextDecoration.Underline), color = c.dangerFg)
                }
            }
        }
    }
}

// ---------- Deslizadores (zc-slider, zc-range-slider) ----------

private fun plainFloat(v: Float) = if (v % 1f == 0f) v.toLong().toString() else v.toString()

/** Núcleo de los dos deslizadores: una o dos perillas sobre la misma pista, con paso, separación mínima y respuesta háptica por paso. */
@Composable
private fun SliderCore(
    values: List<Float>, onValues: (List<Float>) -> Unit, lo: Float, hi: Float, step: Float, minGap: Float, enabled: Boolean,
    labels: List<String?>, format: (Float) -> String, modifier: Modifier,
) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    val density = LocalDensity.current
    var active by remember { mutableIntStateOf(0) }
    val span = (hi - lo).takeIf { it > 0f } ?: 1f
    fun snap(v: Float): Float {
        val s = if (step > 0f) lo + ((v - lo) / step).roundToInt() * step else v
        return s.coerceIn(lo, hi)
    }
    fun set(idx: Int, raw: Float) {
        val v = snap(raw)
        val next = values.toMutableList()
        if (values.size == 1) next[0] = v
        else if (idx == 0) next[0] = min(v, values[1] - minGap).coerceAtLeast(lo)
        else next[1] = max(v, values[0] + minGap).coerceAtMost(hi)
        if (next != values) { haptic(ZcHaptic.SELECTION); onValues(next) }
    }
    BoxWithConstraints(modifier.fillMaxWidth().height(ZcSize.target).alpha(if (enabled) 1f else ZcOpacity.disabled)) {
        val widthPx = constraints.maxWidth.toFloat()
        val radius = with(density) { 12.dp.toPx() }
        val travel = (widthPx - 2 * radius).coerceAtLeast(1f)
        fun xOf(v: Float) = radius + (v - lo) / span * travel
        fun valueAt(x: Float) = lo + ((x - radius) / travel).coerceIn(0f, 1f) * span
        fun nearest(x: Float) = if (values.size == 1) 0 else values.indices.minBy { kotlin.math.abs(xOf(values[it]) - x) }
        Box(
            Modifier.fillMaxSize().then(
                if (!enabled) Modifier else Modifier
                    .pointerInput(values.size, lo, hi, step, minGap) { detectTapGestures { p -> val i = nearest(p.x); active = i; set(i, valueAt(p.x)) } }
                    .pointerInput(values.size, lo, hi, step, minGap) {
                        detectHorizontalDragGestures(onDragStart = { p -> active = nearest(p.x) }) { change, _ -> set(active, valueAt(change.position.x)); change.consume() }
                    },
            ),
        ) {
            androidx.compose.foundation.Canvas(Modifier.fillMaxSize()) {
                val h = 6.dp.toPx(); val top = (size.height - h) / 2f; val r = CornerRadius(h / 2f)
                drawRoundRect(c.surface3, Offset(0f, top), Size(size.width, h), r)
                val from = if (values.size == 1) radius else xOf(values[0])
                val to = xOf(values.last())
                drawRoundRect(c.primary, Offset(if (values.size == 1) 0f else from, top), Size(to - (if (values.size == 1) 0f else from), h), r)
            }
            values.forEachIndexed { i, v ->
                Box(
                    Modifier.align(Alignment.CenterStart).offset { IntOffset((xOf(v) - 22.dp.toPx()).roundToInt(), 0) }.size(44.dp, ZcSize.target)
                        .semantics {
                            labels.getOrNull(i)?.let { contentDescription = it }
                            stateDescription = format(v)
                            progressBarRangeInfo = ProgressBarRangeInfo(v, lo..hi, if (step > 0f) ((hi - lo) / step).toInt() - 1 else 0)
                            if (enabled) setProgress { target -> set(i, target); true }
                        },
                    contentAlignment = Alignment.Center,
                ) { Box(Modifier.size(24.dp).shadow(2.dp, CircleShape).clip(CircleShape).background(c.surface).border(2.dp, c.primary, CircleShape)) }
            }
        }
    }
}

/**
 * Deslizador de un valor (zc-slider), para ir dentro de un [ZcField]. Paso a paso con háptica; para TalkBack es ajustable
 * (subir y bajar) y anuncia `format(valor)` ("4,5 %"). Pista de 6 dp, perilla de 24 dp con área de toque de 44.
 */
@Composable
fun ZcSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..100f,
    step: Float = 1f,
    enabled: Boolean = true,
    label: String? = null,
    format: (Float) -> String = ::plainFloat,
) = SliderCore(listOf(value), { onValueChange(it[0]) }, valueRange.start, valueRange.endInclusive, step, 0f, enabled, listOf(label), format, modifier)

/** Deslizador de rango (zc-range-slider): dos perillas que no se cruzan (`minGap`), anunciadas como "mínimo" y "máximo". */
@Composable
fun ZcRangeSlider(
    value: ClosedFloatingPointRange<Float>,
    onValueChange: (ClosedFloatingPointRange<Float>) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..100f,
    step: Float = 1f,
    minGap: Float = 0f,
    enabled: Boolean = true,
    minLabel: String? = null,
    maxLabel: String? = null,
    format: (Float) -> String = ::plainFloat,
) {
    val ctx = LocalContext.current
    SliderCore(
        listOf(value.start, value.endInclusive), { onValueChange(it[0]..it[1]) }, valueRange.start, valueRange.endInclusive, step, minGap, enabled,
        listOf(minLabel ?: ctx.getString(R.string.zc_mol_slider_minimo), maxLabel ?: ctx.getString(R.string.zc_mol_slider_maximo)), format, modifier,
    )
}

// ---------- Hora (zc-time-field) ----------

/**
 * Campo de hora (zc-time-field): se escribe hh:mm (24 h, los dos puntos se ponen solos) o se elige con el selector de hora del
 * sistema (patrón nativo, como la fecha). El ícono de reloj, a la derecha, lo abre. Valor: "hh:mm", o el texto escrito si aún
 * no está completo; `null` si está vacío.
 */
@Composable
fun ZcTimeField(
    value: String?,
    onValueChange: (String?) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
    info: String? = null,
    required: Boolean = false,
    optional: Boolean = false,
    enabled: Boolean = true,
) {
    val ctx = LocalContext.current
    ZcTextField(
        value ?: "", { raw -> onValueChange(ZcDates.maskHm(raw).ifEmpty { null }) }, label, modifier,
        placeholder = ctx.getString(R.string.zc_ui_formato_hora), hint = hint, error = error, info = info, required = required, optional = optional, enabled = enabled,
        keyboardType = KeyboardType.Number, allowed = Regex("[0-9:]"), maxLength = 5,
        trailingIcon = ZcIcons.sClockCircle, trailingLabel = ctx.getString(R.string.zc_ui_elegir_hora),
        onTrailingClick = {
            val (h, m) = value?.takeIf { ZcDates.isValidHm(it) }?.let { it.substring(0, 2).toInt() to it.substring(3).toInt() } ?: (9 to 0)
            TimePickerDialog(ctx, { _, hh, mm -> onValueChange("%02d:%02d".format(hh, mm)) }, h, m, true).show()
        },
    )
}

// ---------- Contraseña (zc-password-field, zc-password-rules) ----------

/**
 * Contraseña nueva con medidor de seguridad (zc-password-field): mostrar y ocultar con un solo ícono, cuatro barras
 * (peligro, aviso, info, éxito) y el nivel anunciado. El medidor no reemplaza el mensaje del campo: los errores siguen
 * en el campo. Los requisitos van aparte, con [ZcPasswordRules].
 */
@Composable
fun ZcPasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: (() -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val score = ZcPassword.score(value)
    val bar = when (score) { 1 -> c.dangerFg; 2 -> c.warningFg; 3 -> c.infoFg; else -> c.successFg }
    val level = ctx.getString(when (score) { 1 -> R.string.zc_mol_clave_nivel_1; 2 -> R.string.zc_mol_clave_nivel_2; 3 -> R.string.zc_mol_clave_nivel_3; 4 -> R.string.zc_mol_clave_nivel_4; else -> R.string.zc_mol_clave_nivel_0 })
    ZcTextField(
        value, onValueChange, label, modifier, hint = hint, error = error, required = required, enabled = enabled, password = true,
        imeAction = imeAction, onImeAction = onImeAction,
        below = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(Modifier.fillMaxWidth().clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    repeat(4) { i -> Box(Modifier.weight(1f).height(6.dp).clip(CircleShape).background(if (score >= i + 1) bar else c.surface3)) }
                }
                ZcText(ctx.getString(R.string.zc_mol_clave_seguridad, level), Modifier.semantics { liveRegion = LiveRegionMode.Polite }, style = ZcType.caption, color = c.textMuted)
            }
        },
    )
}

/** Requisitos de la contraseña (zc-password-rules): ícono y texto, y "cumplido" o "pendiente" para TalkBack. */
@Composable
fun ZcPasswordRules(value: String, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val checks = ZcPassword.checks(value)
    val rules = listOf(R.string.zc_mol_clave_regla_len to checks.len, R.string.zc_mol_clave_regla_case to checks.case, R.string.zc_mol_clave_regla_num to checks.num, R.string.zc_mol_clave_regla_sym to checks.sym)
    Column(modifier.fillMaxWidth().semantics { contentDescription = ctx.getString(R.string.zc_mol_clave_requisitos) }, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        rules.forEach { (res, ok) ->
            val text = ctx.getString(res)
            val tone = if (ok) c.successFg else c.textMuted
            Row(
                Modifier.clearAndSetSemantics { contentDescription = "$text, ${ctx.getString(if (ok) R.string.zc_mol_clave_cumplido else R.string.zc_mol_clave_pendiente)}" },
                horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically,
            ) {
                ZcIcon(if (ok) ZcIcons.sCheckCircle else ZcIcons.sCloseCircle, null, size = ZcSize.iconSm, tint = tone)
                ZcText(text, style = ZcType.caption, color = tone)
            }
        }
    }
}

// ---------- Secreto (zc-secret-field) ----------

/**
 * Credencial enmascarada (zc-secret-field): los últimos 4 caracteres a la vista, mostrar (solo con `canReveal`; avisa por
 * `onRevealed` para la auditoría) y copiar con confirmación. Copiar siempre copia el valor real, marcado como sensible para
 * que Android no lo muestre en la vista previa del portapapeles. El estado "visible" no se conserva al rotar ni al volver.
 */
@Composable
fun ZcSecretField(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    canReveal: Boolean = true,
    keepPrefix: String = "",
    toasts: ZcToastState? = null,
    onRevealed: () -> Unit = {},
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val view = LocalView.current
    val haptic = rememberZcHaptics()
    var shown by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    LaunchedEffect(copied) { if (copied) { delay(1600); copied = false } }
    val density = LocalDensity.current
    val shape = RoundedCornerShape(ZcRadius.sm)
    ZcField(label, modifier, hint = hint) {
        Row(Modifier.fillMaxWidth().heightIn(min = ZcSize.target).clip(shape).background(c.surface2).border(1.dp, c.borderStrong, shape), verticalAlignment = Alignment.CenterVertically) {
            // Los puntos se ajustan al ancho: el prefijo y los últimos 4 caracteres (lo que identifica la credencial) siempre se ven.
            BoxWithConstraints(Modifier.weight(1f)) {
                val charPx = with(density) { 14.sp.toPx() } * 0.62f * 1.02f
                val fit = ((constraints.maxWidth - with(density) { 32.dp.toPx() }) / charPx).toInt()
                val bullets = (fit - keepPrefix.length - 4).coerceIn(4, 16)
                val shownText = if (shown) value else keepPrefix + "•".repeat(bullets) + value.takeLast(4)
                CompositionLocalProvider(LocalZcFontFamily provides FontFamily.Monospace) {
                    ZcText(shownText, Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), style = ZcTextTw.sm.copy(letterSpacing = 0.02.em), color = c.text, maxLines = 1)
                }
            }
            if (canReveal) FieldIconButton(
                if (shown) ZcIcons.sEyeClosed else ZcIcons.sEye, ctx.getString(if (shown) R.string.zc_mol_secreto_ocultar else R.string.zc_mol_secreto_mostrar, label),
            ) {
                shown = !shown
                if (shown) { onRevealed(); toasts?.info(ctx.getString(R.string.zc_mol_secreto_visible, label), ctx.getString(R.string.zc_mol_secreto_auditado)) }
            }
            FieldIconButton(if (copied) ZcIcons.lCheck else ZcIcons.sCopy, ctx.getString(if (copied) R.string.zc_mol_secreto_copiada else R.string.zc_mol_secreto_copiar, label)) {
                runCatching {
                    val clip = ClipData.newPlainText(label, value)
                    clip.description.extras = PersistableBundle().apply { putBoolean("android.content.extra.IS_SENSITIVE", true) }
                    (ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(clip)
                }
                haptic(ZcHaptic.CONFIRM)
                copied = true
                val done = ctx.getString(R.string.zc_mol_secreto_copiada_toast, label)
                toasts?.success(done)
                view.announceForAccessibility(done)
            }
        }
    }
}

// ---------- Etiquetas (zc-tags-field) ----------

enum class ZcTagKind { EMAIL, TEXT }

private val EMAIL = Regex("""^[^\s@]+@[^\s@]+\.[^\s@]{2,}$""")

/**
 * Varias etiquetas (por lo general correos) en un campo (zc-tags-field). Coma, punto y coma, espacio o "Listo" del teclado
 * agregan; pegar una lista la separa; Retroceso con el campo vacío quita la última. Cada etiqueta se valida por separado
 * (inválida con texto para TalkBack); las repetidas se avisan y no se agregan; con `max`, al llegar al tope el campo lo dice.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcTagsField(
    value: List<String>,
    onValueChange: (List<String>) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    kind: ZcTagKind = ZcTagKind.EMAIL,
    max: Int? = null,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    optional: Boolean = false,
    enabled: Boolean = true,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val flash = rememberZcFlash()
    val name = fieldName(label, required)
    var text by remember { mutableStateOf("") }
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    var wasFocused by remember { mutableStateOf(false) }
    val full = max != null && value.size >= max
    fun valid(t: String) = kind != ZcTagKind.EMAIL || EMAIL.matches(t)

    fun add(items: List<String>) {
        val cur = value.toMutableList()
        var repeated = false
        for (raw in items) {
            val t = raw.trim()
            if (t.isEmpty()) continue
            if (cur.any { it.equals(t, ignoreCase = true) }) { repeated = true; continue }
            if (max != null && cur.size >= max) { flash.show(ctx.getString(R.string.zc_ui_maximo_etiquetas, max)); break }
            cur += t
        }
        if (repeated) flash.show(ctx.getString(R.string.zc_ui_repetido))
        if (cur.size != value.size) onValueChange(cur)
    }
    fun commit() {
        val v = text.trim().trimEnd(',', ';')
        text = ""
        if (v.isNotEmpty()) add(listOf(v))
    }

    ZcField(label, modifier, required, optional, hint, error, enabled = enabled, flash = flash) {
        FlowRow(
            Modifier.fillMaxWidth().heightIn(min = ZonacardsTheme.shape.fieldH).zcControl(focused, error != null || flash.message != null, !enabled, false)
                .padding(start = 12.dp, end = 8.dp, top = 4.dp, bottom = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(2.dp), itemVerticalAlignment = Alignment.CenterVertically,
        ) {
            value.forEach { t -> ZcChip(t, onRemove = if (enabled) ({ onValueChange(value.filter { it != t }) }) else null, invalid = !valid(t), enabled = enabled) }
            BasicTextField(
                value = text,
                onValueChange = { raw ->
                    val pasted = raw.length - text.length > 1
                    if (pasted || raw.any { it == ',' || it == ';' || it.isWhitespace() }) {
                        val parts = raw.split(Regex("[,;\\s]+"))
                        if (pasted) { add(parts); text = "" } else { add(parts.dropLast(1)); text = parts.last() }
                    } else text = raw
                },
                modifier = Modifier.widthIn(min = 160.dp).heightIn(min = ZcSize.targetSm)
                    .onFocusChanged { if (wasFocused && !it.isFocused) commit(); wasFocused = it.isFocused }
                    .onPreviewKeyEvent { e ->
                        if (e.key == Key.Backspace && e.type == KeyEventType.KeyDown && text.isEmpty() && value.isNotEmpty()) { onValueChange(value.dropLast(1)); true } else false
                    }
                    .semantics {
                        contentDescription = name
                        (flash.message ?: error)?.let { this.error(it) }
                    },
                enabled = enabled && !full,
                singleLine = true,
                textStyle = ZcTextTw.base.copy(color = c.text, fontFamily = LocalZcFontFamily.current),
                cursorBrush = SolidColor(c.text),
                interactionSource = source,
                keyboardOptions = KeyboardOptions(
                    keyboardType = if (kind == ZcTagKind.EMAIL) KeyboardType.Email else KeyboardType.Text,
                    capitalization = KeyboardCapitalization.None, imeAction = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(onDone = { commit() }),
                decorationBox = { inner ->
                    Box(Modifier.heightIn(min = ZcSize.targetSm), contentAlignment = Alignment.CenterStart) {
                        val ph = if (full) ctx.getString(R.string.zc_ui_maximo_alcanzado) else placeholder
                        if (text.isEmpty() && ph != null) ZcText(ph, style = ZcTextTw.base, color = c.textSubtle, maxLines = 1)
                        inner()
                    }
                },
            )
        }
    }
}
