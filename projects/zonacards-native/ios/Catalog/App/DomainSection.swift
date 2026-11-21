import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Contenido y dominio: avisos, pestañas, acordeón, fichas, historial, tarjetas, KPI, montos, estados y medios de pago, producto y llamado.
struct DomainSection: View {
    @State private var tab = "datos"
    @State private var period = "mes"
    @State private var fav = false
    @State private var kpiOn = false

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Avisos y pestañas") {
                ZCAlert("No se pudo guardar", tone: .danger, text: "Revisa tu conexión. Referencia ZC-48213.") { ZCAlertAction("Reintentar") {} }
                ZCAlert("Lote aprobado", tone: .success)
                ZCAlert("Vence pronto", tone: .warning, text: "Quedan 3 días.")
                ZCTabs(tabs: [ZCTab(value: "datos", label: "Datos", icon: .sBox), ZCTab(value: "envios", label: "Envíos", count: 4), ZCTab(value: "hist", label: "Historial"), ZCTab(value: "x", label: "Bloqueada", enabled: false)], selected: $tab, label: "Secciones del lote")
                ZCTabs(tabs: [ZCTab(value: "sem", label: "Semana"), ZCTab(value: "mes", label: "Mes"), ZCTab(value: "anio", label: "Año")], selected: $period, variant: .segmented, label: "Periodo")
            }
            group("Acordeón, ficha e historial") {
                ZCAccordion(items: [
                    ZCAccordionItem(id: "a", title: "¿Cómo se aprueba un lote?", subtitle: "Dos personas") { ZCText("Quien lo crea no puede aprobarlo.", tone: .muted) },
                    ZCAccordionItem(id: "b", title: "Montos y comisiones", icon: .sBox, aside: AnyView(ZCBadge("Nuevo", tone: .accent))) { ZCText("Se muestran con la moneda del país.", tone: .muted) }
                ], multiple: true, label: "Preguntas frecuentes", initiallyOpen: ["a"])
                ZCDescriptionList(items: [ZCDescription(term: "País", value: "Perú", flag: "pe"), ZCDescription(term: "Monto", value: "S/ 1,250.00"), ZCDescription(term: "Creado por", value: "Lucía Mendoza"), ZCDescription(term: "Estado", value: "Activo")])
                ZCDescriptionList(items: [ZCDescription(term: "Subtotal", value: "S/ 1,000.00"), ZCDescription(term: "IGV", value: "S/ 180.00"), ZCDescription(term: "Total", value: "S/ 1,180.00")], layout: .rows)
                ZCTimeline(items: [ZCTimelineItem(icon: .sCheckCircle, title: "Aprobado", meta: "21/11/2026 · Rey Sol"), ZCTimelineItem(icon: .sPen, title: "Editado", meta: "20/11/2026 · Lucía Mendoza"), ZCTimelineItem(icon: .sBox, title: "Creado", meta: "19/11/2026")], label: "Historial del lote")
                ZCCopyButton(value: "ZC-48213", label: "Copiar referencia", showText: true, variant: .outline)
            }
            group("Tarjeta, KPI y monto") {
                ZCCard("Lote #02829", subtitle: "21/11/2026", icon: .sBox, aside: { ZCStateBadge(machine: ZCStates.lot, state: "activo") }, content: {
                    ZCDescriptionList(items: [ZCDescription(term: "Monto", value: "S/ 1,250.00"), ZCDescription(term: "Giftcards", value: "40")])
                })
                ZCKpi(label: "Ventas del mes", value: "S/ 48,200", icon: .sBox, delta: 8.2, deltaLabel: "vs. mes anterior", trend: [4, 6, 5, 8, 9, 12, 11])
                ZCKpi(label: "Reclamos", value: "12", delta: -3, invert: true)
                ZCKpi(label: "Pendientes", value: "7", filter: true, pressed: $kpiOn)
                HStack { ZCMoneyText(1250.5, country: "pe", style: ZCType.titleSm, weight: .bold); ZCMoneyText(1_250_000, country: "co") }
            }
            group("Estados, pagos, producto") {
                HStack { ZCStateBadge(machine: ZCStates.giftcard, state: "activated"); ZCStateBadge(machine: ZCStates.shipment, state: "borrador") }
                HStack { ZCPayBadge(.yape); ZCPayBadge(.plin); ZCPayBadge(.pagoefectivo); ZCPayBadge(.puntos) }
                ZCProductCard(name: "Giftcard Cine", price: 35, country: "pe", description: "Válida en todas las salas", isNew: true, favorite: $fav) {}
                ZCCtaCard(title: "Invita y gana", text: "Suma puntos por cada amigo que compre.", icon: .sBox) { ZCButton("Invitar", size: .sm) {} }
                ZCBullet(value: 60, min: 20, max: 100, label: "Stock 60 de 100, mínimo 20", reorder: 35)
                ZCErrorPage(title: "No encontramos la página", text: "Puede que se haya movido. Tu trabajo está guardado.", icon: .sDangerTriangle, code: "404", reference: "ZC-1") { ZCButton("Volver al inicio", variant: .outline, size: .sm) {} }
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
