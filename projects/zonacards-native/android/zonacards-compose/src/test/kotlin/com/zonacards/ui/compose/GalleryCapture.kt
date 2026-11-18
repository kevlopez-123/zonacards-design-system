package com.zonacards.ui.compose

import android.graphics.Bitmap
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.printToString
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcBrand
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/** Galería de la ola 1 en claro y oscuro: deja PNG en build/gallery para revisión visual (base de las capturas de referencia de la fase 4). */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es-w400dp-h3200dp-xhdpi")
class GalleryCapture {
    @get:Rule val rule = createComposeRule()

    @Composable
    private fun Gallery() {
        val c = ZonacardsTheme.colors
        Column(Modifier.width(400.dp).background(c.bg).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcText("Botones", style = ZcType.title)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcButton("Crear lote", {}, leadingIcon = ZcIcons.sAddCircle)
                ZcButton("Exportar", {}, variant = ZcButtonVariant.OUTLINE)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcButton("Secundario", {}, variant = ZcButtonVariant.SECONDARY, size = ZcButtonSize.SM)
                ZcButton("Ghost", {}, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM)
                ZcButton("Anular", {}, variant = ZcButtonVariant.DANGER, size = ZcButtonSize.SM)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcButton("Guardando", {}, loading = true)
                ZcButton("Deshabilitado", {}, enabled = false)
                ZcIconButton(ZcIcons.lX, "Cerrar", {}, variant = ZcButtonVariant.OUTLINE)
            }
            Row(Modifier.background(c.primary).padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CompositionLocalProvider(LocalZcOnPrimary provides true) {
                    ZcButton("Aprobar", {}, size = ZcButtonSize.SM)
                    ZcButton("Exportar", {}, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
                }
            }
            ZcText("Estados", style = ZcType.title)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                ZcBadge("Activo", tone = ZcTone.SUCCESS, icon = ZcIcons.sCheckCircle)
                ZcBadge("Pendiente", tone = ZcTone.WARNING, icon = ZcIcons.sHourglass)
                ZcBadge("Anulado", tone = ZcTone.DANGER, icon = ZcIcons.sCloseCircle)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcAvatar("Lucía Mendoza", size = ZcAvatarSize.SM); ZcAvatar("Kevin López"); ZcAvatar("Zonacards", size = ZcAvatarSize.LG, brand = true)
                ZcChip("Activos", selected = true, onSelectedChange = {}); ZcChip("Lima", onRemove = {})
            }
            ZcSwitch(true, {}, label = "Notificaciones por correo", description = "Resumen diario a las 9:00")
            ZcCheckbox(ToggleableState.Indeterminate, {}, label = "Todos los países")
            ZcCheckbox(true, {}, label = "Perú")
            ZcRadioGroup(listOf(ZcRadioOption("a", "Envío inmediato"), ZcRadioOption("b", "Programado")), "b", {})
            ZcProgress(0.62f, label = "Carga de códigos", valueText = "62 %")
            ZcDivider()
            ZcSkeleton(variant = ZcSkeletonVariant.CARD)
        }
    }

    private fun capture(name: String, brand: ZcBrand, dark: Boolean) {
        rule.setContent { ZonacardsTheme(brand = brand, dark = dark) { Gallery() } }
        rule.mainClock.autoAdvance = false
        val bmp = rule.onRoot().captureToImage().asAndroidBitmap()
        val dir = File("build/gallery").apply { mkdirs() }
        File(dir, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun zonacardsLight() = capture("ola1-zonacards-claro", ZcBrand.ZONACARDS, false)
    @Test fun zonacardsDark() = capture("ola1-zonacards-oscuro", ZcBrand.ZONACARDS, true)
    @Composable
    private fun FormsGallery() {
        val c = ZonacardsTheme.colors
        Column(Modifier.width(400.dp).background(c.bg).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            ZcText("Formularios", style = ZcType.title)
            ZcTextField("ana@empresa", {}, label = "Correo", required = true, error = "Ingresa un correo válido, ej. ana@empresa.com")
            ZcTextField("Secreta1!", {}, label = "Contraseña", password = true, hint = "8 caracteres o más")
            ZcMoneyField(1250.5, {}, label = "Monto", country = "pe")
            ZcMoneyField(12345.0, {}, label = "Monto (Chile)", country = "cl")
            ZcPhoneField("987654321", {}, "pe", {}, label = "Celular")
            ZcTaxIdField("20100070970", {}, country = "pe")
            ZcSelect(listOf(ZcSelectOption("pe", "Perú")), "pe", {}, label = "País")
            ZcDateField("2026-03-05", {}, label = "Vigencia desde")
            ZcSearchField("lote 02829", {})
            ZcOtpField("1234", {}, label = "Código de verificación")
            ZcPinPad("12", {}, onBiometric = {})
        }
    }

    private fun captureForms(name: String, dark: Boolean) {
        rule.setContent { ZonacardsTheme(dark = dark) { FormsGallery() } }
        rule.mainClock.autoAdvance = false
        val bmp = rule.onRoot().captureToImage().asAndroidBitmap()
        val dir = File("build/gallery").apply { mkdirs() }
        File(dir, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun formsLight() = captureForms("ola2-formularios-claro", false)
    @Test fun formsDark() = captureForms("ola2-formularios-oscuro", true)

    @Composable
    private fun StructureGallery() {
        val c = ZonacardsTheme.colors
        val toasts = rememberZcToastState()
        androidx.compose.runtime.LaunchedEffect(Unit) { toasts.success("Lote creado", "Ya puedes descargar los códigos."); toasts.error("No se pudo guardar", actionLabel = "Reintentar") }
        androidx.compose.foundation.layout.Box(Modifier.width(400.dp).background(c.bg)) {
            Column {
                ZcTopBar("Lote #02829", subtitle = "Perú · 1.200 códigos", onBack = {}, action = { ZcMenu(listOf(ZcAction("a", "Anular", ZcIcons.sCloseCircle, true)), {}, "Acciones del lote") })
                ZcOfflineBanner(3)
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ZcSwipeItem(listOf(ZcAction("archivar", "Archivar", ZcIcons.sInbox), ZcAction("anular", "Anular", ZcIcons.sCloseCircle, true)), {}, "Acciones de Lote #02830") {
                        Column { ZcText("Lote #02830", weight = androidx.compose.ui.text.font.FontWeight.SemiBold); ZcText("S/ 12,500.00 · 500 códigos", style = ZcType.caption, color = c.textMuted) }
                    }
                    ZcState("Sin lotes en este periodo", text = "Prueba con otro periodo o país.") { ZcButton("Limpiar filtros", {}, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM) }
                    ZcState("No se pudo cargar los lotes", kind = ZcStateKind.ERROR, text = "Tus filtros se conservaron.", reference = "ZC-7F3A") { ZcButton("Reintentar", {}, size = ZcButtonSize.SM) }
                }
                ZcBottomNav(listOf(ZcNavItem("inicio", "Inicio", ZcIcons.sHome2), ZcNavItem("lotes", "Lotes", ZcIcons.sBox), ZcNavItem("avisos", "Avisos", ZcIcons.sInbox, badge = "3"), ZcNavItem("perfil", "Perfil", ZcIcons.sHomeSmile, ZcIcons.sHomeSmileBold)), "lotes", {})
            }
            ZcToaster(toasts, Modifier.padding(top = 120.dp))
        }
    }

    private fun captureStructure(name: String, dark: Boolean) {
        rule.setContent { ZonacardsTheme(dark = dark) { StructureGallery() } }
        rule.waitForIdle()
        rule.mainClock.autoAdvance = false
        rule.mainClock.advanceTimeBy(400)
        val bmp = rule.onRoot().captureToImage().asAndroidBitmap()
        File(File("build/gallery").apply { mkdirs() }, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
        val tree = rule.onAllNodes(androidx.compose.ui.test.isRoot()).printToString(maxDepth = 12)
        File("build/gallery/$name.txt").writeText(tree)
    }

    @Test fun structureLight() = captureStructure("ola3-estructura-claro", false)
    @Test fun structureDark() = captureStructure("ola3-estructura-oscuro", true)

    /** Letra grande del sistema (200 %): nada debe cortarse ni salirse. */
    private fun captureLargeText(name: String, content: @Composable () -> Unit) {
        rule.setContent {
            val d = androidx.compose.ui.platform.LocalDensity.current
            androidx.compose.runtime.CompositionLocalProvider(androidx.compose.ui.platform.LocalDensity provides androidx.compose.ui.unit.Density(d.density, 2f)) {
                ZonacardsTheme(dark = false) { content() }
            }
        }
        rule.waitForIdle()
        rule.mainClock.autoAdvance = false
        rule.mainClock.advanceTimeBy(400)
        val bmp = rule.onRoot().captureToImage().asAndroidBitmap()
        File(File("build/gallery").apply { mkdirs() }, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun formsLargeText() = captureLargeText("letra200-formularios") { FormsGallery() }
    @Test fun structureLargeText() = captureLargeText("letra200-estructura") { StructureGallery() }
    @Test fun atomsLargeText() = captureLargeText("letra200-atomos") { Gallery() }

    @Composable
    private fun DomainGallery() {
        val c = ZonacardsTheme.colors
        Column(Modifier.width(400.dp).background(c.bg).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ZcKpi("Ventas", "S/ 12,500", Modifier.weight(1f), icon = ZcIcons.sWallet, delta = 8.2, deltaLabel = "vs. mes", trend = listOf(2.0, 3.0, 2.5, 4.0, 5.0))
                ZcKpi("Anulados", "38", Modifier.weight(1f), delta = 12.0, invert = true)
            }
            ZcCard("Lote #02829", subtitle = "Perú · 1.200 códigos", icon = ZcIcons.sBox, onClick = {},
                aside = { ZcStateBadge(ZcStates.lot, "activo") },
                footer = { ZcText("Vence 31/03/27", style = ZcType.caption); ZcText("·", style = ZcType.caption); ZcMoneyText(150000.0, "pe", style = ZcType.caption) }) {
                ZcProgress(0.62f, label = "Canjeados", variant = ZcProgressVariant.METER)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { for (m in ZcPayMethod.entries) ZcPayBadge(m) }
            ZcWalletPass(ZcLoyaltyPass("Zona Puntos", "Lucía Mendoza", 12500, "Oro", androidx.compose.ui.graphics.Color(0xFF111827), androidx.compose.ui.graphics.Color.White, androidx.compose.ui.graphics.Color(0xFFF8AE23), "ZP-0001-7788"))
            ZcGiftcardPass(ZcGiftcardData("Cineplanet", "Giftcard S/ 100", 100.0, "6011000099991234", pin = "1234", expires = "2027-03-31", bg = androidx.compose.ui.graphics.Color(0xFF1E3A8A), fg = androidx.compose.ui.graphics.Color.White, label = androidx.compose.ui.graphics.Color(0xFFBFDBFE)), "pe")
            ZcCheckoutSteps(listOf(ZcCheckoutStep("a", "Destinatario", "ana@empresa.com"), ZcCheckoutStep("b", "Pago"), ZcCheckoutStep("c", "Confirmación")), 1, {}) { ZcButton("Guardar y continuar", {}, block = true) }
            ZcCart(listOf(ZcCartLine("1", "Giftcard Cine", "Cineplanet", 50.0, 2), ZcCartLine("2", "Spa relax", "Zen", 120.0, 1, note = "Para Ana")), {}, "pe", discount = 30.0, fees = listOf(ZcCartFee("Cargo por servicio", 5.0, "Cubre el envío digital")))
            ZcPermissionPrompt(ZcIcons.sQrCodeBold, "Usa la cámara para escanear", "Solo la usamos mientras escaneas el vale.") { ZcButton("Permitir cámara", {}, block = true); ZcButton("Ahora no", {}, variant = ZcButtonVariant.GHOST, block = true) }
            ZcPushPreview("Zonacards", "ahora", "Lote aprobado", "El lote #02829 ya está activo.")
        }
    }

    @Test fun domainLight() { rule.setContent { ZonacardsTheme(dark = false) { DomainGallery() } }; snap("ola4-dominio-claro") }
    @Test fun domainDark() { rule.setContent { ZonacardsTheme(dark = true) { DomainGallery() } }; snap("ola4-dominio-oscuro") }

    private fun snap(name: String) {
        rule.waitForIdle(); rule.mainClock.autoAdvance = false; rule.mainClock.advanceTimeBy(400)
        val bmp = rule.onRoot().captureToImage().asAndroidBitmap()
        File(File("build/gallery").apply { mkdirs() }, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test fun giftealoLight() = capture("ola1-giftealo-claro", ZcBrand.GIFTEALO, false)
}
