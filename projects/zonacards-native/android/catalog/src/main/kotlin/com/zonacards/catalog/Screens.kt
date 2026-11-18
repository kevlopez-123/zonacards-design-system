package com.zonacards.catalog

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSpace
import com.zonacards.ui.tokens.ZcType

/** Columna desplazable con el margen del catálogo. */
@Composable
private fun Page(content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(24.dp), content = content)
}

/** Bloque titulado de una variante (como zc-ds-section de la web). */
@Composable
private fun Section(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ZcText(title, style = ZcType.titleSm, weight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
        content()
    }
}

@Composable
fun HomeScreen(onOpen: (CatalogSection) -> Unit) {
    val icons = mapOf(
        CatalogSection.FUNDAMENTOS to ZcIcons.sPallete2, CatalogSection.ATOMOS to ZcIcons.sWidget2, CatalogSection.FORMULARIOS to ZcIcons.sPen,
        CatalogSection.ESTRUCTURA to ZcIcons.sLayers, CatalogSection.DOMINIO to ZcIcons.sWidget4,
    )
    Page {
        ZcText("Componentes del sistema de diseño Zonacards en Jetpack Compose. Elige marca y tema con ⋮.", color = ZonacardsTheme.colors.textMuted)
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            for (s in CatalogSection.entries) ZcCard(s.title, subtitle = s.subtitle, icon = icons.getValue(s), onClick = { onOpen(s) })
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FoundationsScreen() {
    val c = ZonacardsTheme.colors
    val swatches = listOf(
        "primary" to c.primary, "secondary" to c.secondary, "bg" to c.bg, "surface" to c.surface, "surface-2" to c.surface2, "surface-3" to c.surface3,
        "border" to c.border, "border-strong" to c.borderStrong, "text" to c.text, "text-muted" to c.textMuted, "focus" to c.focus,
        "success" to c.successFg, "warning" to c.warningFg, "danger" to c.dangerFg, "info" to c.infoFg, "accent" to c.accentFg, "brand-accent" to c.brandAccent,
    )
    Page {
        Section("Color") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                for ((name, color) in swatches) Column(Modifier.width(96.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(Modifier.fillMaxWidth().height(48.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(color).border(1.dp, c.border, RoundedCornerShape(ZcRadius.sm)))
                    ZcText(name, style = ZcType.caption, color = c.textMuted)
                }
            }
        }
        Section("Tipografía") {
            listOf("display-lg" to ZcType.displayLg, "display" to ZcType.display, "heading" to ZcType.heading, "title" to ZcType.title, "title-sm" to ZcType.titleSm,
                "body" to ZcType.body, "body-sm" to ZcType.bodySm, "caption" to ZcType.caption, "tiny" to ZcType.tiny).forEach { (n, s) ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { ZcText(n, style = ZcType.caption, color = c.textMuted, modifier = Modifier.width(80.dp)); ZcText("Giftcards para tu equipo", style = s) }
            }
        }
        Section("Espacios y radios") {
            listOf(4, 8, 12, 16, 24, 32, 48).forEach { n -> Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { ZcText("$n", style = ZcType.caption, modifier = Modifier.width(32.dp)); Box(Modifier.width(n.dp).height(12.dp).background(c.primary)) } }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                for ((n, r) in listOf("xs" to ZcRadius.xs, "sm" to ZcRadius.sm, "ms" to ZcRadius.ms, "md" to ZcRadius.md, "lg" to ZcRadius.lg)) Column {
                    Box(Modifier.size(48.dp).clip(RoundedCornerShape(r)).background(c.surface3)); ZcText(n, style = ZcType.caption, color = c.textMuted)
                }
            }
            ZcText("Espacio base: ${ZcSpace.v4}", style = ZcType.caption, color = c.textMuted)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AtomsScreen() {
    val c = ZonacardsTheme.colors
    var sw by remember { mutableStateOf(true) }
    var ck by remember { mutableStateOf(ToggleableState.Indeterminate) }
    var radio by remember { mutableStateOf("b") }
    var chip by remember { mutableStateOf(true) }
    Page {
        Section("Botones") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcButton("Crear lote", {}, leadingIcon = ZcIcons.sAddCircle); ZcButton("Exportar", {}, variant = ZcButtonVariant.OUTLINE)
                ZcButton("Secundario", {}, variant = ZcButtonVariant.SECONDARY, size = ZcButtonSize.SM); ZcButton("Ghost", {}, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM)
                ZcButton("Anular", {}, variant = ZcButtonVariant.DANGER, size = ZcButtonSize.SM); ZcButton("Guardando", {}, loading = true)
                ZcButton("Deshabilitado", {}, enabled = false); ZcIconButton(ZcIcons.lX, "Cerrar", {}, variant = ZcButtonVariant.OUTLINE)
            }
            Row(Modifier.background(c.primary).padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.runtime.CompositionLocalProvider(LocalZcOnPrimary provides true) { ZcButton("Aprobar", {}, size = ZcButtonSize.SM); ZcButton("Exportar", {}, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM) }
            }
        }
        Section("Estados y etiquetas") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (s in listOf("pendiente_aprobacion", "activo", "agotado", "parcialmente_anulado", "anulado")) ZcStateBadge(ZcStates.lot, s)
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcAvatar("Lucía Mendoza", size = ZcAvatarSize.SM); ZcAvatar("Kevin López", presence = true); ZcAvatar("Zonacards", size = ZcAvatarSize.LG, brand = true, square = true)
                ZcAvatarGroup(listOf("Ana Ruiz", "Luis Paz", "Eva Soto", "Max Lee", "Rosa Vega", "Iván Gil"), "6 personas", max = 4)
            }
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcChip("Activos", selected = chip, onSelectedChange = { chip = it }); ZcChip("Lima", onRemove = {}); ZcChip("correo@", invalid = true)
            }
        }
        Section("Controles") {
            ZcSwitch(sw, { sw = it }, label = "Notificaciones por correo", description = "Resumen diario a las 9:00")
            ZcSwitch(false, {}, label = "Interruptor chico", size = ZcControlSize.SM)
            ZcCheckbox(ck, { ck = if (ck == ToggleableState.On) ToggleableState.Off else ToggleableState.On }, label = "Todos los países")
            ZcRadioGroup(listOf(ZcRadioOption("a", "Envío inmediato"), ZcRadioOption("b", "Programado", "Elige fecha y hora")), radio, { radio = it }, label = "Cuándo enviar")
            ZcRadioGroup(listOf(ZcRadioOption("std", "Estándar", icon = ZcIcons.sLetter, subtitle = "Correo con PDF", aside = "Gratis"), ZcRadioOption("wa", "WhatsApp", icon = ZcIcons.sChatRoundDots, subtitle = "Mensaje con enlace", aside = "S/ 0.10")), radio, { radio = it }, label = "Canal", variant = ZcRadioVariant.CARD)
        }
        Section("Progreso y carga") {
            ZcProgress(0.62f, label = "Carga de códigos")
            ZcProgress(0.92f, label = "Cupo usado", variant = ZcProgressVariant.METER)
            ZcProgress(null, label = "Procesando")
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) { ZcProgress(0.4f, variant = ZcProgressVariant.CIRCULAR, label = "Avance"); ZcSpinner() }
            ZcSkeleton(variant = ZcSkeletonVariant.CARD)
        }
    }
}

@Composable
fun FormsScreen() {
    var email by remember { mutableStateOf("ana@empresa") }
    var pass by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf<Double?>(1250.5) }
    var phone by remember { mutableStateOf("987654321") }
    var cc by remember { mutableStateOf("pe") }
    var tax by remember { mutableStateOf("") }
    var country by remember { mutableStateOf<String?>(null) }
    var channels by remember { mutableStateOf(setOf("email")) }
    var date by remember { mutableStateOf<String?>("2026-03-05") }
    var q by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    val pinState = rememberZcPinPadState()
    Page {
        ZcTextField(email, { email = it }, "Correo", required = true, error = if ('.' !in email.substringAfter('@', "")) "Ingresa un correo válido, ej. ana@empresa.com" else null, keyboardType = androidx.compose.ui.text.input.KeyboardType.Email, placeholder = "nombre@empresa.com")
        ZcTextField(pass, { pass = it }, "Contraseña", password = true, hint = "8 caracteres o más", info = "Usa mayúsculas, números y un símbolo.")
        ZcTextArea(note, { note = it }, "Motivo", optional = true, maxLength = 200)
        ZcMoneyField(amount, { amount = it }, "Monto", country = "pe")
        ZcPhoneField(phone, { phone = it }, cc, { cc = it }, "Celular")
        ZcTaxIdField(tax, { tax = it }, country = "cl")
        ZcSelect(listOf("pe" to "Perú", "ec" to "Ecuador", "bo" to "Bolivia", "co" to "Colombia", "cl" to "Chile", "mx" to "México").map { ZcSelectOption(it.first, it.second) }, country, { country = it }, "País")
        ZcMultiSelect(listOf("email" to "Correo", "sms" to "SMS", "wa" to "WhatsApp", "push" to "Push").map { ZcSelectOption(it.first, it.second) }, channels, { channels = it }, "Canales")
        ZcDateField(date, { date = it }, "Vigencia desde", min = "2026-01-01")
        ZcSearchField(q, { q = it }, placeholder = "Buscar lote o código")
        ZcOtpField(otp, { otp = it }, "Código de verificación", hint = "Te lo enviamos por SMS.")
        ZcPinPad(pin, { pin = it }, onComplete = { if (it != "1234") pinState.reject() }, onBiometric = {}, state = pinState)
    }
}

@Composable
fun StructureScreen(toasts: ZcToastState) {
    var sheet by remember { mutableStateOf(false) }
    var modal by remember { mutableStateOf(false) }
    var drawer by remember { mutableStateOf(false) }
    var alert by remember { mutableStateOf(false) }
    var nav by remember { mutableStateOf("lotes") }
    var refreshing by remember { mutableStateOf(false) }
    Column {
        ZcOfflineBanner(3, Modifier.padding(16.dp))
        Page {
            Section("Overlays") {
                ZcButton("Abrir bottom sheet", { sheet = true }, variant = ZcButtonVariant.OUTLINE, block = true)
                ZcButton("Abrir modal", { modal = true }, variant = ZcButtonVariant.OUTLINE, block = true)
                ZcButton("Abrir drawer de filtros", { drawer = true }, variant = ZcButtonVariant.OUTLINE, block = true)
                ZcButton("Anular lote", { alert = true }, variant = ZcButtonVariant.DANGER, block = true)
            }
            Section("Avisos") {
                ZcButton("Aviso de éxito", { toasts.success("Lote creado", "Ya puedes descargar los códigos.") }, variant = ZcButtonVariant.OUTLINE, block = true)
                ZcButton("Error con reintento", { toasts.error("No se pudo guardar", actionLabel = "Reintentar", onAction = {}) }, variant = ZcButtonVariant.OUTLINE, block = true)
            }
            Section("Estados") {
                ZcState("Sin lotes en este periodo", text = "Prueba con otro periodo o país.") { ZcButton("Limpiar filtros", {}, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM) }
                ZcState("No se pudo cargar los lotes", kind = ZcStateKind.ERROR, text = "Tus filtros se conservaron.", reference = "ZC-7F3A", details = ZcTechDetails("LOTES_503", "lotes-api", "18/11/2026 10:42"), onCopied = { toasts.success("Detalles copiados", "Pégalos en tu mensaje a soporte.") }) {
                    ZcButton("Reintentar", {}, size = ZcButtonSize.SM)
                }
            }
            Section("Fila deslizable") {
                ZcSwipeItem(listOf(ZcAction("archivar", "Archivar", ZcIcons.sInbox), ZcAction("anular", "Anular", ZcIcons.sCloseCircle, true)), { toasts.info("Acción: $it") }, "Acciones de Lote #02830") {
                    Column { ZcText("Lote #02830", weight = FontWeight.SemiBold); ZcText("Desliza a la izquierda", style = ZcType.caption, color = ZonacardsTheme.colors.textMuted) }
                }
            }
            Section("Deslizar para actualizar") {
                ZcPullRefresh(refreshing, { refreshing = true; toasts.info("Actualizando…") }, Modifier.height(160.dp)) {
                    Column(Modifier.verticalScroll(rememberScrollState())) { repeat(8) { ZcText("Fila ${it + 1}", modifier = Modifier.padding(8.dp)) } }
                }
                if (refreshing) ZcButton("Terminar", { refreshing = false }, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM)
            }
        }
    }
    ZcBottomNav(listOf(ZcNavItem("inicio", "Inicio", ZcIcons.sHome2), ZcNavItem("lotes", "Lotes", ZcIcons.sBox), ZcNavItem("avisos", "Avisos", ZcIcons.sInbox, badge = "3")), nav, { nav = it })
    if (sheet) ZcBottomSheet({ sheet = false }, "Acciones del lote") {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcText("Elige un país para ver cómo se abre una subpantalla dentro del sheet.")
            var p by remember { mutableStateOf<String?>(null) }
            ZcSelect(listOf(ZcSelectOption("pe", "Perú"), ZcSelectOption("cl", "Chile")), p, { p = it }, "País")
        }
    }
    if (modal) ZcModal({ modal = false }, "Editar destinatario", "Los cambios se aplican al próximo envío.", footer = {
        ZcFooterButton("Cancelar", { modal = false }, ZcButtonVariant.OUTLINE); ZcFooterButton("Guardar", { modal = false; toasts.success("Destinatario guardado") })
    }) { var n by remember { mutableStateOf("Ana Ruiz") }; ZcTextField(n, { n = it }, "Nombre") }
    if (drawer) ZcDrawer({ drawer = false }, "Filtros", footer = {
        ZcFooterButton("Limpiar", {}, ZcButtonVariant.OUTLINE); ZcFooterButton("Ver resultados", { drawer = false })
    }) { var s by remember { mutableStateOf(setOf<String>()) }; ZcMultiSelect(listOf(ZcSelectOption("activo", "Activo"), ZcSelectOption("agotado", "Agotado")), s, { s = it }, "Estado") }
    if (alert) ZcAlertDialog("¿Anular el lote #02829?", "Los 1.200 códigos dejarán de funcionar. Esta acción no se puede deshacer.", "Anular lote",
        { alert = false; toasts.success("Solicitud enviada", "Pendiente de aprobación.") }, "Cancelar", { alert = false }, danger = true, reasonLabel = "Motivo", confirmWord = "ANULAR")
}

@Composable
fun DomainScreen(toasts: ZcToastState) {
    var scan by remember { mutableStateOf(false) }
    var kpi by remember { mutableStateOf(false) }
    var step by remember { mutableStateOf(1) }
    var lines by remember { mutableStateOf(listOf(ZcCartLine("1", "Giftcard Cine", "Cineplanet", 50.0, 2), ZcCartLine("2", "Spa relax", "Zen", 120.0, 1, note = "Para Ana"))) }
    var fav by remember { mutableStateOf(false) }
    var back by remember { mutableStateOf(false) }
    if (scan) { ZcScanner({ scan = false; toasts.success("Código leído", it) }, { scan = false; toasts.info("Ingreso manual") }, Modifier.fillMaxWidth(), toasts); return }
    Page {
        Section("KPI") {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ZcKpi("Ventas", "S/ 12,500", Modifier.weight(1f), icon = ZcIcons.sWallet, delta = 8.2, deltaLabel = "vs. mes", trend = listOf(2.0, 3.0, 2.5, 4.0, 5.0))
                ZcKpi("Anulados", "38", Modifier.weight(1f), delta = 12.0, invert = true, filter = true, pressed = kpi, onPressedChange = { kpi = it })
            }
        }
        Section("Tarjeta de listado") {
            ZcCard("Lote #02829", subtitle = "Perú · 1.200 códigos", icon = ZcIcons.sBox, onClick = { toasts.info("Abrir detalle") },
                aside = { ZcStateBadge(ZcStates.lot, "activo") },
                footer = { ZcText("Vence 31/03/27", style = ZcType.caption); ZcMoneyText(150000.0, "pe", style = ZcType.caption) }) {
                ZcProgress(0.62f, label = "Canjeados", variant = ZcProgressVariant.METER)
            }
        }
        Section("Producto y medios de pago") {
            ZcProductCard("Giftcard Cineplanet", 50.0, "pe", description = "Entradas y combos en todo el país.", isNew = true, favorite = fav, onFavoriteChange = { fav = it }, onBuy = { toasts.success("Agregado al carrito") })
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { for (m in ZcPayMethod.entries) ZcPayBadge(m) }
        }
        Section("Wallet") {
            ZcSwitch(back, { back = it }, label = "Ver reverso")
            ZcWalletPass(ZcLoyaltyPass("Zona Puntos", "Lucía Mendoza", 12500, "Oro", Color(0xFF111827), Color.White, Color(0xFFF8AE23), "ZP-0001-7788"), back = back)
            ZcGiftcardPass(ZcGiftcardData("Cineplanet", "Giftcard S/ 100", 100.0, "6011000099991234", pin = "1234", expires = "2027-03-31", bg = Color(0xFF1E3A8A), fg = Color.White, label = Color(0xFFBFDBFE), terms = "Válida en todo el Perú.", support = "soporte@zonacards.com"), "pe", back = back)
        }
        Section("Escáner") {
            ZcPermissionPrompt(ZcIcons.sQrCodeBold, "Usa la cámara para escanear", "Solo la usamos mientras escaneas el vale.") {
                ZcButton("Escanear", { scan = true }, block = true); ZcButton("Ahora no", {}, variant = ZcButtonVariant.GHOST, block = true)
            }
        }
        Section("Checkout") {
            ZcCheckoutSteps(listOf(ZcCheckoutStep("a", "Destinatario", "ana@empresa.com"), ZcCheckoutStep("b", "Pago", "Yape"), ZcCheckoutStep("c", "Confirmación")), step, { step = it }) { i ->
                ZcButton(if (i < 2) "Guardar y continuar" else "Pagar", { if (i < 2) step = i + 1 else toasts.success("Pago confirmado") }, block = true)
            }
            ZcCart(lines, { lines = it }, "pe", discount = 30.0, fees = listOf(ZcCartFee("Cargo por servicio", 5.0, "Cubre el envío digital")), toasts = toasts) {
                ZcButton("Ver catálogo", { lines = listOf(ZcCartLine("1", "Giftcard Cine", "Cineplanet", 50.0, 1)) }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
            }
        }
        Section("Notificación") { ZcPushPreview("Zonacards", "ahora", "Lote aprobado", "El lote #02829 ya está activo.") }
    }
}
