import SwiftUI
import UIKit
import ZonacardsTokens

/// Serie de un gráfico. `dashed`: periodo anterior (línea punteada en gris).
public struct ZCChartSeries: Sendable {
    public let name: String
    public let values: [Double]
    public let dashed: Bool

    public init(name: String, values: [Double], dashed: Bool = false) {
        self.name = name
        self.values = values
        self.dashed = dashed
    }
}

/// Mismos datos que `ChartData` de la web: categorías y series con un valor por categoría.
public struct ZCChartData: Sendable {
    public let categories: [String]
    public let series: [ZCChartSeries]

    public init(categories: [String], series: [ZCChartSeries]) {
        self.categories = categories
        self.series = series
    }
}

/// Tipos de la web: línea, barras horizontales (una serie, el mayor destacado), apiladas y dona; y los de operación (embudo, cascada, mapa de calor, treemap,
/// calendario, sankey y medidor), con la misma forma de datos.
public enum ZCChartKind: Sendable { case line, barH, stacked, donut, funnel, waterfall, heatmap, treemap, calendar, sankey, gauge }

/// `hasData` de la web: hay categorías y al menos un valor distinto de cero.
public func zcChartHasData(_ d: ZCChartData?) -> Bool {
    guard let d else { return false }
    return !d.categories.isEmpty && d.series.contains { $0.values.contains { $0 != 0 } }
}

private func chartLocale() -> Locale { Locale.current.language.languageCode?.identifier == "en" ? Locale(identifier: "en_US") : Locale(identifier: "es_PE") }

/// Abrevia ejes como la web: 1 240 → 1,2K; 3 500 000 → 3,5M.
public func zcAxisShort(_ v: Double) -> String {
    let f = NumberFormatter()
    f.locale = chartLocale()
    f.numberStyle = .decimal
    f.maximumFractionDigits = 1
    let a = abs(v)
    if a >= 1e6 { return (f.string(from: NSNumber(value: v / 1e6)) ?? "") + "M" }
    if a >= 1e3 { return (f.string(from: NSNumber(value: v / 1e3)) ?? "") + "K" }
    return f.string(from: NSNumber(value: v)) ?? ""
}

struct ZCScale {
    let min: Double
    let max: Double
    let step: Double
    var ticks: [Double] { (0...Int(((max - min) / step).rounded())).map { min + Double($0) * step } }
}

/// Escala "bonita": el paso es 1, 2, 5 o 10 por una potencia de 10 y el rango siempre incluye el cero.
func zcNiceScale(_ lo: Double, _ hi: Double, target: Int) -> ZCScale {
    let min0 = Swift.min(lo, 0), max0 = Swift.max(hi, 0)
    let span = (max0 - min0) > 0 ? max0 - min0 : 1
    let raw = span / Double(target)
    let mag = pow(10, floor(log10(raw)))
    let n = raw / mag
    let step = (n <= 1 ? 1 : (n <= 2 ? 2 : (n <= 5 ? 5 : 10))) * mag
    let lowest = floor(min0 / step) * step
    var highest = ceil(max0 / step) * step
    if highest <= lowest { highest = lowest + step }   // todo en cero: un rango vacío dividiría por cero al dibujar
    return ZCScale(min: lowest, max: highest, step: step)
}

extension ZCColors {
    var chartPalette: [Color] { [chart1, chart2, chart3, chart4, chart5, chart6] }
}

func zcSeriesColor(_ palette: [Color], _ i: Int, _ s: ZCChartSeries) -> Color { s.dashed ? palette[5] : palette[i % palette.count] }

/// Texto que lee VoiceOver: título y valores (los mayores si hay muchas celdas). La alternativa completa es la vista Datos de `ZCChartPanel`.
func zcChartSummary(title: String?, data: ZCChartData, kind: ZCChartKind, format: (Double) -> String) -> String {
    var out = ""
    if let title, !title.trimmingCharacters(in: .whitespaces).isEmpty { out += title + ". " }
    func top(_ pairs: [(String, Double)]) -> String { pairs.sorted { $0.1 > $1.1 }.prefix(8).map { "\($0.0): \(format($0.1))" }.joined(separator: "; ") }
    let first = data.series.first?.values ?? []
    func v(_ i: Int) -> Double { first.indices.contains(i) ? first[i] : 0 }
    switch kind {
    case .heatmap:
        var pairs: [(String, Double)] = []
        for s in data.series { for (i, c) in data.categories.enumerated() { pairs.append(("\(s.name) \(c)", s.values.indices.contains(i) ? s.values[i] : 0)) } }
        out += top(pairs)
    case .calendar:
        out += top(data.categories.enumerated().map { ($1, v($0)) })
    case .gauge:
        let denom = first.indices.contains(1) && first[1] != 0 ? first[1] : 1
        let pct = Int((v(0) / denom * 100).rounded())
        out += data.categories.enumerated().map { "\($1): \(format(v($0)))" }.joined(separator: "; ") + " (\(pct) %)"
    case .funnel, .waterfall, .treemap, .sankey, .barH:
        out += data.categories.enumerated().map { "\($1): \(format(v($0)))" }.joined(separator: "; ")
    case .donut:
        let total = first.reduce(0, +)
        out += data.categories.enumerated().map { i, c in
            let x = v(i)
            return "\(c): \(format(x))" + (total > 0 ? " (\(Int((x / total * 100).rounded())) %)" : "")
        }.joined(separator: "; ")
    default:
        out += data.categories.enumerated().map { i, c in
            c + ": " + data.series.map { s in "\(s.name) \(format(s.values.indices.contains(i) ? s.values[i] : 0))" }.joined(separator: ", ")
        }.joined(separator: "; ")
    }
    return out
}

// MARK: - Globo

struct ZCTipRow {
    let color: Color?
    let label: String?
    let value: String
}

private struct ZCTipSizeKey: PreferenceKey {
    static let defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) { value = nextValue() }
}

/// Globo al tocar: junto al punto, a la derecha si cabe y a la izquierda si no; nunca fuera del gráfico.
struct ZCChartTooltip: View {
    @Environment(\.zcTheme) private var theme
    @State private var size: CGSize = .zero
    let anchor: CGPoint
    let bounds: CGSize
    let title: String?
    let rows: [ZCTipRow]

    var body: some View {
        let c = theme.colors
        let gap: CGFloat = 12
        let x = min(max(anchor.x + gap + size.width <= bounds.width ? anchor.x + gap : anchor.x - gap - size.width, 0), max(bounds.width - size.width, 0))
        let y = min(max(anchor.y - size.height / 2, 0), max(bounds.height - size.height, 0))
        let shape = RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous)
        VStack(alignment: .leading, spacing: 4) {
            if let title { Text(title).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted) }
            ForEach(Array(rows.enumerated()), id: \.offset) { _, r in
                HStack(spacing: ZCSpace.v2) {
                    if let color = r.color { Circle().fill(color).frame(width: 8, height: 8) }
                    if let label = r.label { Text(label).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted) }
                    Text(r.value).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).weight(.semibold)).foregroundStyle(c.text)
                }
            }
        }
        .padding(.horizontal, ZCSpace.v3)
        .padding(.vertical, ZCSpace.v2)
        .frame(maxWidth: 220, alignment: .leading)
        .fixedSize()
        .background(c.surface, in: shape)
        .overlay(shape.stroke(c.border))
        .shadow(color: .black.opacity(0.12), radius: 4, y: 2)
        .background(GeometryReader { Color.clear.preference(key: ZCTipSizeKey.self, value: $0.size) })
        .onPreferenceChange(ZCTipSizeKey.self) { size = $0 }
        .offset(x: x, y: y)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

// MARK: - Geometría de los gráficos con ejes

/// Medidas de texto para decidir la geometría (el dibujo usa el mismo tipo de letra y tamaño).
struct ZCTextMeter {
    let font: UIFont

    init(family: String, size: CGFloat) {
        let scaled = UIFontMetrics(forTextStyle: .caption1).scaledValue(for: size)
        font = UIFont(name: family, size: scaled) ?? UIFont.systemFont(ofSize: scaled)
    }

    func size(_ s: String) -> CGSize { (s as NSString).size(withAttributes: [.font: font]) }
}

struct ZCAxisGeo {
    let kind: ZCChartKind
    let n: Int
    let plot: CGRect
    let scale: ZCScale
    let ticks: [(Double, String, CGSize)]
    let catLabels: [(Int, String, CGSize)]
    let vals: [Double]
    let valueLabels: [(String, CGSize)]

    /// Valor → coordenada: y en los verticales, x en las barras horizontales.
    func at(_ v: Double) -> CGFloat {
        let k = CGFloat((v - scale.min) / (scale.max - scale.min))
        return kind == .barH ? plot.minX + k * plot.width : plot.maxY - k * plot.height
    }

    func cx(_ i: Int) -> CGFloat {
        if kind == .line { return n == 1 ? plot.midX : plot.minX + CGFloat(i) * plot.width / CGFloat(n - 1) }
        return plot.minX + (CGFloat(i) + 0.5) * plot.width / CGFloat(n)
    }

    func cy(_ i: Int) -> CGFloat { plot.minY + (CGFloat(i) + 0.5) * plot.height / CGFloat(n) }

    func hit(_ p: CGPoint) -> Int? {
        switch kind {
        case .line:
            if p.x < plot.minX - 12 || p.x > plot.maxX + 12 { return nil }
            if n == 1 { return 0 }
            return min(max(Int(((p.x - plot.minX) / (plot.width / CGFloat(n - 1))).rounded()), 0), n - 1)
        case .stacked:
            if p.x < plot.minX || p.x > plot.maxX { return nil }
            return min(max(Int((p.x - plot.minX) / (plot.width / CGFloat(n))), 0), n - 1)
        case .barH:
            if p.y < plot.minY || p.y > plot.maxY { return nil }
            return min(max(Int((p.y - plot.minY) / (plot.height / CGFloat(n))), 0), n - 1)
        default: return nil
        }
    }

    func anchor(_ i: Int) -> CGPoint { kind == .barH ? CGPoint(x: at(vals[i]), y: cy(i)) : CGPoint(x: cx(i), y: plot.minY + plot.height / 3) }

    static func build(kind: ZCChartKind, data: ZCChartData, size: CGSize, meter: ZCTextMeter, narrow: Bool, format: (Double) -> String) -> ZCAxisGeo? {
        let n = data.categories.count
        guard size.width > 0, size.height > 0, n > 0 else { return nil }
        if kind == .barH {
            let vals = (0..<n).map { max(0, data.series.first?.values.indices.contains($0) == true ? data.series[0].values[$0] : 0) }
            let scale = zcNiceScale(0, vals.max() ?? 0, target: narrow ? 3 : 5)
            let ticks = scale.ticks.map { ($0, zcAxisShort($0), meter.size(zcAxisShort($0))) }
            let maxCat: CGFloat = narrow ? 80 : 120
            let cats = data.categories.map { s -> (String, CGSize) in let sz = meter.size(s); return (s, CGSize(width: min(sz.width, maxCat), height: sz.height)) }
            let valueLabels = vals.map { (format($0), meter.size(format($0))) }
            let left = (cats.map(\.1.width).max() ?? 0) + 12
            let right = max(size.width - ((valueLabels.map(\.1.width).max() ?? 0) + 12), left + 1)
            let bottom = max(size.height - (ticks.first?.2.height ?? 0) - 10, 9)
            return ZCAxisGeo(kind: kind, n: n, plot: CGRect(x: left, y: 4, width: right - left, height: bottom - 4), scale: scale, ticks: ticks,
                             catLabels: cats.enumerated().map { ($0, $1.0, $1.1) }, vals: vals, valueLabels: valueLabels)
        }
        let all = data.series.flatMap(\.values)
        let lo: Double, hi: Double
        if kind == .stacked {
            lo = 0
            hi = (0..<n).map { i in data.series.reduce(0.0) { $0 + max(0, $1.values.indices.contains(i) ? $1.values[i] : 0) } }.max() ?? 0
        } else { lo = all.min() ?? 0; hi = all.max() ?? 0 }
        let scale = zcNiceScale(lo, hi, target: 4)
        let ticks = scale.ticks.map { ($0, zcAxisShort($0), meter.size(zcAxisShort($0))) }
        let labelW = ticks.map(\.2.width).max() ?? 0
        let labelH = ticks.first?.2.height ?? 0
        let left = labelW + 12
        let right = size.width - (narrow ? 8 : 16)
        let top = labelH / 2 + 2
        let bottom = max(size.height - labelH - 10, top + 1)
        let plot = CGRect(x: left, y: top, width: max(right, left + 1) - left, height: bottom - top)
        let cats = data.categories.map { ($0, meter.size($0)) }
        let slot = (kind == .line && n > 1) ? plot.width / CGFloat(n - 1) : plot.width / CGFloat(n)
        let maxCw = cats.map(\.1.width).max() ?? 0
        let lineCap = kind == .line ? Int(ceil(Double(n) / (narrow ? 4 : 7))) : 1
        let every = max(1, max(lineCap, Int(ceil((maxCw + 8) / slot))))
        let shown = cats.enumerated().compactMap { i, c in i % every == 0 ? (i, c.0, c.1) : nil }
        return ZCAxisGeo(kind: kind, n: n, plot: plot, scale: scale, ticks: ticks, catLabels: shown, vals: [], valueLabels: [])
    }
}

private func zcSmoothPath(_ pts: [CGPoint]) -> Path {
    var p = Path()
    guard let first = pts.first else { return p }
    p.move(to: first)
    for i in 0..<max(pts.count - 1, 0) {
        let p0 = i > 0 ? pts[i - 1] : pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = i + 2 < pts.count ? pts[i + 2] : p2
        let lo = min(p1.y, p2.y), hi = max(p1.y, p2.y)
        let s: CGFloat = 0.15
        p.addCurve(to: p2,
                   control1: CGPoint(x: p1.x + (p2.x - p0.x) * s, y: min(max(p1.y + (p2.y - p0.y) * s, lo), hi)),
                   control2: CGPoint(x: p2.x - (p3.x - p1.x) * s, y: min(max(p2.y - (p3.y - p1.y) * s, lo), hi)))
    }
    return p
}

private func zcRoundedCorners(_ rect: CGRect, radius: CGFloat, top: Bool, right: Bool) -> Path {
    let k = max(0, min(radius, min(rect.width / 2, rect.height / 2)))
    var corners: UIRectCorner = []
    if top { corners.insert([.topLeft, .topRight]) }
    if right { corners.insert([.topRight, .bottomRight]) }
    return Path(UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: k, height: k)).cgPath)
}

// MARK: - Leyenda

private struct ZCChartLegend: View {
    @Environment(\.zcTheme) private var theme
    let data: ZCChartData
    let kind: ZCChartKind
    let palette: [Color]

    var body: some View {
        ZCFlowLayout(spacing: ZCSpace.v4, lineSpacing: ZCSpace.v1) {
            ForEach(Array(data.series.enumerated()), id: \.offset) { i, s in
                HStack(spacing: 6) {
                    let color = zcSeriesColor(palette, i, s)
                    if kind == .line {
                        if s.dashed { HStack(spacing: 2) { ForEach(0..<2, id: \.self) { _ in Capsule().fill(color).frame(width: 7, height: 3) } } }
                        else { Capsule().fill(color).frame(width: 16, height: 3) }
                    } else {
                        RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 10, height: 10)
                    }
                    Text(s.name).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(theme.colors.textMuted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityHidden(true)
    }
}

// MARK: - Gráfico

/// Gráfico dibujado a mano con los tokens `chart1…6` (`Canvas`, sin Swift Charts: así los 11 tipos se ven igual en las tres plataformas): línea (con área suave
/// en la primera serie y punteada para el periodo anterior), barras horizontales (el mayor en el color principal y el resto en neutro), apiladas y dona (total al
/// centro), y los de operación. Al tocar o deslizar aparece el globo con los valores. VoiceOver lee un resumen (`description` y valores); la alternativa completa
/// es la vista Datos de `ZCChartPanel`.
public struct ZCChart: View {
    @Environment(\.zcTheme) private var theme
    private let data: ZCChartData
    private let kind: ZCChartKind
    private let format: (Double) -> String
    private let description: String?
    private let totalLabel: String
    private let height: CGFloat?
    private let initialSelection: Int?
    @State private var width: CGFloat = 390

    public init(data: ZCChartData, kind: ZCChartKind, format: @escaping (Double) -> String = zcAxisShort, description: String? = nil, totalLabel: String = "", height: CGFloat? = nil, initialSelection: Int? = nil) {
        self.data = data
        self.kind = kind
        self.format = format
        self.description = description
        self.totalLabel = totalLabel
        self.height = height
        self.initialSelection = initialSelection
    }

    public var body: some View {
        let palette = theme.colors.chartPalette
        let narrow = width < 480
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            if kind == .line || kind == .stacked { ZCChartLegend(data: data, kind: kind, palette: palette) }
            switch kind {
            case .donut: ZCDonutBody(data: data, narrow: narrow, maxWidth: width, format: format, description: description, totalLabel: totalLabel, palette: palette, initialSelection: initialSelection)
            case .line, .barH, .stacked: ZCAxisBody(data: data, kind: kind, narrow: narrow, format: format, description: description, height: height, palette: palette, initialSelection: initialSelection)
            default: ZCOpsBody(data: data, kind: kind, narrow: narrow, format: format, description: description, height: height, palette: palette, initialSelection: initialSelection)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(GeometryReader { g in Color.clear.onAppear { width = g.size.width }.onChange(of: g.size.width) { _, w in width = w } })
    }
}

private struct ZCAxisBody: View {
    @Environment(\.zcTheme) private var theme
    @State private var sel: Int?
    @State private var downSel: Int?
    let data: ZCChartData
    let kind: ZCChartKind
    let narrow: Bool
    let format: (Double) -> String
    let description: String?
    let height: CGFloat?
    let palette: [Color]
    let initialSelection: Int?

    init(data: ZCChartData, kind: ZCChartKind, narrow: Bool, format: @escaping (Double) -> String, description: String?, height: CGFloat?, palette: [Color], initialSelection: Int?) {
        self.data = data; self.kind = kind; self.narrow = narrow; self.format = format; self.description = description; self.height = height; self.palette = palette; self.initialSelection = initialSelection
        _sel = State(initialValue: initialSelection)
    }

    var body: some View {
        let c = theme.colors
        let h = height ?? (kind == .barH ? 36 * CGFloat(data.categories.count) + 32 : 220)
        let summary = zcChartSummary(title: description, data: data, kind: kind, format: format)
        let meter = ZCTextMeter(family: theme.fontFamily, size: narrow ? 11 : 12)
        GeometryReader { geo in
            let geom = ZCAxisGeo.build(kind: kind, data: data, size: geo.size, meter: meter, narrow: narrow, format: format)
            ZStack(alignment: .topLeading) {
                Canvas { ctx, size in
                    guard let g = geom else { return }
                    draw(&ctx, size: size, g: g, colors: c)
                }
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { v in
                            if downSel == nil { downSel = sel }
                            sel = geom?.hit(v.location)
                        }
                        .onEnded { v in
                            let moved = hypot(v.translation.width, v.translation.height) > 6
                            if !moved, let i = geom?.hit(v.location), i == downSel { sel = nil }
                            downSel = nil
                        }
                )
                if let g = geom, let i = sel, i < g.n {
                    let rows: [ZCTipRow] = kind == .barH
                        ? [ZCTipRow(color: palette[0], label: data.series.first?.name, value: format(g.vals[i]))]
                        : data.series.enumerated().map { si, s in ZCTipRow(color: zcSeriesColor(palette, si, s), label: s.name, value: format(s.values.indices.contains(i) ? s.values[i] : 0)) }
                    ZCChartTooltip(anchor: g.anchor(i), bounds: geo.size, title: data.categories[i], rows: rows)
                }
            }
        }
        .frame(height: h)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(summary)
        .accessibilityAddTraits(.isImage)
    }

    private func label(_ ctx: inout GraphicsContext, _ s: String, at p: CGPoint, anchor: UnitPoint, color: Color) {
        ctx.draw(Text(s).font(.zc(ZCTypeStyle(size: narrow ? 11 : 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundColor(color), at: p, anchor: anchor)
    }

    private func draw(_ ctx: inout GraphicsContext, size: CGSize, g: ZCAxisGeo, colors c: ZCColors) {
        let selected = sel.flatMap { $0 < g.n ? $0 : nil }
        if let selected {
            if kind == .stacked { let w = g.plot.width / CGFloat(g.n); ctx.fill(Path(CGRect(x: g.plot.minX + CGFloat(selected) * w, y: g.plot.minY, width: w, height: g.plot.height)), with: .color(c.surface2)) }
            if kind == .barH { let rh = g.plot.height / CGFloat(g.n); ctx.fill(Path(CGRect(x: g.plot.minX, y: g.plot.minY + CGFloat(selected) * rh, width: size.width - g.plot.minX, height: rh)), with: .color(c.surface2)) }
        }
        drawAxes(&ctx, g: g, border: c.border, labelColor: c.textMuted, size: size)
        switch kind {
        case .line:
            for (si, s) in data.series.enumerated() {
                let pts = (0..<g.n).map { CGPoint(x: g.cx($0), y: g.at(s.values.indices.contains($0) ? s.values[$0] : 0)) }
                let color = zcSeriesColor(palette, si, s)
                if si == 0 && !s.dashed && pts.count > 1 {
                    var area = zcSmoothPath(pts)
                    area.addLine(to: CGPoint(x: pts.last!.x, y: g.plot.maxY)); area.addLine(to: CGPoint(x: pts[0].x, y: g.plot.maxY)); area.closeSubpath()
                    ctx.fill(area, with: .color(palette[0].opacity(0.08)))
                }
                if pts.count == 1 { ctx.fill(Path(ellipseIn: CGRect(x: pts[0].x - 3, y: pts[0].y - 3, width: 6, height: 6)), with: .color(color)) }
                ctx.stroke(zcSmoothPath(pts), with: .color(color), style: StrokeStyle(lineWidth: s.dashed ? 1.5 : 2.5, lineCap: .round, dash: s.dashed ? [6, 4] : []))
            }
            if let selected {
                let x = g.cx(selected)
                var l = Path(); l.move(to: CGPoint(x: x, y: g.plot.minY)); l.addLine(to: CGPoint(x: x, y: g.plot.maxY))
                ctx.stroke(l, with: .color(c.borderStrong), lineWidth: 1)
                for (si, s) in data.series.enumerated() {
                    let p = CGPoint(x: x, y: g.at(s.values.indices.contains(selected) ? s.values[selected] : 0))
                    ctx.fill(Path(ellipseIn: CGRect(x: p.x - 5.5, y: p.y - 5.5, width: 11, height: 11)), with: .color(c.surface))
                    ctx.fill(Path(ellipseIn: CGRect(x: p.x - 3.5, y: p.y - 3.5, width: 7, height: 7)), with: .color(zcSeriesColor(palette, si, s)))
                }
            }
        case .stacked:
            let barW = min(g.plot.width / CGFloat(g.n) * 0.6, narrow ? 20 : 32)
            for i in 0..<g.n {
                var acc = 0.0
                let topIdx = data.series.lastIndex { ($0.values.indices.contains(i) ? $0.values[i] : 0) > 0 }
                for (si, s) in data.series.enumerated() {
                    let v = s.values.indices.contains(i) ? s.values[i] : 0
                    if v <= 0 { continue }
                    let yTop = g.at(acc + v), yBottom = g.at(acc)
                    acc += v
                    let l = g.cx(i) - barW / 2
                    let rect = CGRect(x: l, y: yTop, width: barW, height: yBottom - yTop)
                    let color = palette[si % palette.count]
                    if si == topIdx { ctx.fill(zcRoundedCorners(rect, radius: 6, top: true, right: false), with: .color(color)) } else { ctx.fill(Path(rect), with: .color(color)) }
                }
            }
        default:
            let peak = g.vals.indices.max { g.vals[$0] < g.vals[$1] } ?? 0
            let rowH = g.plot.height / CGFloat(g.n)
            let bar = min(narrow ? 14 : 18, rowH * 0.8)
            for i in 0..<g.n {
                let cy = g.cy(i), x1 = g.at(g.vals[i])
                if x1 > g.plot.minX { ctx.fill(zcRoundedCorners(CGRect(x: g.plot.minX, y: cy - bar / 2, width: x1 - g.plot.minX, height: bar), radius: 6, top: false, right: true), with: .color(i == peak ? palette[0] : c.surface3)) }
                label(&ctx, g.valueLabels[i].0, at: CGPoint(x: x1 + 6, y: cy), anchor: .leading, color: c.text)
            }
        }
    }

    private func drawAxes(_ ctx: inout GraphicsContext, g: ZCAxisGeo, border: Color, labelColor: Color, size: CGSize) {
        let dash = StrokeStyle(lineWidth: 1, dash: [4, 4])
        if kind == .barH {
            for (v, text, sz) in g.ticks {
                let x = g.at(v)
                if v != 0 { var p = Path(); p.move(to: CGPoint(x: x, y: g.plot.minY)); p.addLine(to: CGPoint(x: x, y: g.plot.maxY)); ctx.stroke(p, with: .color(border), style: dash) }
                let cx = min(max(x, sz.width / 2), max(size.width - sz.width / 2, sz.width / 2))
                label(&ctx, text, at: CGPoint(x: cx, y: g.plot.maxY + 6), anchor: .top, color: labelColor)
            }
            var axis = Path(); axis.move(to: CGPoint(x: g.plot.minX, y: g.plot.minY)); axis.addLine(to: CGPoint(x: g.plot.minX, y: g.plot.maxY))
            ctx.stroke(axis, with: .color(border), lineWidth: 1)
            for (i, text, _) in g.catLabels { label(&ctx, text, at: CGPoint(x: g.plot.minX - 8, y: g.cy(i)), anchor: .trailing, color: labelColor) }
            return
        }
        for (v, text, _) in g.ticks {
            let y = g.at(v)
            if v != 0 { var p = Path(); p.move(to: CGPoint(x: g.plot.minX, y: y)); p.addLine(to: CGPoint(x: g.plot.maxX, y: y)); ctx.stroke(p, with: .color(border), style: dash) }
            label(&ctx, text, at: CGPoint(x: g.plot.minX - 8, y: min(max(y, 6), size.height - 6)), anchor: .trailing, color: labelColor)
        }
        let y0 = min(max(g.at(0), g.plot.minY), g.plot.maxY)
        var base = Path(); base.move(to: CGPoint(x: g.plot.minX, y: y0)); base.addLine(to: CGPoint(x: g.plot.maxX, y: y0))
        ctx.stroke(base, with: .color(border), lineWidth: 1)
        for (i, text, sz) in g.catLabels {
            let cx = min(max(g.cx(i), sz.width / 2), max(size.width - sz.width / 2, sz.width / 2))
            label(&ctx, text, at: CGPoint(x: cx, y: g.plot.maxY + 6), anchor: .top, color: labelColor)
        }
    }
}

// MARK: - Dona

private struct ZCDonutBody: View {
    @Environment(\.zcTheme) private var theme
    @State private var sel: Int?
    @State private var anchor: CGPoint = .zero
    let data: ZCChartData
    let narrow: Bool
    let maxWidth: CGFloat
    let format: (Double) -> String
    let description: String?
    let totalLabel: String
    let palette: [Color]

    init(data: ZCChartData, narrow: Bool, maxWidth: CGFloat, format: @escaping (Double) -> String, description: String?, totalLabel: String, palette: [Color], initialSelection: Int?) {
        self.data = data; self.narrow = narrow; self.maxWidth = maxWidth; self.format = format; self.description = description; self.totalLabel = totalLabel; self.palette = palette
        _sel = State(initialValue: initialSelection)
    }

    private var values: [Double] { data.categories.indices.map { max(0, data.series.first?.values.indices.contains($0) == true ? data.series[0].values[$0] : 0) } }

    private func hit(_ p: CGPoint, size s: CGFloat, total: Double) -> Int? {
        let outer = s / 2 - 4, th = outer * 0.32
        let dx = p.x - s / 2, dy = p.y - s / 2, r = hypot(dx, dy)
        if total <= 0 || r < outer - th - 8 || r > outer + 8 { return nil }
        var deg = atan2(dy, dx) * 180 / .pi + 90
        if deg < 0 { deg += 360 }
        var acc = 0.0
        for (i, v) in values.enumerated() {
            let sw = v / total * 360
            if sw > 0 && deg < acc + sw { return i }
            acc += sw
        }
        return values.lastIndex { $0 > 0 }
    }

    private var ring: some View {
        let c = theme.colors
        let values = self.values
        let total = values.reduce(0, +)
        let side: CGFloat = narrow ? min(maxWidth, 180) : 200
        let summary = zcChartSummary(title: description, data: data, kind: .donut, format: format)
        return ZStack(alignment: .topLeading) {
            ZStack {
                Canvas { ctx, size in
                    let outer = min(size.width, size.height) / 2 - 4, th = outer * 0.32, mid = outer - th / 2
                    let center = CGPoint(x: size.width / 2, y: size.height / 2)
                    if total <= 0 { ctx.stroke(Path(ellipseIn: CGRect(x: center.x - mid, y: center.y - mid, width: mid * 2, height: mid * 2)), with: .color(c.surface3), lineWidth: th); return }
                    let gap = values.filter { $0 > 0 }.count > 1 ? (3 / Double(mid)) * 180 / .pi : 0
                    var start = -90.0
                    for (i, v) in values.enumerated() where v > 0 {
                        let sweep = v / total * 360
                        var arc = Path()
                        arc.addArc(center: center, radius: mid, startAngle: .degrees(start + gap / 2), endAngle: .degrees(start + gap / 2 + max(sweep - gap, 0.5)), clockwise: false)
                        ctx.stroke(arc, with: .color(palette[i % palette.count]), style: StrokeStyle(lineWidth: th + (sel == i ? 6 : 0)))
                        start += sweep
                    }
                }
                VStack(spacing: 0) {
                    Text(format(total)).font(.zc(narrow ? ZCType.body : ZCType.titleSm, theme: theme).weight(.semibold)).foregroundStyle(c.text).lineLimit(1)
                    if !totalLabel.isEmpty { Text(totalLabel).font(.zc(ZCType.tiny, theme: theme)).foregroundStyle(c.textMuted).lineLimit(1) }
                }
                .frame(maxWidth: side * 0.55)
            }
            .frame(width: side, height: side)
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onEnded { v in
                let h = hit(v.location, size: side, total: total)
                sel = h == sel ? nil : h
                anchor = v.location
            })
            if let i = sel, i < values.count {
                let pct = total > 0 ? Int((values[i] / total * 100).rounded()) : 0
                ZCChartTooltip(anchor: anchor, bounds: CGSize(width: side, height: side), title: nil, rows: [ZCTipRow(color: palette[i % palette.count], label: data.categories[i], value: "\(format(values[i])) (\(pct) %)")])
            }
        }
        .frame(width: side, height: side)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(summary)
        .accessibilityAddTraits(.isImage)
    }

    private var legend: some View {
        let values = self.values
        let total = values.reduce(0, +)
        let items = ForEach(Array(data.categories.enumerated()), id: \.offset) { i, name in
            let pct = total > 0 ? Int((values[i] / total * 100).rounded()) : 0
            HStack(spacing: 6) {
                RoundedRectangle(cornerRadius: 2).fill(palette[i % palette.count]).frame(width: 12, height: 8)
                Text(name).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(theme.colors.textMuted)
                Text("\(pct) %").font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(theme.colors.text)
            }
        }
        return Group {
            if narrow { ZCFlowLayout(spacing: ZCSpace.v3, lineSpacing: ZCSpace.v1) { items }.frame(maxWidth: .infinity) }
            else { VStack(alignment: .leading, spacing: 6) { items } }
        }
        .accessibilityHidden(true)
    }

    var body: some View {
        if narrow {
            VStack(spacing: ZCSpace.v3) { ring; legend }.frame(maxWidth: .infinity)
        } else {
            HStack(spacing: 32) { ring; legend.frame(maxWidth: .infinity, alignment: .leading) }
        }
    }
}

// MARK: - Vista de datos, segmentado y panel

/// Vista Datos (alternativa accesible del gráfico): una fila por categoría y una columna por serie (la dona y las barras, solo la primera).
public struct ZCChartTable: View {
    @Environment(\.zcTheme) private var theme
    private let data: ZCChartData
    private let kind: ZCChartKind
    private let categoryLabel: String
    private let format: (Double) -> String

    public init(data: ZCChartData, kind: ZCChartKind, categoryLabel: String = "", format: @escaping (Double) -> String = zcAxisShort) {
        self.data = data
        self.kind = kind
        self.categoryLabel = categoryLabel
        self.format = format
    }

    public var body: some View {
        let c = theme.colors
        let series = (kind == .line || kind == .stacked || kind == .heatmap) ? data.series : Array(data.series.prefix(1))
        let small = ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption)
        VStack(spacing: 0) {
            HStack(spacing: ZCSpace.v3) {
                Text(categoryLabel).font(.zc(small, theme: theme).weight(.semibold)).foregroundStyle(c.textMuted).frame(maxWidth: .infinity, alignment: .leading).layoutPriority(1.4)
                ForEach(Array(series.enumerated()), id: \.offset) { _, s in
                    Text(s.name).font(.zc(small, theme: theme).weight(.semibold)).foregroundStyle(c.textMuted).frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
            .padding(.vertical, ZCSpace.v2).frame(minHeight: 40)
            ZCDivider()
            ForEach(Array(data.categories.enumerated()), id: \.offset) { i, cat in
                HStack(spacing: ZCSpace.v3) {
                    Text(cat).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.text).frame(maxWidth: .infinity, alignment: .leading).layoutPriority(1.4)
                    ForEach(Array(series.enumerated()), id: \.offset) { _, s in
                        Text(format(s.values.indices.contains(i) ? s.values[i] : 0)).font(.zc(ZCType.bodySm, theme: theme).zcTabular()).foregroundStyle(c.text).frame(maxWidth: .infinity, alignment: .trailing)
                    }
                }
                .padding(.vertical, ZCSpace.v2).frame(minHeight: 44)
                .accessibilityElement(children: .combine)
                ZCDivider()
            }
        }
    }
}

public struct ZCSegmentOption: Identifiable, Sendable {
    public let id: String
    public let label: String

    public init(id: String, label: String) {
        self.id = id
        self.label = label
    }
}

/// Segmentado: pista `surface2`, el elegido sobre `surface` con sombra. Cada opción mide al menos 44 pt de alto con el dedo; `small` es el tamaño de las barras de
/// gráficos y listados.
public struct ZCSegmented: View {
    @Environment(\.zcTheme) private var theme
    private let options: [ZCSegmentOption]
    private let selected: Binding<String>
    private let label: String?
    private let small: Bool

    public init(options: [ZCSegmentOption], selected: Binding<String>, label: String? = nil, small: Bool = true) {
        self.options = options
        self.selected = selected
        self.label = label
        self.small = small
    }

    public var body: some View {
        let c = theme.colors
        let h = small ? ZCSize.targetSm : ZCSize.target
        HStack(spacing: 0) {
            ForEach(options) { o in
                let on = o.id == selected.wrappedValue
                Button {
                    guard !on else { return }
                    UISelectionFeedbackGenerator().selectionChanged()
                    selected.wrappedValue = o.id
                } label: {
                    Text(o.label).font(.zc(ZCType.bodySm, theme: theme).weight(.medium)).foregroundStyle(on ? c.text : c.textMuted)
                        .padding(.horizontal, ZCSpace.v3)
                        .frame(minHeight: h - 8)
                        .background { if on { RoundedRectangle(cornerRadius: ZCRadius.sm - 2, style: .continuous).fill(c.surface).shadow(color: .black.opacity(0.12), radius: 1, y: 1) } }
                        .padding(.vertical, 4)
                        .frame(minHeight: h)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(o.label)
                .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
            }
        }
        .padding(.horizontal, 2)
        .background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }
}

/// Gráfico con su barra de herramientas: "Vista" (Gráfico, Datos) y, a continuación, los filtros del llamador (periodo, métrica, país, Comparar). Sin datos muestra el
/// estado vacío; la vista Datos lleva el título como en la web ("Datos: …").
public struct ZCChartPanel<Toolbar: View>: View {
    @Environment(\.zcTheme) private var theme
    @State private var view = "chart"
    private let title: String
    private let data: ZCChartData?
    private let kind: ZCChartKind
    private let format: (Double) -> String
    private let totalLabel: String
    private let categoryLabel: String
    private let toolbar: Toolbar

    public init(title: String, data: ZCChartData?, kind: ZCChartKind, format: @escaping (Double) -> String = zcAxisShort, totalLabel: String = "", categoryLabel: String = "", @ViewBuilder toolbar: () -> Toolbar) {
        self.title = title
        self.data = data
        self.kind = kind
        self.format = format
        self.totalLabel = totalLabel
        self.categoryLabel = categoryLabel
        self.toolbar = toolbar()
    }

    public var body: some View {
        let has = zcChartHasData(data)
        VStack(alignment: .leading, spacing: ZCSpace.v3) {
            if has || Toolbar.self != EmptyView.self {
                ZCFlowLayout(spacing: ZCSpace.v2, lineSpacing: ZCSpace.v2) {
                    if has {
                        ZCSegmented(options: [ZCSegmentOption(id: "chart", label: ZCString.text("org.grafico")), ZCSegmentOption(id: "data", label: ZCString.text("org.datos"))], selected: $view, label: ZCString.text("org.vista"))
                    }
                    toolbar
                }
            }
            if !has || data == nil {
                ZCState(ZCString.text("org.sinDatos"), text: ZCString.text("org.sinDatosTexto"))
            } else if view == "data", let data {
                Text(ZCString.text("org.datosDe", title)).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(theme.colors.textMuted)
                ZCChartTable(data: data, kind: kind, categoryLabel: categoryLabel, format: format)
            } else if let data {
                ZCChart(data: data, kind: kind, format: format, description: title, totalLabel: totalLabel)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

public extension ZCChartPanel where Toolbar == EmptyView {
    init(title: String, data: ZCChartData?, kind: ZCChartKind, format: @escaping (Double) -> String = zcAxisShort, totalLabel: String = "", categoryLabel: String = "") {
        self.init(title: title, data: data, kind: kind, format: format, totalLabel: totalLabel, categoryLabel: categoryLabel) { EmptyView() }
    }
}
