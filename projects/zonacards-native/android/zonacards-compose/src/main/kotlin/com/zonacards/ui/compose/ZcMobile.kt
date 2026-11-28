package com.zonacards.ui.compose

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.clickable
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import java.util.concurrent.Executors

/**
 * Escáner de QR y códigos de barras (zc-scanner) con CameraX y ML Kit: visor oscuro con guía de 240 (radio 20), máscara,
 * esquinas, línea de escaneo animada (se detiene con "Quitar animaciones") y mensaje anunciado. Barra con Linterna, Ingresar
 * código (camino manual, siempre visible) y Cambiar cámara. Pide el permiso de cámara al iniciar; si se niega, lo explica
 * y deja el camino manual. Lee QR, Code 128 y EAN-13; al leer vibra, se detiene y emite `onScanned`.
 */
@Composable
fun ZcScanner(onScanned: (String) -> Unit, onManual: () -> Unit, modifier: Modifier = Modifier, toasts: ZcToastState? = null) {
    val ctx = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current
    val haptic = rememberZcHaptics()
    val c = ZonacardsTheme.colors
    var granted by remember { mutableStateOf(ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    var denied by remember { mutableStateOf(false) }
    var torch by remember { mutableStateOf(false) }
    var back by remember { mutableStateOf(true) }
    var live by remember { mutableStateOf(false) }
    var done by remember { mutableStateOf(false) }
    var hint by remember { mutableStateOf(ctx.getString(R.string.zc_mol_escaner_apunta)) }
    var camera by remember { mutableStateOf<Camera?>(null) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { ok -> granted = ok; denied = !ok }
    LaunchedEffect(Unit) { if (!granted) launcher.launch(Manifest.permission.CAMERA) }
    val shownHint = if (denied) ctx.getString(R.string.zc_mol_escaner_sin_permiso) else hint
    val camName = ctx.getString(if (back) R.string.zc_mol_escaner_trasera else R.string.zc_mol_escaner_frontal)

    Column(modifier.fillMaxWidth().background(c.cameraBg)) {
        Box(Modifier.weight(1f).fillMaxWidth().heightIn(min = 380.dp)) {
            if (granted && !done) {
                val previewView = remember { PreviewView(ctx).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }
                AndroidView({ previewView }, Modifier.fillMaxSize().clearAndSetSemantics { })
                DisposableEffect(back, granted) {
                    val providerFuture = ProcessCameraProvider.getInstance(ctx)
                    val executor = Executors.newSingleThreadExecutor()
                    val scanner = BarcodeScanning.getClient(BarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_CODE_128, Barcode.FORMAT_EAN_13).build())
                    providerFuture.addListener({
                        val provider = providerFuture.get()
                        val preview = Preview.Builder().build().also { it.surfaceProvider = previewView.surfaceProvider }
                        val analysis = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                        analysis.setAnalyzer(executor) { proxy ->
                            val media = proxy.image
                            if (media == null || done) { proxy.close(); return@setAnalyzer }
                            scanner.process(InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees))
                                .addOnSuccessListener { list -> list.firstOrNull()?.rawValue?.let { v -> if (!done) { done = true; hint = ctx.getString(R.string.zc_mol_escaner_leido); haptic(ZcHaptic.CONFIRM); onScanned(v) } } }
                                .addOnCompleteListener { proxy.close() }
                        }
                        provider.unbindAll()
                        camera = provider.bindToLifecycle(lifecycle, if (back) CameraSelector.DEFAULT_BACK_CAMERA else CameraSelector.DEFAULT_FRONT_CAMERA, preview, analysis)
                        camera?.cameraControl?.enableTorch(torch)
                        live = true; hint = ctx.getString(R.string.zc_mol_escaner_buscando)
                    }, ContextCompat.getMainExecutor(ctx))
                    onDispose { runCatching { providerFuture.get().unbindAll() }; scanner.close(); executor.shutdown(); live = false }
                }
            }
            ScannerOverlay()
            ZcText(
                shownHint, style = ZcType.body.copy(shadow = Shadow(c.cameraMask, Offset(0f, 1f), 4f)), color = c.cameraFg, textAlign = TextAlign.Center,
                modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 24.dp).semantics { liveRegion = LiveRegionMode.Polite },
            )
        }
        Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CamButton(ZcIcons.lSparkles, ctx.getString(R.string.zc_mol_escaner_linterna), Modifier.weight(1f), pressed = torch) {
                torch = !torch; camera?.cameraControl?.enableTorch(torch)
                toasts?.info(ctx.getString(if (torch) R.string.zc_mol_escaner_linterna_on else R.string.zc_mol_escaner_linterna_off))
            }
            CamButton(ZcIcons.sPen, ctx.getString(R.string.zc_mol_escaner_ingresar), Modifier.weight(1f), onClick = onManual)
            CamButton(ZcIcons.sRefresh, ctx.getString(R.string.zc_mol_escaner_camara), Modifier.weight(1f), a11y = ctx.getString(R.string.zc_mol_escaner_cambiar_camara, camName)) {
                back = !back
                toasts?.info(ctx.getString(R.string.zc_mol_escaner_camara_n, ctx.getString(if (back) R.string.zc_mol_escaner_trasera else R.string.zc_mol_escaner_frontal)))
            }
        }
    }
}

/** Máscara fuera de la guía de 240, esquinas de 36 con trazo de 4 y línea de escaneo con el acento de la marca. */
@Composable
private fun ScannerOverlay() {
    val c = ZonacardsTheme.colors
    val t by rememberInfiniteTransition(label = "scan").animateFloat(0f, 1f, infiniteRepeatable(tween(2200, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "y")
    BoxWithConstraints(Modifier.fillMaxSize().clearAndSetSemantics { }) {
        Canvas(Modifier.fillMaxSize()) {
            val g = 240.dp.toPx(); val r = 20.dp.toPx()
            val left = (size.width - g) / 2; val top = (size.height - g) / 2
            val hole = Path().apply { addRoundRect(RoundRect(left, top, left + g, top + g, CornerRadius(r))) }
            clipPath(hole, ClipOp.Difference) { drawRect(c.cameraMask) }
            val k = 36.dp.toPx(); val s = Stroke(4.dp.toPx(), cap = StrokeCap.Round); val o = 2.dp.toPx()
            for ((x, y, dx, dy) in listOf(listOf(left - o, top - o, 1f, 1f), listOf(left + g + o, top - o, -1f, 1f), listOf(left - o, top + g + o, 1f, -1f), listOf(left + g + o, top + g + o, -1f, -1f))) {
                val p = Path().apply { moveTo(x, y + dy * k); lineTo(x, y + dy * r); quadraticTo(x, y, x + dx * r, y); lineTo(x + dx * k, y) }
                drawPath(p, c.cameraFg, style = s)
            }
            val inset = 12.dp.toPx(); val y = top + inset + t * (g - inset - 14.dp.toPx())
            drawLine(c.brandAccent.copy(alpha = 0.35f), Offset(left + inset, y), Offset(left + g - inset, y), 12.dp.toPx())
            drawLine(c.brandAccent, Offset(left + inset, y), Offset(left + g - inset, y), 2.dp.toPx())
        }
    }
}

/** Botón de la barra de la cámara: 64 de alto, radio 16, ícono arriba y texto de 12; `pressed` lo invierte (linterna encendida). */
@Composable
private fun CamButton(@DrawableRes icon: Int, label: String, modifier: Modifier, pressed: Boolean? = null, a11y: String? = null, onClick: () -> Unit) {
    val c = ZonacardsTheme.colors
    val on = pressed == true
    Column(
        modifier.heightIn(min = 64.dp).clip(RoundedCornerShape(16.dp)).background(if (on) c.cameraFg else c.cameraBtn)
            .then(if (pressed != null) Modifier.toggleable(pressed, role = Role.Button) { onClick() } else Modifier.clickable(role = Role.Button, onClick = onClick))
            .then(if (a11y != null) Modifier.semantics { contentDescription = a11y } else Modifier)
            .padding(vertical = 8.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterVertically),
    ) {
        ZcIcon(icon, null, tint = if (on) c.cameraBg else c.cameraFg)
        ZcText(label, style = ZcTextTw.xs, color = if (on) c.cameraBg else c.cameraFg, textAlign = TextAlign.Center)
    }
}

enum class ZcPermissionTone { INFO, WARNING }

/**
 * Explicación previa a un permiso (zc-permission-prompt): ícono en recuadro de 88 (radio 28), título, texto y los botones que
 * pone la pantalla ("Permitir" y siempre "Ahora no"). Se muestra justo antes de usar la función, nunca al abrir la app;
 * WARNING es para el permiso negado, con un camino a Ajustes.
 */
@Composable
fun ZcPermissionPrompt(@DrawableRes icon: Int, title: String, text: String, modifier: Modifier = Modifier, tone: ZcPermissionTone = ZcPermissionTone.INFO, actions: @Composable () -> Unit) {
    val c = ZonacardsTheme.colors
    val t = toneColors(if (tone == ZcPermissionTone.INFO) ZcTone.INFO else ZcTone.WARNING)
    Column(modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.size(88.dp).clip(RoundedCornerShape(28.dp)).background(t.bg), contentAlignment = Alignment.Center) { ZcIcon(icon, null, size = 32.dp, tint = t.fg) }
        ZcText(title, style = ZcType.titleSm, weight = ZcWeight.bold, textAlign = TextAlign.Center)
        ZcText(text, style = ZcTextTw.sm, color = c.textMuted, textAlign = TextAlign.Center)
        Column(Modifier.fillMaxWidth().padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { actions() }
    }
}

/** Vista previa de una notificación push (zc-push-preview): para mostrar cómo llegará el aviso. TalkBack la lee como imagen. */
@Composable
fun ZcPushPreview(app: String, time: String, title: String, text: String, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    Row(
        modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(c.pushBg).clearAndSetSemantics { contentDescription = "$app: $title. $text" }.padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(Modifier.size(34.dp).clip(RoundedCornerShape(8.dp)).background(c.primary), contentAlignment = Alignment.Center) { ZcText(app.take(1), style = ZcType.caption, weight = ZcWeight.bold, color = c.onPrimary) }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Row { ZcText(app, style = ZcTextTw.xs, weight = ZcWeight.bold, color = c.pushFg, modifier = Modifier.weight(1f)); ZcText(time, style = ZcTextTw.xs, color = c.pushMuted) }
            ZcText(title, style = ZcType.caption, weight = ZcWeight.bold, color = c.pushFg)
            ZcText(text, style = ZcType.caption, color = c.pushFg)
        }
    }
}

