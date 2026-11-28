import SwiftUI
import ZonacardsTokens

// MARK: - Eliminar mi cuenta

/// Solicitud de eliminación ya registrada: abierta (en trámite) o rechazada.
public struct ZCDeletionRequest {
    public let open: Bool
    /// Estado para mostrar ("Pendiente", "En revisión").
    public let statusLabel: String
    public let requestedAt: Date
    public let rejectReason: String?

    public init(open: Bool, statusLabel: String, requestedAt: Date, rejectReason: String? = nil) {
        self.open = open
        self.statusLabel = statusLabel
        self.requestedAt = requestedAt
        self.rejectReason = rejectReason
    }
}

/// Eliminar mi cuenta (la App Store lo exige). Explica qué pasa, pide un código que llega al correo y un motivo opcional, y registra una solicitud
/// que atiende el equipo: la cuenta sigue activa hasta entonces. La app envía el código, valida y registra:
/// - Sin solicitud: consecuencias, "Enviar código" y, con `maskedEmail`, código de 6 dígitos, motivo y "Solicitar eliminación".
/// - Con una solicitud abierta: su estado y fecha, y Volver. Rechazada: aviso con el motivo y se puede volver a pedir.
/// `error` (código inválido, sin red) se muestra en el campo del código.
public struct ZCDeleteAccount: View {
    @Environment(\.zcTheme) private var theme
    @State private var code = ""
    @State private var reason = ""
    @State private var tried = false
    private let request: ZCDeletionRequest?
    private let maskedEmail: String?
    private let onSendCode: () -> Void
    private let onSubmit: (_ code: String, _ reason: String?) -> Void
    private let onBack: () -> Void
    private let sending: Bool
    private let submitting: Bool
    private let error: String?
    private let consequences: [String]?
    private let lang: String

    public init(
        request: ZCDeletionRequest?, maskedEmail: String?, sending: Bool = false, submitting: Bool = false, error: String? = nil,
        consequences: [String]? = nil, lang: String = "es", onSendCode: @escaping () -> Void,
        onSubmit: @escaping (_ code: String, _ reason: String?) -> Void, onBack: @escaping () -> Void
    ) {
        self.request = request
        self.maskedEmail = maskedEmail
        self.sending = sending
        self.submitting = submitting
        self.error = error
        self.consequences = consequences
        self.lang = lang
        self.onSendCode = onSendCode
        self.onSubmit = onSubmit
        self.onBack = onBack
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        let items = consequences ?? ["mol.eliminarCuenta.consecuencia1", "mol.eliminarCuenta.consecuencia2", "mol.eliminarCuenta.consecuencia3"].map { ZCString.text($0) }
        VStack(alignment: .leading, spacing: 20) {
            if let request, request.open {
                Text(ZCString.text("mol.eliminarCuenta.estado", request.statusLabel)).font(.zc(ZCType.heading, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text).accessibilityAddTraits(.isHeader)
                Text(ZCString.text("mol.eliminarCuenta.registrada", ZCDates.format(request.requestedAt, .medium, lang: lang))).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted)
                ZCButton(ZCString.text("mol.eliminarCuenta.volver"), block: true, action: onBack)
            } else {
                if let request, !request.open {
                    ZCAlert(ZCString.text("mol.eliminarCuenta.rechazada"), tone: .danger, text: request.rejectReason)
                }
                Text(ZCString.text("mol.eliminarCuenta.queSucede")).font(.zc(ZCType.heading, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text).accessibilityAddTraits(.isHeader)
                VStack(alignment: .leading, spacing: ZCSpace.v3) {
                    ForEach(Array(items.enumerated()), id: \.offset) { i, t in
                        HStack(alignment: .top, spacing: ZCSpace.v2) {
                            Text("\(i + 1).").font(.zc(ZCType.body, theme: theme).weight(ZCWeight.bold)).foregroundStyle(c.text)
                            Text(t).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text).frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
                if let maskedEmail {
                    HStack(spacing: ZCSpace.v3) {
                        ZCIcon(.sLetter, size: ZCSize.iconMd).foregroundStyle(c.text).frame(width: 44, height: 44).background(c.surface, in: Circle())
                        Text(ZCString.text("mol.eliminarCuenta.enviadoA", maskedEmail)).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(ZCSpace.v4)
                    .background(c.surface2, in: shape)
                    .overlay(shape.stroke(c.border))
                    .accessibilityElement(children: .combine)
                    ZCOtpField(ZCString.text("mol.eliminarCuenta.codigo"), value: $code, error: error ?? ((tried && code.count < 6) ? ZCString.text("mol.eliminarCuenta.codigoIncompleto") : nil))
                    ZCTextField(ZCString.text("mol.eliminarCuenta.motivo"), text: Binding(get: { reason }, set: { reason = String($0.prefix(500)) }), optional: true, multiline: true)
                    ZCButton(ZCString.text("mol.eliminarCuenta.solicitar"), variant: .danger, loading: submitting, block: true) {
                        if code.count == 6 {
                            let r = reason.trimmingCharacters(in: .whitespacesAndNewlines)
                            onSubmit(code, r.isEmpty ? nil : r)
                        } else { tried = true }
                    }
                } else {
                    ZCButton(ZCString.text("mol.eliminarCuenta.enviarCodigo"), variant: .outline, leadingIcon: .sLetter, loading: sending, block: true, action: onSendCode)
                }
            }
        }
        .padding(ZCSpace.v5)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(c.surface, in: shape)
        .overlay(shape.stroke(c.border))
    }
}

// MARK: - Permisos y notificaciones

public enum ZCPermissionTone: Sendable { case info, warning }

/// Explicación previa a un permiso (cámara, notificaciones, ubicación): ícono en recuadro de 88 pt (radio 28), título, texto y los botones que pone la
/// pantalla ("Permitir" y siempre "Ahora no"). Se muestra justo antes de usar la función, nunca al abrir la app; `warning` es para el permiso negado,
/// con un camino a Ajustes (`UIApplication.openSettingsURLString`). Los textos de uso (`NSCameraUsageDescription`…) van en la app cliente.
public struct ZCPermissionPrompt<Actions: View>: View {
    @Environment(\.zcTheme) private var theme
    private let icon: ZCIconName
    private let title: String
    private let text: String
    private let tone: ZCPermissionTone
    private let actions: Actions

    public init(icon: ZCIconName, title: String, text: String, tone: ZCPermissionTone = .info, @ViewBuilder actions: () -> Actions) {
        self.icon = icon
        self.title = title
        self.text = text
        self.tone = tone
        self.actions = actions()
    }

    public var body: some View {
        let c = theme.colors
        let t = theme.tone(tone == .info ? .info : .warning)
        VStack(spacing: ZCSpace.v3) {
            ZCIcon(icon, size: ZCSize.iconXl).foregroundStyle(t.fg).frame(width: 88, height: 88).background(t.bg, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
            Text(title).font(.zc(ZCType.titleSm, theme: theme).weight(ZCWeight.bold)).foregroundStyle(c.text).multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
            Text(text).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).multilineTextAlignment(.center)
            VStack(spacing: ZCSpace.v2) { actions }.padding(.top, ZCSpace.v2)
        }
        .frame(maxWidth: .infinity)
    }
}

/// Vista previa de una notificación push: para mostrar cómo llegará el aviso. VoiceOver la lee como imagen.
public struct ZCPushPreview: View {
    @Environment(\.zcTheme) private var theme
    private let app: String
    private let time: String
    private let title: String
    private let text: String

    public init(app: String, time: String, title: String, text: String) {
        self.app = app
        self.time = time
        self.title = title
        self.text = text
    }

    public var body: some View {
        let c = theme.colors
        HStack(alignment: .top, spacing: ZCSpace.v2) {
            Text(String(app.prefix(1))).font(.zc(ZCType.caption, theme: theme).weight(ZCWeight.bold)).foregroundStyle(c.onPrimary)
                .frame(width: 34, height: 34).background(c.primary, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            VStack(alignment: .leading, spacing: 1) {
                HStack {
                    Text(app).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).weight(ZCWeight.bold)).foregroundStyle(c.pushFg)
                    Spacer()
                    Text(time).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.pushMuted)
                }
                Text(title).font(.zc(ZCType.caption, theme: theme).weight(ZCWeight.bold)).foregroundStyle(c.pushFg)
                Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.pushFg)
            }
        }
        .padding(.horizontal, ZCSpace.v3)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(c.pushBg, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(app): \(title). \(text)")
        .accessibilityAddTraits(.isImage)
    }
}
