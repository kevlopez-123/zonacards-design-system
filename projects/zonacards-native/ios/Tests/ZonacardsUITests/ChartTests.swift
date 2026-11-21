import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Reglas puras de los gráficos y del mapa (escala, abreviaturas, treemap, resumen, coordenadas, archivo de países) y que cada tipo de gráfico se dibuje.
final class ChartTests: XCTestCase {
    func testNiceScaleAlwaysIncludesZeroAndUsesRoundSteps() {
        let s = zcNiceScale(0, 87, target: 4)
        XCTAssertEqual(s.min, 0)
        XCTAssertGreaterThanOrEqual(s.max, 87)
        XCTAssertTrue([1.0, 2.0, 5.0, 10.0].contains(s.step / pow(10, floor(log10(s.step)))))
        let neg = zcNiceScale(-30, 70, target: 4)
        XCTAssertLessThanOrEqual(neg.min, -30)
        XCTAssertTrue(neg.ticks.contains(0))
        let flat = zcNiceScale(0, 0, target: 4)
        XCTAssertGreaterThan(flat.max, flat.min)   // todo en cero: no debe dividir por cero
    }

    func testAxisShortAbbreviates() {
        XCTAssertEqual(zcAxisShort(0), "0")
        XCTAssertTrue(zcAxisShort(1240).hasSuffix("K"))
        XCTAssertTrue(zcAxisShort(3_500_000).hasSuffix("M"))
        XCTAssertTrue(zcAxisShort(-2000).hasPrefix("-") || zcAxisShort(-2000).hasPrefix("−"))
    }

    func testHasData() {
        XCTAssertFalse(zcChartHasData(nil))
        XCTAssertFalse(zcChartHasData(ZCChartData(categories: [], series: [])))
        XCTAssertFalse(zcChartHasData(ZCChartData(categories: ["a"], series: [ZCChartSeries(name: "s", values: [0])])))
        XCTAssertTrue(zcChartHasData(ZCChartData(categories: ["a"], series: [ZCChartSeries(name: "s", values: [3])])))
    }

    func testSquarifyFillsTheAreaWithoutOverlap() {
        let area = CGRect(x: 0, y: 0, width: 300, height: 200)
        let values = [40.0, 30, 20, 15, 5]
        let rects = zcSquarify(values, in: area)
        XCTAssertEqual(rects.count, values.count)
        XCTAssertEqual(rects.reduce(0) { $0 + $1.width * $1.height }, area.width * area.height, accuracy: 1)
        for i in rects.indices {
            XCTAssertTrue(area.insetBy(dx: -0.5, dy: -0.5).contains(rects[i]), "el rectángulo \(i) se sale del área")
            for j in rects.indices where j > i { XCTAssertFalse(rects[i].insetBy(dx: 0.5, dy: 0.5).intersects(rects[j].insetBy(dx: 0.5, dy: 0.5)), "\(i) y \(j) se superponen") }
        }
        // El área de cada uno es proporcional a su valor.
        let total = values.reduce(0, +)
        for (r, v) in zip(rects, values) { XCTAssertEqual(r.width * r.height / (area.width * area.height), v / total, accuracy: 0.002) }
    }

    func testSummaryMentionsTitleAndValues() {
        let data = ZCChartData(categories: ["Lima", "Quito"], series: [ZCChartSeries(name: "Lotes", values: [420, 90])])
        let s = zcChartSummary(title: "Lotes por ciudad", data: data, kind: .barH, format: { "\(Int($0))" })
        XCTAssertTrue(s.hasPrefix("Lotes por ciudad. "))
        XCTAssertTrue(s.contains("Lima: 420"))
        XCTAssertTrue(s.contains("Quito: 90"))
        let donut = zcChartSummary(title: nil, data: data, kind: .donut, format: { "\(Int($0))" })
        XCTAssertTrue(donut.contains("%"))
    }

    func testLatLng() {
        XCTAssertTrue(ZCLatLng(lat: -12.0464, lng: -77.0428).isValid)
        XCTAssertFalse(ZCLatLng(lat: 91, lng: 0).isValid)
        XCTAssertFalse(ZCLatLng(lat: 0, lng: .nan).isValid)
        XCTAssertEqual(ZCLatLng(lat: -12.0464, lng: -77.0428).format(), "-12.04640, -77.04280")
        XCTAssertEqual(ZCLatLng(lat: -12.12345678, lng: 1).rounded().lat, -12.123457, accuracy: 1e-9)
    }

    func testCountriesFileLoads() throws {
        let geo = try XCTUnwrap(zcLatamGeo)
        XCTAssertGreaterThan(geo.count, 5)
        XCTAssertTrue(geo.contains { $0.cc == "pe" }, "falta Perú")
        XCTAssertTrue(geo.allSatisfy { !$0.rings.isEmpty })
        XCTAssertGreaterThan(geo.flatMap(\.rings).reduce(0) { $0 + $1.count }, 5000)
    }

    @MainActor
    func testEveryChartKindRenders() {
        let sample = ZCChartData(categories: ["A", "B", "C", "D"], series: [ZCChartSeries(name: "S1", values: [10, 20, 15, 5]), ZCChartSeries(name: "S2", values: [5, 8, 12, 3], dashed: true)])
        let kinds: [ZCChartKind] = [.line, .barH, .stacked, .donut, .funnel, .waterfall, .heatmap, .treemap, .calendar, .sankey, .gauge]
        for brand in [ZCBrand.zonacards, .giftealo] {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ForEach(Array(kinds.enumerated()), id: \.offset) { _, kind in
                            ZCChart(data: kind == .sankey ? ZCChartData(categories: ["A → B", "B → C"], series: [ZCChartSeries(name: "x", values: [5, 3])]) : (kind == .calendar ? ZCChartData(categories: ["2026-03-01", "2026-03-02"], series: [ZCChartSeries(name: "x", values: [1, 2])]) : sample), kind: kind, description: "Gráfico")
                        }
                        ZCChartPanel(title: "Panel", data: sample, kind: .line, categoryLabel: "Cat")
                        ZCChartPanel(title: "Vacío", data: nil, kind: .line)
                        ZCMap(label: "Mapa", points: [ZCMapPoint(name: "Lima", lat: -12.05, lng: -77.04, value: 10)], scope: ["pe"], unit: "lotes")
                        ZCLocationPicker("Punto", value: .constant(ZCLatLng(lat: -12.05, lng: -77.04)))
                    }
                }
                let host = UIHostingController(rootView: view)
                let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
                window.rootViewController = host
                window.makeKeyAndVisible()
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
