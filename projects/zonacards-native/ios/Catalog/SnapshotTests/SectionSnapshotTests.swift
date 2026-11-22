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

    // Sin captura de la sección de gráficos entera (390 x 3900): en el CI hacía caer el proceso de pruebas al compararla
    // ("unexpected exit, crash, or test timeout"). Los gráficos se cubren con la captura de la sección (parte de arriba) y con ChartTests.

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
