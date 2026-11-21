import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Gráficos y mapa: los 11 tipos de gráfico con los mismos datos que la web, el panel con vista Datos, el mapa de puntos y el selector de ubicación.
struct ChartsSection: View {
    @State private var period = "sem"
    @State private var location: ZCLatLng? = nil

    private func hours() -> [String] { ["0h", "3h", "6h", "9h", "12h", "15h", "18h", "21h"] }

    private var calendarData: ZCChartData {
        var cats: [String] = [], vals: [Double] = []
        for i in 0..<90 {
            let d = Calendar(identifier: .gregorian).date(byAdding: .day, value: i, to: DateComponents(calendar: .init(identifier: .gregorian), year: 2026, month: 2, day: 1).date!)!
            let c = Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: d)
            cats.append(String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!))
            vals.append(Double((i * 37) % 23))
        }
        return ZCChartData(categories: cats, series: [ZCChartSeries(name: "Pedidos", values: vals)])
    }

    private var lineData: ZCChartData {
        ZCChartData(categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], series: [
            ZCChartSeries(name: "Ventas", values: period == "sem" ? [120, 180, 150, 220, 260, 310, 280] : [800, 950, 900, 1100, 1250, 1400, 1300]),
            ZCChartSeries(name: "Periodo anterior", values: period == "sem" ? [100, 140, 160, 170, 200, 240, 230] : [700, 820, 880, 950, 1000, 1150, 1100], dashed: true)
        ])
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Línea con filtro y vista Datos") {
                ZCChartPanel(title: "Ventas por día", data: lineData, kind: .line, categoryLabel: "Día") {
                    ZCSegmented(options: [ZCSegmentOption(id: "sem", label: "Semana"), ZCSegmentOption(id: "mes", label: "Mes")], selected: $period, label: "Periodo")
                }
            }
            group("Barras, apiladas y dona") {
                ZCChart(data: ZCChartData(categories: ["Lima", "Bogotá", "Santiago", "Ciudad de México", "Quito"], series: [ZCChartSeries(name: "Lotes", values: [420, 310, 260, 180, 90])]), kind: .barH, description: "Lotes por ciudad")
                ZCChart(data: ZCChartData(categories: ["Ene", "Feb", "Mar", "Abr"], series: [ZCChartSeries(name: "Cine", values: [40, 55, 60, 70]), ZCChartSeries(name: "Café", values: [20, 25, 30, 35]), ZCChartSeries(name: "Ropa", values: [10, 15, 12, 20])]), kind: .stacked, description: "Ventas por categoría")
                ZCChart(data: ZCChartData(categories: ["Yape", "Tarjeta", "Plin", "Efectivo"], series: [ZCChartSeries(name: "Pagos", values: [45, 30, 15, 10])]), kind: .donut, description: "Medios de pago", totalLabel: "pagos")
            }
            group("Embudo, cascada y medidor") {
                ZCChart(data: ZCChartData(categories: ["Visitas", "Carritos", "Pagos", "Entregas"], series: [ZCChartSeries(name: "Usuarios", values: [1000, 420, 180, 150])]), kind: .funnel, description: "Embudo de compra")
                ZCChart(data: ZCChartData(categories: ["Inicio", "Altas", "Bajas", "Ajuste", "Final"], series: [ZCChartSeries(name: "Saldo", values: [100, 40, -25, 10, 125])]), kind: .waterfall, description: "Saldo de giftcards")
                ZCChart(data: ZCChartData(categories: ["Logrado", "Meta"], series: [ZCChartSeries(name: "Ventas", values: [72, 100])]), kind: .gauge, description: "Meta del mes")
            }
            group("Mapa de calor, treemap, calendario y sankey") {
                ZCChart(data: ZCChartData(categories: hours(), series: [
                    ZCChartSeries(name: "Lun", values: [1, 2, 5, 9, 14, 12, 8, 3]), ZCChartSeries(name: "Mar", values: [1, 3, 6, 10, 15, 13, 9, 4]),
                    ZCChartSeries(name: "Mié", values: [2, 3, 7, 11, 16, 14, 10, 5])]), kind: .heatmap, description: "Pedidos por hora")
                ZCChart(data: ZCChartData(categories: ["Cine", "Café", "Ropa", "Viajes", "Otros"], series: [ZCChartSeries(name: "Ventas", values: [40, 30, 20, 15, 5])]), kind: .treemap, description: "Ventas por categoría")
                ZCChart(data: calendarData, kind: .calendar, description: "Pedidos por día")
                ZCChart(data: ZCChartData(categories: ["Web → Carrito", "Web → Salida", "App → Carrito", "Carrito → Pago", "Carrito → Abandono"], series: [ZCChartSeries(name: "Usuarios", values: [60, 40, 50, 80, 30])]), kind: .sankey, description: "Recorrido de usuarios")
            }
            group("Mapa de puntos") {
                ZCMap(label: "Lotes por ciudad", points: [
                    ZCMapPoint(name: "Lima", lat: -12.05, lng: -77.04, value: 420), ZCMapPoint(name: "Bogotá", lat: 4.71, lng: -74.07, value: 310),
                    ZCMapPoint(name: "Santiago", lat: -33.45, lng: -70.67, value: 260), ZCMapPoint(name: "Ciudad de México", lat: 19.43, lng: -99.13, value: 180),
                    ZCMapPoint(name: "Quito", lat: -0.18, lng: -78.47, value: 90)], scope: ["pe", "co"], unit: "lotes")
            }
            group("Selector de ubicación") {
                ZCLocationPicker("Punto de entrega", value: $location, onUseMyLocation: {})
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
