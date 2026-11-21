import AVFoundation
import LocalAuthentication
import SwiftUI
import UIKit
import ZonacardsTokens

// MARK: - Biometría

public enum ZCBiometricResult: Sendable {
    case success
    case cancelled
    case failed(String)
}

/// Face ID o Touch ID con el diálogo del sistema. Úsalo desde el botón de biometría de `ZCPinPad`. La app nunca ve los datos biométricos: solo recibe
/// éxito, cancelación o error. La app cliente debe declarar `NSFaceIDUsageDescription` en su Info.plist.
public enum ZCBiometric {
    /// `true` si el iPhone tiene biometría configurada.
    public static func available() -> Bool {
        var error: NSError?
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    /// Muestra el diálogo del sistema. `allowDeviceCredential` permite usar el código del iPhone como alternativa. `reason` es el texto que ve la persona.
    public static func authenticate(reason: String, cancelLabel: String, allowDeviceCredential: Bool = false) async -> ZCBiometricResult {
        let context = LAContext()
        context.localizedCancelTitle = cancelLabel
        let policy: LAPolicy = allowDeviceCredential ? .deviceOwnerAuthentication : .deviceOwnerAuthenticationWithBiometrics
        var error: NSError?
        guard context.canEvaluatePolicy(policy, error: &error) else { return .failed(error?.localizedDescription ?? "") }
        do {
            let ok = try await context.evaluatePolicy(policy, localizedReason: reason)
            return ok ? .success : .failed("")
        } catch let e as LAError {
            switch e.code {
            case .userCancel, .appCancel, .systemCancel, .userFallback: return .cancelled
            default: return .failed(e.localizedDescription)
            }
        } catch {
            return .failed(error.localizedDescription)
        }
    }
}

// MARK: - Cámara

/// Cámara con lectura de códigos (QR, Code 128, EAN-13). Solo se usa desde `ZCScanner`.
final class ZCScannerController: NSObject, AVCaptureMetadataOutputObjectsDelegate {
    let session = AVCaptureSession()
    private let queue = DispatchQueue(label: "zonacards.scanner")
    private var input: AVCaptureDeviceInput?
    private var configured = false
    var onCode: ((String) -> Void)?
    private(set) var device: AVCaptureDevice?

    var hasTorch: Bool { device?.hasTorch ?? false }

    /// `false` si no hay cámara (simulador) o no se pudo abrir.
    @discardableResult
    func configure(back: Bool) -> Bool {
        guard let dev = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: back ? .back : .front),
              let newInput = try? AVCaptureDeviceInput(device: dev) else { return false }
        session.beginConfiguration()
        if let input { session.removeInput(input) }
        if session.canAddInput(newInput) { session.addInput(newInput); input = newInput; device = dev }
        if !configured {
            let output = AVCaptureMetadataOutput()
            if session.canAddOutput(output) {
                session.addOutput(output)
                output.setMetadataObjectsDelegate(self, queue: .main)
                output.metadataObjectTypes = [.qr, .code128, .ean13].filter { output.availableMetadataObjectTypes.contains($0) }
                configured = true
            }
        }
        session.commitConfiguration()
        return input != nil
    }

    func start() { queue.async { if !self.session.isRunning { self.session.startRunning() } } }
    func stop() { queue.async { if self.session.isRunning { self.session.stopRunning() } }; setTorch(false) }

    func setTorch(_ on: Bool) {
        guard let device, device.hasTorch, (try? device.lockForConfiguration()) != nil else { return }
        device.torchMode = on ? .on : .off
        device.unlockForConfiguration()
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput objects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let value = (objects.first as? AVMetadataMachineReadableCodeObject)?.stringValue { onCode?(value) }
    }
}

private final class ZCPreviewView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}

private struct ZCCameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> UIView {
        let v = ZCPreviewView()
        v.previewLayer.session = session
        v.previewLayer.videoGravity = .resizeAspectFill
        v.isAccessibilityElement = false
        return v
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}

/// Máscara fuera de la guía de 240 pt, esquinas de 36 con trazo de 4 y línea de escaneo con el acento de la marca. Con "Reducir movimiento" la línea queda al medio.
private struct ZCScannerOverlay: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let c = theme.colors
        TimelineView(.animation(paused: reduceMotion)) { timeline in
            let phase = reduceMotion ? 0.5 : (1 - cos(timeline.date.timeIntervalSinceReferenceDate * 2 * .pi / 4.4)) / 2
            Canvas { ctx, size in
                let g: CGFloat = 240, r: CGFloat = 20
                let left = (size.width - g) / 2, top = (size.height - g) / 2
                let hole = CGRect(x: left, y: top, width: g, height: g)
                var mask = Path(CGRect(origin: .zero, size: size))
                mask.addRoundedRect(in: hole, cornerSize: CGSize(width: r, height: r))
                ctx.fill(mask, with: .color(c.cameraMask), style: FillStyle(eoFill: true))
                let k: CGFloat = 36, o: CGFloat = 2
                let corners: [(CGFloat, CGFloat, CGFloat, CGFloat)] = [(left - o, top - o, 1, 1), (left + g + o, top - o, -1, 1), (left - o, top + g + o, 1, -1), (left + g + o, top + g + o, -1, -1)]
                for (x, y, dx, dy) in corners {
                    var p = Path()
                    p.move(to: CGPoint(x: x, y: y + dy * k))
                    p.addLine(to: CGPoint(x: x, y: y + dy * r))
                    p.addQuadCurve(to: CGPoint(x: x + dx * r, y: y), control: CGPoint(x: x, y: y))
                    p.addLine(to: CGPoint(x: x + dx * k, y: y))
                    ctx.stroke(p, with: .color(c.cameraFg), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                }
                let inset: CGFloat = 12
                let y = top + inset + CGFloat(phase) * (g - inset - 14)
                var line = Path(); line.move(to: CGPoint(x: left + inset, y: y)); line.addLine(to: CGPoint(x: left + g - inset, y: y))
                ctx.stroke(line, with: .color(c.brandAccent.opacity(0.35)), lineWidth: 12)
                ctx.stroke(line, with: .color(c.brandAccent), lineWidth: 2)
            }
        }
        .accessibilityHidden(true)
    }
}

/// Botón de la barra de la cámara: 64 pt de alto, radio 16, ícono arriba y texto de 12; `pressed` lo invierte (linterna encendida).
private struct ZCCamButton: View {
    @Environment(\.zcTheme) private var theme
    let icon: ZCIconName
    let label: String
    var pressed: Bool?
    var a11y: String?
    let action: () -> Void

    var body: some View {
        let c = theme.colors
        let on = pressed == true
        Button(action: action) {
            VStack(spacing: ZCSpace.v1) {
                ZCIcon(icon, size: 20)
                Text(label).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).multilineTextAlignment(.center)
            }
            .foregroundStyle(on ? c.cameraBg : c.cameraFg)
            .frame(maxWidth: .infinity, minHeight: 64)
            .background(on ? c.cameraFg : c.cameraBtn, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(a11y ?? label)
        .accessibilityAddTraits(pressed == nil ? .isButton : (on ? [.isButton, .isSelected] : .isButton))
    }
}

/// Escáner de QR y códigos de barras con AVFoundation: visor oscuro con guía de 240 pt (radio 20), máscara, esquinas, línea de escaneo animada (quieta con
/// "Reducir movimiento") y mensaje anunciado. Barra con Linterna, Ingresar código (camino manual, siempre visible) y Cambiar cámara. Pide el permiso de cámara
/// al iniciar; si se niega, lo explica y deja el camino manual. Lee QR, Code 128 y EAN-13; al leer vibra, se detiene y emite `onScanned`.
/// La app cliente debe declarar `NSCameraUsageDescription` en su Info.plist. En el simulador no hay cámara: se muestra el aviso y el camino manual.
public struct ZCScanner: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.scenePhase) private var scenePhase
    private enum Access { case unknown, granted, denied }
    @State private var controller = ZCScannerController()
    @State private var access: Access = .unknown
    @State private var torch = false
    @State private var back = true
    @State private var hasCamera = true
    @State private var done = false
    @State private var hint = ZCString.text("mol.escaner.apunta")
    private let onScanned: (String) -> Void
    private let onManual: () -> Void
    private let toasts: ZCToastState?

    public init(toasts: ZCToastState? = nil, onScanned: @escaping (String) -> Void, onManual: @escaping () -> Void) {
        self.toasts = toasts
        self.onScanned = onScanned
        self.onManual = onManual
    }

    private func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: access = .granted
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { ok in DispatchQueue.main.async { access = ok ? .granted : .denied; if ok { open() } } }
            return
        default: access = .denied
        }
        if access == .granted { open() }
    }

    private func open() {
        hasCamera = controller.configure(back: back)
        controller.onCode = { value in
            guard !done else { return }
            done = true
            hint = ZCString.text("mol.escaner.leido")
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            controller.stop()
            onScanned(value)
        }
        if hasCamera { controller.start(); hint = ZCString.text("mol.escaner.buscando") } else { hint = ZCString.text("mol.escaner.sinLector") }
    }

    public var body: some View {
        let c = theme.colors
        let shown = access == .denied ? ZCString.text("mol.escaner.sinPermiso") : hint
        let camName = ZCString.text(back ? "mol.escaner.trasera" : "mol.escaner.frontal")
        VStack(spacing: 0) {
            ZStack(alignment: .bottom) {
                c.cameraBg
                if access == .granted && hasCamera && !done { ZCCameraPreview(session: controller.session).accessibilityHidden(true) }
                ZCScannerOverlay()
                Text(shown).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.cameraFg).multilineTextAlignment(.center)
                    .shadow(color: c.cameraMask, radius: 2, y: 1)
                    .padding(.horizontal, ZCSpace.v4).padding(.bottom, ZCSpace.v6)
                    .frame(maxWidth: .infinity)
                    .accessibilityAddTraits(.updatesFrequently)
            }
            .frame(maxWidth: .infinity, minHeight: 380)
            HStack(spacing: ZCSpace.v2) {
                ZCCamButton(icon: .lSparkles, label: ZCString.text("mol.escaner.linterna"), pressed: torch) {
                    torch.toggle(); controller.setTorch(torch)
                    toasts?.info(ZCString.text(torch ? "mol.escaner.linternaOn" : "mol.escaner.linternaOff"))
                }
                ZCCamButton(icon: .sPen, label: ZCString.text("mol.escaner.ingresar"), action: onManual)
                ZCCamButton(icon: .sRefresh, label: ZCString.text("mol.escaner.camara"), a11y: ZCString.text("mol.escaner.cambiarCamara", camName)) {
                    back.toggle(); torch = false
                    hasCamera = controller.configure(back: back)
                    toasts?.info(ZCString.text("mol.escaner.camaraN", ZCString.text(back ? "mol.escaner.trasera" : "mol.escaner.frontal")))
                }
            }
            .padding(ZCSpace.v3)
            .background(c.cameraBg)
        }
        .background(c.cameraBg)
        .onAppear(perform: start)
        .onDisappear { controller.stop() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active, access == .granted, hasCamera, !done { controller.start() } else if phase != .active { controller.stop() }
        }
        .accessibilityElement(children: .contain)
        .announcementOnChange(of: shown)
    }
}

private extension View {
    /// Anuncia a VoiceOver cada cambio del mensaje del escáner.
    func announcementOnChange(of text: String) -> some View {
        onChange(of: text) { _, new in AccessibilityNotification.Announcement(new).post() }
    }
}

// MARK: - Teclado de PIN

/// Estado del teclado de PIN: `reject()` tiembla, vibra y limpia (PIN incorrecto), como `reject()` de la web.
@Observable
public final class ZCPinPadState {
    public private(set) var shake = 0
    public init() {}
    public func reject() { shake += 1 }
}

/// Teclado de PIN en pantalla: puntos de 16 pt con borde de 2 (anunciados como "PIN, 2 de 4 dígitos"), teclas de 72 × 64 con radio 20 y número de 24,
/// separadas 12; biometría y borrar. Vibra en cada tecla; el error lleva ícono. El PIN nunca se muestra.
public struct ZCPinPad: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shakeX: CGFloat = 0
    private let value: Binding<String>
    private let length: Int
    private let onComplete: ((String) -> Void)?
    private let onBiometric: (() -> Void)?
    private let error: String?
    private let state: ZCPinPadState

    public init(value: Binding<String>, length: Int = 4, error: String? = nil, state: ZCPinPadState = ZCPinPadState(), onComplete: ((String) -> Void)? = nil, onBiometric: (() -> Void)? = nil) {
        self.value = value
        self.length = length
        self.error = error
        self.state = state
        self.onComplete = onComplete
        self.onBiometric = onBiometric
    }

    private func press(_ k: Character) {
        guard value.wrappedValue.count < length else { return }
        UISelectionFeedbackGenerator().selectionChanged()
        let v = value.wrappedValue + String(k)
        value.wrappedValue = v
        if v.count == length { onComplete?(v) }
    }

    private func key(_ text: String?, label: String, icon: ZCIconName? = nil, action: @escaping () -> Void) -> some View {
        let c = theme.colors
        return Button(action: action) {
            ZStack {
                if let text { Text(text).font(.zc(ZCTypeStyle(size: 24, lineHeight: 32, relativeTo: .title2), theme: theme).weight(.medium)).foregroundStyle(c.text) }
                else if let icon { ZCIcon(icon, size: 24).foregroundStyle(c.text) }
            }
            .frame(width: 72, height: 64)
            .background(text != nil ? c.surface2 : .clear, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    public var body: some View {
        let c = theme.colors
        let hasError = error != nil
        VStack(spacing: ZCSpace.v3) {
            HStack(spacing: ZCSpace.v4) {
                ForEach(0..<length, id: \.self) { i in
                    let filled = i < value.wrappedValue.count
                    Circle().fill(filled ? (hasError ? c.dangerFg : c.text) : .clear)
                        .overlay(Circle().stroke(hasError ? c.dangerFg : c.textMuted, lineWidth: 2))
                        .frame(width: 16, height: 16)
                }
            }
            .padding(.vertical, ZCSpace.v2)
            .offset(x: shakeX)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(ZCString.text("mol.pin.progreso", String(value.wrappedValue.count), String(length)))
            .accessibilityValue(error ?? "")
            if let error {
                HStack(spacing: 6) {
                    ZCIcon(.sDangerCircle, size: 16)
                    Text(error).font(.zc(ZCType.caption, theme: theme))
                }
                .foregroundStyle(c.dangerFg)
                .accessibilityHidden(true)
            }
            VStack(spacing: ZCSpace.v3) {
                ForEach(["123", "456", "789"], id: \.self) { row in
                    HStack(spacing: ZCSpace.v3) { ForEach(Array(row), id: \.self) { k in key(String(k), label: String(k)) { press(k) } } }
                }
                HStack(spacing: ZCSpace.v3) {
                    if let onBiometric { key(nil, label: ZCString.text("mol.pin.biometria"), icon: .lKeyRound) { UISelectionFeedbackGenerator().selectionChanged(); onBiometric() } }
                    else { Color.clear.frame(width: 72, height: 64) }
                    key("0", label: "0") { press("0") }
                    key(nil, label: ZCString.text("mol.pin.borrar"), icon: .lArrowLeft) {
                        if !value.wrappedValue.isEmpty { UISelectionFeedbackGenerator().selectionChanged(); value.wrappedValue.removeLast() }
                    }
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(ZCString.text("mol.pin.teclado"))
        }
        .onChange(of: state.shake) { _, n in
            guard n > 0 else { return }
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            if reduceMotion { value.wrappedValue = ""; return }
            Task {
                for x in [10.0, -10, 6, -6, 0] {
                    withAnimation(.linear(duration: 0.06)) { shakeX = CGFloat(x) }
                    try? await Task.sleep(nanoseconds: 60_000_000)
                }
                value.wrappedValue = ""
            }
        }
    }
}
