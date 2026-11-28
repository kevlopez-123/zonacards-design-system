import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Estructura: barras, avisos del sistema, estados, menú y fila deslizable, hojas, modal, confirmaciones y avisos (toasts).
struct StructureSection: View {
    @State private var toasts = ZCToastState()
    @State private var nav = "inicio"
    @State private var showSheet = false
    @State private var showModal = false
    @State private var showAlert = false
    @State private var showDanger = false
    @State private var city: String? = nil
    @State private var last = "—"
    @State private var picked: Set<String> = ["02829", "02830"]
    private let lots = [("02829", "Activo · 120 códigos"), ("02830", "Activo · 80 códigos"), ("02831", "Borrador · 40 códigos")]

    private let actions = [
        ZCAction(id: "edit", label: "Editar", icon: .sPen),
        ZCAction(id: "copy", label: "Duplicar", icon: .sCopy, description: "Crea una copia en borrador"),
        ZCAction(id: "approve", label: "Aprobar", icon: .sCheckCircle, disabledReason: "Falta la firma del segundo aprobador"),
        ZCAction(id: "delete", label: "Eliminar", icon: .sTrashBinTrash, danger: true, separatorBefore: true)
    ]
    private let navItems = [
        ZCNavItem(id: "inicio", label: "Inicio", icon: .sHomeSmile, iconActive: .sHomeSmileBold),
        ZCNavItem(id: "lotes", label: "Lotes", icon: .sBox, iconActive: .sBoxBold, badge: "3"),
        ZCNavItem(id: "cuenta", label: "Cuenta", icon: .sUserRounded)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Barras") {
                ZCTopBar("Detalle del lote", subtitle: "Lote #02829", onBack: {}) { ZCMenu(actions: actions, label: "Acciones del lote") { last = $0 } }
                ZCBottomNav(items: navItems, current: nav) { nav = $0 }
            }
            group("Avisos del sistema") {
                ZCSystemBanner("Sin conexión. Los cambios se guardan en el teléfono.")
                ZCSystemBanner("Hay una versión nueva.", tone: .update) { ZCButton("Actualizar", variant: .link, size: .sm) {} }
                ZCOfflineBanner(pending: 3)
            }
            group("Estados") {
                ZCState("Aún no hay lotes", text: "Crea el primero para empezar.") { ZCButton("Crear lote", size: .sm) {} }
                ZCState("No pudimos cargar los lotes", kind: .error, text: "Tus cambios se conservaron.", reference: "ZC-48213",
                        details: ZCTechDetails(code: "HTTP 503", service: "lotes", date: "2026-11-21 10:42")) { ZCButton("Reintentar", variant: .outline, size: .sm) {} }
            }
            group("Fila deslizable") {
                ZCSwipeItem(actions: [actions[0], actions[3]], menuLabel: "Acciones", onAction: { last = $0 }) {
                    VStack(alignment: .leading) { ZCText("Lote #02829", style: ZCType.body); ZCText("Pendiente de aprobación", style: ZCType.caption, tone: .muted) }
                }
                ZCText("Última acción: \(last)", style: ZCType.caption, tone: .muted)
            }
            group("Selección múltiple") {
                ForEach(lots, id: \.0) { lot in
                    ZCCheckbox(isOn: Binding(get: { picked.contains(lot.0) }, set: { on in if on { picked.insert(lot.0) } else { picked.remove(lot.0) } }),
                               label: "Lote #\(lot.0)", description: lot.1)
                }
                // Un borrador no se puede exportar: la acción queda deshabilitada y dice por qué.
                ZCActionBar(count: picked.count, actions: [
                    ZCAction(id: "enviar", label: "Enviar", icon: .sPlain),
                    ZCAction(id: "exportar", label: "Exportar", icon: .sDownloadMinimalistic, disabledReason: picked.contains("02831") ? "Un borrador no se puede exportar" : nil),
                    ZCAction(id: "anular", label: "Anular", icon: .sCloseCircle, danger: true)
                ], onAction: { toasts.info("\($0): \(picked.count) lotes") }, onClear: { picked = [] })
            }
            group("Hojas, modal y confirmaciones") {
                ZCButton("Abrir hoja", variant: .outline) { showSheet = true }
                ZCButton("Abrir modal", variant: .outline) { showModal = true }
                ZCButton("Confirmar", variant: .outline) { showAlert = true }
                ZCButton("Eliminar con motivo", variant: .dangerSoft) { showDanger = true }
            }
            group("Avisos (toasts)") {
                ZCButton("Éxito", variant: .outline, size: .sm) { toasts.success("Lote guardado", text: "Los cambios ya están activos.") }
                ZCButton("Error con acción", variant: .outline, size: .sm) { toasts.error("No se pudo guardar", text: "Revisa tu conexión.", actionLabel: "Reintentar") {} }
                ZCButton("Información", variant: .outline, size: .sm) { toasts.info("Actualizado hace un momento") }
                // Un solo aviso que pasa de "cargando" a éxito o error cuando termina la operación (simulada: 1,5 s).
                ZCButton("Guardar y esperar (éxito)", variant: .outline, size: .sm) {
                    Task {
                        _ = try? await toasts.promise(loading: ZCToastBody("Guardando el lote…"), success: { (n: Int) in ZCToastBody("Lote guardado", text: "\(n) códigos listos para enviar.") },
                                                      error: { _ in ZCToastBody("No se pudo guardar el lote") }) {
                            try await Task.sleep(nanoseconds: 1_500_000_000)
                            return 120
                        }
                    }
                }
                ZCButton("Guardar y esperar (error)", variant: .outline, size: .sm) {
                    Task {
                        _ = try? await toasts.promise(loading: ZCToastBody("Guardando el lote…"), success: { (_: Int) in ZCToastBody("Lote guardado") },
                                                      error: { _ in ZCToastBody("No se pudo guardar el lote", text: "Revisa tu conexión e inténtalo otra vez.") }) {
                            try await Task.sleep(nanoseconds: 1_500_000_000)
                            throw URLError(.notConnectedToInternet)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { ZCToaster(state: toasts) }
        .zcSheet(isPresented: $showSheet, title: "Filtrar lotes", subtitle: "Elige una ciudad", footer: {
            ZCFooterButton("Limpiar", variant: .outline) { city = nil }
            ZCFooterButton("Ver resultados") { showSheet = false }
        }, content: {
            // Dentro de la hoja, el select se abre como subpantalla con Volver (nunca otra hoja encima).
            ZCSelect("Ciudad", options: [ZCOption("lim", label: "Lima"), ZCOption("cus", label: "Cusco"), ZCOption("aqp", label: "Arequipa")], selection: $city)
        })
        .zcModal(isPresented: $showModal, title: "Nuevo lote", subtitle: "Completa los datos básicos", footer: {
            ZCFooterButton("Cancelar", variant: .outline) { showModal = false }
            ZCFooterButton("Crear") { showModal = false; toasts.success("Lote creado") }
        }, content: {
            ZCText("El lote queda pendiente de aprobación hasta que otra persona lo revise.", tone: .muted)
        })
        .zcAlertDialog(isPresented: $showAlert, title: "¿Enviar a aprobación?", text: "Otra persona deberá aprobarlo antes de activarse.", confirmLabel: "Enviar", cancelLabel: "Cancelar") { _ in
            showAlert = false
        }
        .zcAlertDialog(isPresented: $showDanger, title: "¿Eliminar el lote?", text: "Esta acción no se puede deshacer.", confirmLabel: "Eliminar", cancelLabel: "Cancelar", danger: true, reasonLabel: "Motivo") { _ in
            showDanger = false
        }
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}
