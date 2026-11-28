import SwiftUI
import UIKit
import ZonacardsTokens

// MARK: - Hoja legal y consentimiento

/// Una sección de un documento legal: encabezado y párrafos.
public struct ZCLegalSection: Identifiable {
    public let title: String
    public let paragraphs: [String]
    public var id: String { title }

    public init(title: String, paragraphs: [String]) {
        self.title = title
        self.paragraphs = paragraphs
    }
}

/// Términos o política de privacidad: título, versión y secciones.
public struct ZCLegalDocument {
    public let title: String
    public let version: String?
    public let sections: [ZCLegalSection]

    public init(title: String, version: String? = nil, sections: [ZCLegalSection]) {
        self.title = title
        self.version = version
        self.sections = sections
    }
}

private struct ZCLegalBody: View {
    @Environment(\.zcTheme) private var theme
    let document: ZCLegalDocument?
    let error: Bool
    let onRetry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            if error {
                ZCAlert(ZCString.text("mol.legal.error.titulo"), tone: .warning, text: ZCString.text("mol.legal.error.texto")) {
                    ZCAlertAction(ZCString.text("mol.legal.error.reintentar"), action: onRetry)
                }
            } else if let document {
                ForEach(document.sections) { s in
                    VStack(alignment: .leading, spacing: ZCSpace.v2) {
                        Text(s.title).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(theme.colors.text).accessibilityAddTraits(.isHeader)
                        ForEach(Array(s.paragraphs.enumerated()), id: \.offset) { _, p in
                            Text(p).font(.zc(ZCType.body, theme: theme)).foregroundStyle(theme.colors.textMuted)
                        }
                    }
                }
            } else {
                ZCSkeleton(lines: 6)
            }
        }
    }
}

public extension View {
    /// Términos o privacidad en una hoja inferior: encabezados y párrafos, versión en el subtítulo y un botón en el pie. En un registro `confirmLabel`
    /// es "Aceptar" y `onConfirm` marca la casilla; por defecto, "Entendido" solo cierra. El texto lo trae la app (`document`; nulo mientras carga, con
    /// esqueleto). Con `error` muestra el aviso con Reintentar.
    func zcLegalSheet(
        isPresented: Binding<Bool>, title: String, document: ZCLegalDocument?, error: Bool = false, onRetry: @escaping () -> Void = {},
        confirmLabel: String? = nil, onConfirm: @escaping () -> Void = {}
    ) -> some View {
        zcSheet(
            isPresented: isPresented, title: document?.title ?? title, subtitle: document?.version.map { ZCString.text("mol.legal.version", $0) },
            footer: {
                ZCFooterButton(confirmLabel ?? ZCString.text("mol.legal.entendido")) { onConfirm(); isPresented.wrappedValue = false }
                    .disabled(document == nil)
            },
            content: { ZCLegalBody(document: document, error: error, onRetry: onRetry) }
        )
    }
}

/// Aceptación de términos en una caja: casilla, enlaces para leer los términos y la política (la app abre `zcLegalSheet`) y, ya aceptados,
/// el chip "Términos aceptados". `error` marca la casilla cuando se intenta continuar sin aceptar.
public struct ZCLegalConsent: View {
    @Environment(\.zcTheme) private var theme
    private let checked: Binding<Bool>
    private let onOpenTerms: () -> Void
    private let onOpenPrivacy: () -> Void
    private let error: Bool

    public init(checked: Binding<Bool>, error: Bool = false, onOpenTerms: @escaping () -> Void, onOpenPrivacy: @escaping () -> Void) {
        self.checked = checked
        self.error = error
        self.onOpenTerms = onOpenTerms
        self.onOpenPrivacy = onOpenPrivacy
    }

    public var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: ZCSpace.v3) {
            ZCCheckbox(isOn: checked, label: ZCString.text("mol.legal.acepto"), invalid: error && !checked.wrappedValue)
            ZCFlowLayout(spacing: ZCSpace.v4, lineSpacing: 0) {
                ZCButton(ZCString.text("mol.legal.leerTerminos"), variant: .link, action: onOpenTerms)
                ZCButton(ZCString.text("mol.legal.leerPrivacidad"), variant: .link, action: onOpenPrivacy)
            }
            if error && !checked.wrappedValue {
                Text(ZCString.text("mol.legal.requerido")).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.dangerFg)
            }
            if checked.wrappedValue { ZCBadge(ZCString.text("mol.legal.aceptados"), tone: .success, icon: .sCheckCircle) }
        }
        .padding(ZCSpace.v4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(c.surface2, in: RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous))
    }
}

// MARK: - Ayuda y soporte

/// Canales de contacto; los que faltan no se muestran. Teléfonos en formato internacional (+51900000099).
public struct ZCSupportInfo: Sendable {
    public let hours: String?
    public let phone: String?
    public let whatsapp: String?
    public let email: String?
    public let url: String?

    public init(hours: String? = nil, phone: String? = nil, whatsapp: String? = nil, email: String? = nil, url: String? = nil) {
        self.hours = hours
        self.phone = phone
        self.whatsapp = whatsapp
        self.email = email
        self.url = url
    }
}

/// Qué hace cada fila al tocarla. Por defecto abre la app del sistema (teléfono, WhatsApp, correo o navegador).
public struct ZCSupportActions {
    public let call: (String) -> Void
    public let whatsapp: (String) -> Void
    public let email: (String) -> Void
    public let web: (String) -> Void

    public init(call: @escaping (String) -> Void, whatsapp: @escaping (String) -> Void, email: @escaping (String) -> Void, web: @escaping (String) -> Void) {
        self.call = call
        self.whatsapp = whatsapp
        self.email = email
        self.web = web
    }

    public static let system: ZCSupportActions = {
        func open(_ s: String) { if let url = URL(string: s) { UIApplication.shared.open(url) } }
        return ZCSupportActions(
            call: { open("tel:\($0)") },
            whatsapp: { open("https://wa.me/" + $0.filter(\.isNumber)) },
            email: { open("mailto:\($0)") },
            web: { open($0) }
        )
    }()
}

/// "+51900000099" → "+51 900 000 099": prefijo de país conocido y el resto en grupos de tres (fijo de 8 dígitos: "1 700 8000").
public func zcPrettyPhone(_ e164: String) -> String {
    let digits = e164.filter(\.isNumber)
    let match = ZCDomainData.dialCountries
        .sorted { $0.dial.count > $1.dial.count }
        .first { digits.hasPrefix($0.dial.filter(\.isNumber)) }
    guard let dial = match else { return e164 }
    let rest = String(digits.dropFirst(dial.dial.filter(\.isNumber).count))
    if rest.count == 8 {
        let r = Array(rest)
        return "\(dial.dial) \(r[0]) \(String(r[1...3])) \(String(r[4...]))"
    }
    return "\(dial.dial) \(ZCPhone.format(rest))"
}

private struct ZCSupportRow: View {
    @Environment(\.zcTheme) private var theme
    let icon: ZCIconName
    let channel: String
    let value: String
    let action: () -> Void

    var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        Button(action: action) {
            HStack(spacing: ZCSpace.v3) {
                ZCIcon(icon, size: ZCSize.iconMd).foregroundStyle(c.text).frame(width: 44, height: 44).background(c.surface2, in: Circle())
                VStack(alignment: .leading, spacing: 0) {
                    Text(channel).font(.zc(ZCType.bodySm, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text)
                    Text(value).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                ZCIcon(.sAltArrowRight, size: ZCSize.iconSm).foregroundStyle(c.textMuted)
            }
            .padding(.horizontal, ZCSpace.v4)
            .padding(.vertical, ZCSpace.v3)
            .frame(minHeight: 64)
            .background(c.surface, in: shape)
            .overlay(shape.stroke(c.border))
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ZCString.text("mol.soporte.fila", channel, value))
        .accessibilityAddTraits(.isButton)
    }
}

private struct ZCSupportBody: View {
    @Environment(\.zcTheme) private var theme
    let info: ZCSupportInfo
    let actions: ZCSupportActions

    var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            if let hours = info.hours {
                HStack(spacing: ZCSpace.v3) {
                    ZCIcon(.sClockCircle, size: ZCSize.iconMd).foregroundStyle(c.text)
                    VStack(alignment: .leading, spacing: 0) {
                        Text(ZCString.text("mol.soporte.horario")).font(.zc(ZCType.bodySm, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text)
                        Text(hours).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted)
                    }
                }
                .padding(ZCSpace.v4)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(c.surface2, in: RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous))
                .accessibilityElement(children: .combine)
            }
            if let phone = info.phone { ZCSupportRow(icon: .sPhone, channel: ZCString.text("mol.soporte.llamar"), value: zcPrettyPhone(phone)) { actions.call(phone) } }
            if let wa = info.whatsapp { ZCSupportRow(icon: .sChatRoundDots, channel: ZCString.text("mol.soporte.whatsapp"), value: zcPrettyPhone(wa)) { actions.whatsapp(wa) } }
            if let mail = info.email { ZCSupportRow(icon: .sLetter, channel: ZCString.text("mol.soporte.correo"), value: mail) { actions.email(mail) } }
            if let url = info.url { ZCSupportRow(icon: .lExternalLink, channel: ZCString.text("mol.soporte.centro"), value: ZCString.text("mol.soporte.centroTexto")) { actions.web(url) } }
        }
    }
}

public extension View {
    /// "Ayuda y soporte" en una hoja inferior: horario y una fila por canal disponible (llamar, WhatsApp, correo, centro de ayuda). Cada fila es un
    /// solo botón accesible con el canal y el dato, de 64 pt.
    func zcSupportSheet(isPresented: Binding<Bool>, info: ZCSupportInfo, actions: ZCSupportActions = .system) -> some View {
        zcSheet(
            isPresented: isPresented, title: ZCString.text("mol.soporte.titulo"), subtitle: ZCString.text("mol.soporte.texto"),
            footer: { ZCFooterButton(ZCString.text("ui.cerrar"), variant: .outline) { isPresented.wrappedValue = false } },
            content: { ZCSupportBody(info: info, actions: actions) }
        )
    }
}
