import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Reglas puras de la visualización de dominio y que cada pieza se dibuje en todas las marcas y modos.
final class DomainDisplayTests: XCTestCase {
    func testDeltaFormat() {
        // El separador decimal lo da el idioma es-PE (igual que Android): se acepta punto o coma.
        XCTAssertTrue(["+8.2 %", "+8,2 %"].contains(zcFormatDelta(8.2)))
        XCTAssertEqual(zcFormatDelta(-3), "−3 %")
        XCTAssertEqual(zcFormatDelta(0), "+0 %")
        XCTAssertTrue(["+12.3 %", "+12,3 %"].contains(zcFormatDelta(12.345)))
    }

    func testEveryStateOfEveryMachineHasALook() {
        for machine in [ZCStates.giftcard, ZCStates.lot, ZCStates.shipment, ZCStates.approval, ZCStates.settlement, ZCStates.transfer] {
            for state in machine.transitions.keys {
                let look = machine.looks[state]
                XCTAssertNotNil(look, "falta el aspecto de \(state)")
                guard let look else { continue }
                XCTAssertNotNil(ZCTone(rawValue: look.tone), "tono desconocido \(look.tone)")
                let key = "zc_ic_" + look.icon.replacingOccurrences(of: ":", with: "_").replacingOccurrences(of: "-", with: "_")
                XCTAssertNotNil(ZCIconName(rawValue: key), "ícono inexistente \(look.icon)")
                XCTAssertNotEqual(ZCString.text(look.labelKey), look.labelKey, "falta el texto \(look.labelKey)")
            }
        }
    }

    @MainActor
    func testDomainRendersInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCAlert("Error", tone: .danger, text: "Texto") { ZCAlertAction("Reintentar") {} }
                        ZCTabs(tabs: [ZCTab(value: "a", label: "A", count: 2), ZCTab(value: "b", label: "B")], selected: .constant("a"))
                        ZCAccordion(items: [ZCAccordionItem(id: "x", title: "T") { Text("c") }], initiallyOpen: ["x"])
                        ZCDescriptionList(items: [ZCDescription(term: "A", value: "1", flag: "pe")])
                        ZCTimeline(items: [ZCTimelineItem(icon: .sBox, title: "Hecho", meta: "hoy")])
                        ZCCard("Lote", subtitle: "hoy", icon: .sBox)
                        ZCKpi(label: "Ventas", value: "10", delta: 5, trend: [1, 2, 3])
                        ZCMoneyText(1250, country: "pe")
                        ZCStateBadge(machine: ZCStates.lot, state: "activo")
                        ZCPayBadge(.yape)
                        ZCProductCard(name: "Giftcard", price: 10, country: "pe", favorite: .constant(false)) {}
                        ZCCtaCard(title: "Hola", text: "Texto", icon: .sBox)
                        ZCBullet(value: 5, min: 2, max: 10, label: "Stock")
                        ZCErrorPage(title: "404", text: "No existe", icon: .sBox)
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 2400)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
