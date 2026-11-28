import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Átomos: todos los componentes de la ola 1 con sus variantes y estados (como la sección Átomos del catálogo de Android).
struct AtomsSection: View {
    @State private var notify = true
    @State private var terms = false
    @State private var plan: String? = "mensual"
    @State private var stars = 3.0
    @State private var half = 3.5
    @State private var chipOn = true
    @State private var chips = ["Lima", "Cusco", "Arequipa"]

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Botón") {
                ZCButton("Crear lote") {}
                ZCButton("Guardar", variant: .secondary) {}
                ZCButton("Cancelar", variant: .outline) {}
                ZCButton("Ver detalle", variant: .ghost, trailingIcon: .sAltArrowRight) {}
                ZCButton("Eliminar lote", variant: .danger) {}
                ZCButton("Rechazar", variant: .dangerSoft) {}
                ZCButton("Términos y condiciones", variant: .link) {}
                ZCButton("Guardando", loading: true) {}
                ZCButton("No disponible") {}.disabled(true)
                ZCButton("Continuar", size: .sm, block: true) {}
                HStack { ZCIconButton(.lX, label: "Cerrar") {}; ZCIconButton(.lX, label: "Cerrar", variant: .primary, small: true) {} }
            }
            group("Badge, avatar, chip") {
                HStack { ZCBadge("Activo", tone: .success, icon: .sCheckCircle); ZCBadge("Pendiente", tone: .warning); ZCBadge("Rechazado", tone: .danger); ZCBadge("Nuevo", tone: .accent) }
                HStack { ZCAvatar("Lucía Mendoza", size: .sm); ZCAvatar("Lucía Mendoza", presence: true); ZCAvatar("Acme SAC", size: .lg, brand: true, square: true) }
                ZCAvatarGroup(names: ["Ana Ruiz", "Luis Paz", "Eva Mora", "Rey Sol", "Ian Gil", "Tea Vega"], label: "6 personas")
                HStack {
                    ZCChip("Filtro", selected: $chipOn)
                    ZCChip("Sin selección", selected: .constant(false))
                    ZCChip("No válido", invalid: true)
                }
                HStack { ForEach(chips, id: \.self) { c in ZCChip(c, onRemove: { chips.removeAll { $0 == c } }) } }
            }
            group("Controles") {
                ZCSwitch(isOn: $notify, label: "Notificaciones", description: "Avisos de nuevos lotes")
                ZCSwitch(isOn: .constant(false), label: "Modo compacto", size: .sm)
                ZCCheckbox(isOn: $terms, label: "Acepto los términos")
                ZCCheckbox(state: .mixed, label: "Seleccionar todo") {}
                ZCCheckbox(isOn: .constant(false), label: "Con error", invalid: true)
                ZCRadioGroup("Plan", options: [ZCRadioOption("mensual", label: "Mensual", description: "Se renueva cada mes"), ZCRadioOption("anual", label: "Anual"), ZCRadioOption("pausa", label: "En pausa", enabled: false)], selection: $plan)
            }
            group("Progreso y carga") {
                ZCProgress(value: 0.42, label: "Importando")
                ZCProgress(value: 0.8, label: "Cupo usado", variant: .meter)
                ZCProgress(value: nil, label: "Procesando")
                HStack { ZCProgress(value: 0.6, variant: .circular); ZCSpinner() }
                ZCSkeleton(lines: 3)
                ZCSkeleton(variant: .card)
                ZCDivider()
            }
            group("Rating") {
                ZCRating("Calificación del servicio", value: $stars)
                ZCText("Elegiste \(Int(stars)) de 5.", style: ZCType.caption, tone: .muted)
                ZCRating("Calificación de la entrega", value: $half, allowHalf: true, size: .lg, showValue: true)
                ZCRating("Calificación del producto", readOnly: 4.3, count: 128, showValue: true)
                ZCRating("Tamaño pequeño", readOnly: 3.5, size: .sm)
                ZCRating("Calificación del comercio", readOnly: 0, count: 0)
                ZCRating("Calificación bloqueada", value: .constant(2)).disabled(true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}
