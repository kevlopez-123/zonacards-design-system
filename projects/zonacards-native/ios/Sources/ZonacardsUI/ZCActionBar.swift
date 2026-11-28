import SwiftUI
import ZonacardsTokens

/// Barra de acciones sobre una selección múltiple (equivale a ActionBar de HeroUI y a `zc-action-bar`): «N seleccionados», las acciones y
/// una X para quitar la selección. Aparece (sube y se funde) solo con `count` > 0 y VoiceOver anuncia el conteo cuando cambia.
/// La pone quien la usa, normalmente abajo: `.overlay(alignment: .bottom) { ZCActionBar(...).padding(.horizontal, 16) }`; ocupa todo el ancho que le des.
/// Es un teléfono: una acción con ícono se muestra solo con el ícono (su texto es la etiqueta de accesibilidad) y una sin ícono, con su texto.
/// Una acción con `disabledReason` queda deshabilitada y VoiceOver lo dice como valor; `danger` usa el botón suave de peligro.
/// Usa `ZCAction` como el menú de acciones (`id`, `label`, `icon`, `danger`, `disabledReason`).
public struct ZCActionBar: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private let count: Int
    private let actions: [ZCAction]
    private let onAction: (String) -> Void
    private let onClear: () -> Void

    public init(count: Int, actions: [ZCAction], onAction: @escaping (String) -> Void, onClear: @escaping () -> Void) {
        self.count = count
        self.actions = actions
        self.onAction = onAction
        self.onClear = onClear
    }

    @ViewBuilder private func actionView(_ a: ZCAction) -> some View {
        let enabled = a.disabledReason == nil
        Group {
            if let icon = a.icon {
                ZCIconButton(icon, label: a.label, variant: a.danger ? .dangerSoft : .ghost, small: true) { onAction(a.id) }
            } else {
                ZCButton(a.label, variant: a.danger ? .dangerSoft : .ghost, size: .sm) { onAction(a.id) }
            }
        }
        // Una acción de peligro conserva su color propio; las demás se leen sobre el color primario.
        .environment(\.zcOnPrimary, !a.danger)
        .disabled(!enabled)
        .accessibilityValue(a.disabledReason ?? "")
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        Group {
            if count > 0 {
                HStack(spacing: 2) {
                    ZCText(ZCString.text("ui.nSeleccionados", count), style: ZCType.body, tone: .onPrimary)
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(actions) { actionView($0) }
                    ZCIconButton(.lX, label: ZCString.text("ui.quitarSeleccion"), small: true, action: onClear)
                        .environment(\.zcOnPrimary, true)
                }
                .padding(.leading, 16).padding(.trailing, 4)
                .frame(minHeight: 56)
                .background(c.primary, in: shape)
                .shadow(color: .black.opacity(0.18), radius: 8, y: 3)
                .accessibilityElement(children: .contain)
                .accessibilityLabel(ZCString.text("ui.accionesSeleccion"))
                .transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(reduceMotion ? .easeOut(duration: ZCMotion.fast) : .easeOut(duration: ZCMotion.base), value: count > 0)
        .onChange(of: count) { _, now in
            if now > 0 { AccessibilityNotification.Announcement(ZCString.text("ui.nSeleccionados", now)).post() }
        }
    }
}
