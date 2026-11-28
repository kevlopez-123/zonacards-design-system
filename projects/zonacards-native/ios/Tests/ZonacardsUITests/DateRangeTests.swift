import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Periodos predefinidos y periodo anterior (con un lunes como "hoy"), textos y dibujo del calendario y del selector de periodo.
final class DateRangeTests: XCTestCase {
    private let today = "2026-11-23"   // lunes

    private func range(_ p: ZCRangePreset) -> String {
        guard let r = zcPresetRange(p, today: today) else { return "nil" }
        return "\(r.from)..\(r.to)"
    }

    func testPresetRanges() {
        XCTAssertEqual(range(.today), "2026-11-23..2026-11-23")
        XCTAssertEqual(range(.yesterday), "2026-11-22..2026-11-22")
        XCTAssertEqual(range(.last7), "2026-11-17..2026-11-23")
        XCTAssertEqual(range(.last30), "2026-10-25..2026-11-23")
        XCTAssertEqual(range(.week), "2026-11-23..2026-11-23")
        XCTAssertEqual(range(.month), "2026-11-01..2026-11-23")
        XCTAssertEqual(range(.prevMonth), "2026-10-01..2026-10-31")
        XCTAssertEqual(range(.quarter), "2026-10-01..2026-11-23")
        XCTAssertEqual(range(.year), "2026-01-01..2026-11-23")
        XCTAssertEqual(range(.custom), "nil")
    }

    func testWeekStartsOnMondayEvenMidWeek() {
        XCTAssertEqual(zcPresetRange(.week, today: "2026-11-26")?.from, "2026-11-23")   // jueves
        XCTAssertEqual(zcPresetRange(.week, today: "2026-11-29")?.from, "2026-11-23")   // domingo
    }

    func testPreviousRangeHasTheSameLengthAndEndsTheDayBefore() {
        let p = zcPreviousRange(from: "2026-11-17", to: "2026-11-23")
        XCTAssertEqual(p.from, "2026-11-10")
        XCTAssertEqual(p.to, "2026-11-16")
        let one = zcPreviousRange(from: "2026-11-23", to: "2026-11-23")
        XCTAssertEqual(one.from, "2026-11-22")
        XCTAssertEqual(one.to, "2026-11-22")
    }

    func testEveryPresetHasATranslatedLabel() {
        for p in ZCRangePreset.allCases {
            XCTAssertNotEqual(p.label, "ui.preset.\(p.rawValue)", "\(p) no tiene texto en Localizable")
        }
        for key in ["ui.mesAnterior", "ui.mesSiguiente", "ui.vsAnterior", "ui.comparadoAnterior", "ui.elegirPeriodo", "ui.nDias", "ui.eligeFin", "ui.cancelar",
                    "ui.aplicar", "ui.periodos", "ui.desde", "ui.hasta", "ui.formatoFecha", "ui.noFutura", "ui.compararAnterior", "validacion.dateFormat", "validacion.rangeOrder"] {
            XCTAssertNotEqual(ZCString.text(key, 3), key, "\(key) no tiene texto en Localizable")
        }
    }

    func testDateTimeAndLimitsTextsAreTranslated() {
        for key in ["ui.fechaNoDisponible", "ui.rangoMaxDias", "ui.fecha", "ui.hora"] {
            XCTAssertNotEqual(ZCString.text(key, 7), key, "\(key) no tiene texto en Localizable")
        }
        XCTAssertTrue(ZCString.text("ui.rangoMaxDias", 7).contains("7"))
    }

    @MainActor
    func testLimitsAndDateTimeRenderInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack(spacing: 16) {
                        ZCDateRange("Reserva", value: .constant(nil), today: "2026-11-23", allowFuture: true, maxDays: 7, unavailable: { $0 == "2026-11-25" }, hint: "Máximo 7 días")
                        ZCCalendar(month: .constant("2026-11-01"), today: "2026-11-23", min: "2026-11-05", unavailable: { $0 == "2026-11-12" }, onPick: { _ in })
                        ZCDateTimeField("Envío programado", value: .constant("2026-12-24T09:30"), min: "2026-11-23", hint: "Hora de Lima")
                        ZCDateTimeField("Envío programado", value: .constant(nil), error: "Elige fecha y hora", required: true)
                    }
                    .padding()
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 1400)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }

    @MainActor
    func testCalendarAndRangeRenderInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack(spacing: 16) {
                        ZCCalendar(month: .constant("2026-11-01"), today: "2026-11-23", rangeStart: "2026-11-10", rangeEnd: "2026-11-18", max: "2026-11-23", onPick: { _ in })
                        ZCCalendar(month: .constant("2026-02-01"), today: "2026-11-23", selected: "2026-02-14", lang: "en", onPick: { _ in })
                        ZCDateRange("Periodo", value: .constant(ZCDateRangeValue(from: "2026-11-17", to: "2026-11-23", preset: .last7, compare: true)), today: "2026-11-23", hint: "Con comparación")
                        ZCDateRange("Periodo", value: .constant(nil), today: "2026-11-23", error: "Elige un periodo", required: true)
                    }
                    .padding()
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 1200)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
