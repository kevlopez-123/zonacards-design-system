import SnapshotTesting
import SwiftUI
import XCTest
import ZonacardsTokens
import ZonacardsUI
@testable import ZonacardsCatalog

/// Captura de cada sección del catálogo, en claro y oscuro, para Zonacards y Giftealo (como en Android).
/// Cambio intencional: correr con la variable ZC_RECORD=1 y subir las capturas nuevas (`__Snapshots__`).
@MainActor
final class SectionSnapshotTests: XCTestCase {
    override func invokeTest() {
        let record = ProcessInfo.processInfo.environment["ZC_RECORD"] == "1"
        withSnapshotTesting(record: record ? .all : .missing) { super.invokeTest() }
    }

    private let combos: [(ZCBrand, Bool)] = [(.zonacards, false), (.zonacards, true), (.giftealo, false), (.giftealo, true)]

    /// La sección de gráficos entera, sin desplazamiento (la captura del teléfono solo muestra la parte de arriba).
    func testChartsInFull() {
        for dark in [false, true] {
            let view = ZCThemeProvider(brand: .zonacards, dark: dark) {
                ChartsSection().padding(ZCSpace.v4).frame(maxHeight: .infinity, alignment: .top)
            }
            assertSnapshot(
                of: UIHostingController(rootView: view),
                as: .image(precision: 0.99, perceptualPrecision: 0.98, layout: .fixed(width: 390, height: 3900)),
                named: "graficos-completo-\(dark ? "oscuro" : "claro")"
            )
        }
    }

    func testSections() {
        for section in CatalogSection.allCases {
            for (brand, dark) in combos {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    ScrollView { section.content.padding(ZCSpace.v4) }
                }
                let host = UIHostingController(rootView: view)
                assertSnapshot(
                    of: host,
                    as: .image(on: .iPhone13, precision: 0.99, perceptualPrecision: 0.98),
                    named: "\(section.rawValue)-\(brand.rawValue)-\(dark ? "oscuro" : "claro")"
                )
            }
        }
    }
}
