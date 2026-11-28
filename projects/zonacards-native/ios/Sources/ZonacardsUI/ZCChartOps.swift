import SwiftUI
import UIKit
import ZonacardsTokens

// Gráficos de operación. Misma forma de datos que el resto de ZCChart:
// - funnel, treemap: categorías = etapas o categorías; series[0] = valores.
// - waterfall: la primera y la última categoría son totales; las del medio, ajustes (negativos restan).
// - heatmap: categorías = columnas (horas); cada serie es una fila (día) con un valor por columna.
// - calendar: categorías = fechas ISO (aaaa-mm-dd); series[0] = valor por día.
// - sankey: categorías "Origen → Destino"; series[0] = valor del flujo.
// - gauge: series[0].values = [logrado, meta]; muestra el porcentaje.

/// Zona tocable: junto con el globo que abre.
struct ZCOpsRegion {
    let anchor: CGPoint
    let title: String?
    let rows: [ZCTipRow]
    let contains: (CGPoint) -> Bool
}

/// Regiones tocables y la función que dibuja (con la región elegida, si hay).
struct ZCOpsGeo {
    let regions: [ZCOpsRegion]
    let draw: (inout GraphicsContext, CGSize, Int?) -> Void
}

private func zcRGBA(_ c: Color) -> (CGFloat, CGFloat, CGFloat, CGFloat) {
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    UIColor(c).getRed(&r, green: &g, blue: &b, alpha: &a)
    return (r, g, b, a)
}

private func zcLuminance(_ c: Color) -> CGFloat {
    let (r, g, b, _) = zcRGBA(c)
    func lin(_ v: CGFloat) -> CGFloat { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

func zcLerp(_ a: Color, _ b: Color, _ t: CGFloat) -> Color {
    let (r1, g1, b1, a1) = zcRGBA(a), (r2, g2, b2, a2) = zcRGBA(b)
    return Color(.sRGB, red: Double(r1 + (r2 - r1) * t), green: Double(g1 + (g2 - g1) * t), blue: Double(b1 + (b2 - b1) * t), opacity: Double(a1 + (a2 - a1) * t))
}

struct ZCOpsEnv {
    let c: ZCColors
    let palette: [Color]
    let format: (Double) -> String
    let narrow: Bool
    let size: CGSize
    let en: Bool
    let family: String
    let theme: ZCTheme

    var w: CGFloat { size.width }
    var h: CGFloat { size.height }

    func meter(_ pt: CGFloat) -> ZCTextMeter { ZCTextMeter(family: family, size: pt) }

    /// Texto sobre un relleno: el de `text` o el de `surface`, el que más contraste dé (el ámbar no admite texto claro).
    func onFill(_ fill: Color) -> Color {
        func ratio(_ a: Color, _ b: Color) -> CGFloat { let l1 = zcLuminance(a), l2 = zcLuminance(b); return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05) }
        return ratio(fill, c.surface) >= ratio(fill, c.text) ? c.surface : c.text
    }

    /// Recorta con "…" para que quepa en `maxWidth`.
    func fit(_ s: String, _ pt: CGFloat, maxWidth: CGFloat) -> String {
        let m = meter(pt)
        if m.size(s).width <= maxWidth { return s }
        var t = s
        while t.count > 1 && m.size(t + "…").width > maxWidth { t.removeLast() }
        return t + "…"
    }

    func draw(_ ctx: inout GraphicsContext, _ s: String, at p: CGPoint, anchor: UnitPoint, color: Color, pt: CGFloat = 12, weight: Font.Weight = .regular, maxWidth: CGFloat? = nil) {
        let text = maxWidth.map { fit(s, pt, maxWidth: $0) } ?? s
        ctx.draw(Text(text).font(.zc(ZCTypeStyle(size: pt, lineHeight: pt * 1.4, relativeTo: .caption), theme: theme).weight(weight)).foregroundColor(color), at: p, anchor: anchor)
    }

    func size(_ s: String, _ pt: CGFloat) -> CGSize { meter(pt).size(s) }
}

private func firstSeries(_ data: ZCChartData, coerce: Bool = true) -> [Double] {
    (0..<data.categories.count).map { i in
        let v = data.series.first?.values.indices.contains(i) == true ? data.series[0].values[i] : 0
        return coerce ? max(0, v) : v
    }
}

private let emptyGeo = ZCOpsGeo(regions: [], draw: { _, _, _ in })

private func line(_ a: CGPoint, _ b: CGPoint) -> Path { var p = Path(); p.move(to: a); p.addLine(to: b); return p }

// MARK: - Embudo

private func buildFunnel(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let n = data.categories.count
    if n == 0 { return emptyGeo }
    let vals = firstSeries(data)
    let mx = (vals.max() ?? 0) > 0 ? vals.max()! : 1
    let left = e.w * 0.04, pw = e.w * 0.78, cx = left + pw / 2
    let top: CGFloat = 8, gap: CGFloat = 3
    let band = (e.h - 2 * top - gap * CGFloat(n - 1)) / CGFloat(n)
    func wAt(_ v: Double) -> CGFloat { pw * max(0.3, CGFloat(v / mx)) }
    struct Stage { let y0, y1, tw, bw: CGFloat }
    let stages = (0..<n).map { i -> Stage in let y0 = top + CGFloat(i) * (band + gap); return Stage(y0: y0, y1: y0 + band, tw: wAt(vals[i]), bw: wAt(i + 1 < n ? vals[i + 1] : vals[i])) }
    func path(_ s: Stage) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: cx - s.tw / 2, y: s.y0)); p.addLine(to: CGPoint(x: cx + s.tw / 2, y: s.y0))
        p.addLine(to: CGPoint(x: cx + s.bw / 2, y: s.y1)); p.addLine(to: CGPoint(x: cx - s.bw / 2, y: s.y1)); p.closeSubpath()
        return p
    }
    let regions = stages.enumerated().map { i, s in
        ZCOpsRegion(anchor: CGPoint(x: cx + s.tw / 2, y: (s.y0 + s.y1) / 2), title: data.categories[i], rows: [ZCTipRow(color: e.palette[i % e.palette.count], label: nil, value: e.format(vals[i]))]) { p in
            p.y >= s.y0 && p.y <= s.y1 && abs(p.x - cx) <= max(s.tw, s.bw) / 2
        }
    }
    return ZCOpsGeo(regions: regions) { ctx, _, sel in
        for (i, s) in stages.enumerated() {
            let fill = e.palette[i % e.palette.count]
            ctx.fill(path(s), with: .color(fill))
            if sel == i { ctx.stroke(path(s), with: .color(e.c.text), lineWidth: 2) }
            let maxW = max(min(s.tw, s.bw) - 8, 1)
            let one = band < 32
            let mid = CGPoint(x: cx, y: (s.y0 + s.y1) / 2)
            if one { e.draw(&ctx, "\(data.categories[i])  \(e.format(vals[i]))", at: mid, anchor: .center, color: e.onFill(fill), maxWidth: maxW) }
            else {
                e.draw(&ctx, data.categories[i], at: CGPoint(x: cx, y: mid.y - 8), anchor: .center, color: e.onFill(fill), maxWidth: maxW)
                e.draw(&ctx, e.format(vals[i]), at: CGPoint(x: cx, y: mid.y + 8), anchor: .center, color: e.onFill(fill), maxWidth: maxW)
            }
        }
    }
}

// MARK: - Cascada

private func buildWaterfall(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let n = data.categories.count
    if n == 0 { return emptyGeo }
    let vals = firstSeries(data, coerce: false)
    var lo = [Double](repeating: 0, count: n), hi = [Double](repeating: 0, count: n)
    var acc = 0.0
    for i in 0..<n {
        let v = vals[i]
        if i == 0 || i == n - 1 { lo[i] = min(0, v); hi[i] = max(0, v); acc = v }
        else { let prev = acc; acc += v; lo[i] = min(prev, acc); hi[i] = max(prev, acc) }
    }
    let scale = zcNiceScale(lo.min() ?? 0, hi.max() ?? 0, target: 4)
    let ticks = scale.ticks.map { ($0, zcAxisShort($0)) }
    let tickW = ticks.map { e.size($0.1, 11).width }.max() ?? 0
    let left = tickW + 12, right = e.w - 12
    let slot = (right - left) / CGFloat(n)
    let catMax = max(min(80, slot - 2), 1)
    let top: CGFloat = 22
    let bottom = max(e.h - 28, top + 1)
    func y(_ v: Double) -> CGFloat { bottom - CGFloat((v - scale.min) / (scale.max - scale.min)) * (bottom - top) }
    let barW = min(slot * 0.7, 40)
    func cxOf(_ i: Int) -> CGFloat { left + (CGFloat(i) + 0.5) * slot }
    func colorOf(_ i: Int) -> Color { i == 0 ? e.palette[0] : (i == n - 1 ? e.c.successFg : (vals[i] < 0 ? e.c.dangerFg : e.c.successFg)) }
    let regions = (0..<n).map { i in
        ZCOpsRegion(anchor: CGPoint(x: cxOf(i) + barW / 2, y: y(hi[i])), title: data.categories[i], rows: [ZCTipRow(color: colorOf(i), label: nil, value: e.format(vals[i]))]) { p in
            p.x >= left + CGFloat(i) * slot && p.x <= left + CGFloat(i + 1) * slot && p.y >= top && p.y <= bottom
        }
    }
    return ZCOpsGeo(regions: regions) { ctx, size, sel in
        if let sel { ctx.fill(Path(CGRect(x: left + CGFloat(sel) * slot, y: top, width: slot, height: bottom - top)), with: .color(e.c.surface2)) }
        for (v, text) in ticks {
            let yy = y(v)
            if v != 0 { ctx.stroke(line(CGPoint(x: left, y: yy), CGPoint(x: right, y: yy)), with: .color(e.c.border), style: StrokeStyle(lineWidth: 1, dash: [4, 4])) }
            e.draw(&ctx, text, at: CGPoint(x: left - 8, y: min(max(yy, 6), size.height - 6)), anchor: .trailing, color: e.c.textMuted, pt: 11)
        }
        let y0 = min(max(y(0), top), bottom)
        ctx.stroke(line(CGPoint(x: left, y: y0), CGPoint(x: right, y: y0)), with: .color(e.c.border), lineWidth: 1)
        for i in 0..<n {
            let x = cxOf(i) - barW / 2
            let yTop = y(hi[i]), yBottom = y(lo[i])
            let r = min(4, min(barW / 2, abs(yBottom - yTop) / 2))
            ctx.fill(Path(roundedRect: CGRect(x: x, y: yTop, width: barW, height: max(yBottom - yTop, 1)), cornerRadius: r), with: .color(colorOf(i)))
            let label = ((i >= 1 && i < n - 1 && vals[i] < 0) ? "−" : "") + e.format(abs(vals[i]))
            e.draw(&ctx, label, at: CGPoint(x: cxOf(i), y: yTop - 4), anchor: .bottom, color: e.c.text, pt: 12)
            e.draw(&ctx, data.categories[i], at: CGPoint(x: cxOf(i), y: bottom + 6), anchor: .top, color: e.c.textMuted, pt: 11, maxWidth: catMax)
        }
    }
}

// MARK: - Rampa (mapa de calor y calendario)

private func drawRamp(_ e: ZCOpsEnv, _ ctx: inout GraphicsContext, end: Color, centerX: CGFloat, top: CGFloat, less: String, more: String) {
    let barW: CGFloat = 120, barH: CGFloat = 10, gap: CGFloat = 8
    let lw = e.size(less, 11).width, mw = e.size(more, 11).width
    let x0 = centerX - (lw + gap + barW + gap + mw) / 2
    e.draw(&ctx, less, at: CGPoint(x: x0, y: top + barH / 2), anchor: .leading, color: e.c.textMuted, pt: 11)
    let bx = x0 + lw + gap
    let rect = CGRect(x: bx, y: top, width: barW, height: barH)
    ctx.fill(Path(roundedRect: rect, cornerRadius: 3), with: .linearGradient(Gradient(colors: [e.c.surface3, end]), startPoint: CGPoint(x: bx, y: top), endPoint: CGPoint(x: bx + barW, y: top)))
    e.draw(&ctx, more, at: CGPoint(x: bx + barW + gap, y: top + barH / 2), anchor: .leading, color: e.c.textMuted, pt: 11)
}

// MARK: - Mapa de calor

private func buildHeatmap(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let rows = data.series, cols = data.categories.count
    if rows.isEmpty || cols == 0 { return emptyGeo }
    let mx = max(1, rows.map { $0.values.max() ?? 0 }.max() ?? 0)
    let rowW = rows.map { min(e.size($0.name, 12).width, 80) }.max() ?? 0
    let colStep = e.narrow ? 3 : 2
    let less = e.en ? "Less" : "Menos", more = e.en ? "More" : "Más"
    let left = rowW + 8, right = e.w - 8
    let legendH: CGFloat = 10, legendGap: CGFloat = 10
    let colH = e.size("0", 12).height
    let top: CGFloat = 4
    let bottom = max(e.h - colH - 8 - legendH - legendGap - 6, top + 1)
    let cw = (right - left) / CGFloat(cols), ch = (bottom - top) / CGFloat(rows.count)
    func cell(_ x: Int, _ y: Int) -> CGRect { CGRect(x: left + CGFloat(x) * cw, y: top + CGFloat(y) * ch, width: cw, height: ch) }
    func v(_ x: Int, _ y: Int) -> Double { rows[y].values.indices.contains(x) ? rows[y].values[x] : 0 }
    var regions: [ZCOpsRegion] = []
    for y in rows.indices { for x in 0..<cols {
        let r = cell(x, y)
        regions.append(ZCOpsRegion(anchor: CGPoint(x: r.midX, y: r.midY), title: "\(rows[y].name) \(data.categories[x])", rows: [ZCTipRow(color: nil, label: nil, value: e.format(v(x, y)))]) { $0.x >= r.minX && $0.x <= r.maxX && $0.y >= r.minY && $0.y <= r.maxY })
    } }
    return ZCOpsGeo(regions: regions) { ctx, size, sel in
        let inset: CGFloat = 1
        for y in rows.indices { for x in 0..<cols {
            let r = cell(x, y).insetBy(dx: inset, dy: inset)
            let t = min(max(CGFloat(v(x, y) / mx), 0), 1)
            ctx.fill(Path(roundedRect: r, cornerRadius: 3), with: .color(zcLerp(e.c.surface3, e.palette[0], t)))
        } }
        if let sel { ctx.stroke(Path(roundedRect: cell(sel % cols, sel / cols).insetBy(dx: inset, dy: inset), cornerRadius: 3), with: .color(e.c.text), lineWidth: 2) }
        for (y, row) in rows.enumerated() { e.draw(&ctx, row.name, at: CGPoint(x: left - 8, y: top + (CGFloat(y) + 0.5) * ch), anchor: .trailing, color: e.c.textMuted, maxWidth: 80) }
        for (x, name) in data.categories.enumerated() where x % colStep == 0 { e.draw(&ctx, name, at: CGPoint(x: left + (CGFloat(x) + 0.5) * cw, y: bottom + 6), anchor: .top, color: e.c.textMuted) }
        drawRamp(e, &ctx, end: e.palette[0], centerX: size.width / 2, top: bottom + 6 + colH + legendGap, less: less, more: more)
    }
}

// MARK: - Treemap

/// Treemap "squarified": devuelve un rectángulo por valor (en el mismo orden) dentro de `area`. Los valores van de mayor a menor.
func zcSquarify(_ values: [Double], in area: CGRect) -> [CGRect] {
    let n = values.count
    let total = values.reduce(0, +)
    if n == 0 || total <= 0 { return [CGRect](repeating: .zero, count: n) }
    let scale = Double(area.width * area.height) / total
    let areas = values.map { $0 * scale }
    var out = [CGRect](repeating: .zero, count: n)
    var cx = Double(area.minX), cy = Double(area.minY), cw = Double(area.width), ch = Double(area.height)
    var i = 0
    while i < n {
        let side = min(cw, ch)
        func worst(_ from: Int, _ to: Int, _ sum: Double) -> Double {
            var mx = 0.0, mn = Double.greatestFiniteMagnitude
            for k in from..<to { mx = max(mx, areas[k]); mn = min(mn, areas[k]) }
            return max(side * side * mx / (sum * sum), sum * sum / (side * side * mn))
        }
        var j = i, sum = 0.0, best = Double.greatestFiniteMagnitude
        while j < n {
            let s = sum + areas[j]
            let w = worst(i, j + 1, s)
            if j > i && w > best { break }
            best = w; sum = s; j += 1
        }
        let thick = sum / side
        if cw >= ch {
            var yy = cy
            for k in i..<j { let hh = areas[k] / thick; out[k] = CGRect(x: cx, y: yy, width: thick, height: hh); yy += hh }
            cx += thick; cw -= thick
        } else {
            var xx = cx
            for k in i..<j { let ww = areas[k] / thick; out[k] = CGRect(x: xx, y: cy, width: ww, height: thick); xx += ww }
            cy += thick; ch -= thick
        }
        i = j
    }
    return out
}

private func buildTreemap(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let vals = firstSeries(data)
    let order = vals.indices.filter { vals[$0] > 0 }.sorted { vals[$0] > vals[$1] }
    if order.isEmpty { return emptyGeo }
    let rects = zcSquarify(order.map { vals[$0] }, in: CGRect(x: 0, y: 0, width: e.w, height: e.h))
    let inner = rects.map { $0.insetBy(dx: 1, dy: 1) }
    let regions = order.enumerated().map { k, idx in
        ZCOpsRegion(anchor: CGPoint(x: inner[k].midX, y: inner[k].midY), title: data.categories[idx], rows: [ZCTipRow(color: e.palette[idx % e.palette.count], label: nil, value: e.format(vals[idx]))]) { p in inner[k].contains(p) }
    }
    return ZCOpsGeo(regions: regions) { ctx, _, sel in
        for (k, idx) in order.enumerated() {
            let r = inner[k], fill = e.palette[idx % e.palette.count]
            ctx.fill(Path(r), with: .color(fill))
            if sel == k { ctx.stroke(Path(r), with: .color(e.c.text), lineWidth: 2) }
            if r.width >= 64 && r.height >= 36 {
                e.draw(&ctx, data.categories[idx], at: CGPoint(x: r.minX + 8, y: r.minY + 6), anchor: .topLeading, color: e.onFill(fill), maxWidth: r.width - 16)
                e.draw(&ctx, e.format(vals[idx]), at: CGPoint(x: r.minX + 8, y: r.minY + 22), anchor: .topLeading, color: e.onFill(fill), maxWidth: r.width - 16)
            }
        }
    }
}

// MARK: - Calendario

private func buildCalendar(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let vals = firstSeries(data)
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "UTC")!
    func parse(_ s: String) -> Date? {
        let p = s.split(separator: "-").compactMap { Int($0) }
        guard p.count == 3 else { return nil }
        return cal.date(from: DateComponents(year: p[0], month: p[1], day: p[2], hour: 12))
    }
    let dates = data.categories.map(parse)
    guard let first = dates.compactMap({ $0 }).first else { return emptyGeo }
    let year = cal.component(.year, from: first)
    let jan1 = cal.date(from: DateComponents(year: year, month: 1, day: 1, hour: 12))!
    let offset = (cal.component(.weekday, from: jan1) + 5) % 7   // el lunes abre la semana
    let len = cal.range(of: .day, in: .year, for: jan1)!.count
    let weeks = (len - 1 + offset) / 7 + 1
    let cellH: CGFloat = e.narrow ? 9 : 13
    let left: CGFloat = 36, right = e.w - 8, top: CGFloat = 24
    let cw = (right - left) / CGFloat(weeks)
    let mx = max(1, vals.max() ?? 0)
    func rectAt(_ dayIndex: Int) -> CGRect {
        let wk = (dayIndex + offset) / 7, row = (dayIndex + offset) % 7
        return CGRect(x: left + CGFloat(wk) * cw, y: top + CGFloat(row) * cellH, width: cw, height: cellH)
    }
    let months = e.en ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    let monthStarts = (1...12).map { m -> (Int, String) in
        let d = cal.date(from: DateComponents(year: year, month: m, day: 1, hour: 12))!
        return ((cal.ordinality(of: .day, in: .year, for: d)! - 1 + offset) / 7, months[m - 1])
    }
    let dayNames = e.en ? ["M", "T", "W", "T", "F", "S", "S"] : ["L", "M", "X", "J", "V", "S", "D"]
    let less = e.en ? "Less" : "Menos", more = e.en ? "More" : "Más"
    let entries: [(Int, CGRect)] = dates.enumerated().compactMap { i, d in
        guard let d, cal.component(.year, from: d) == year else { return nil }
        return (i, rectAt(cal.ordinality(of: .day, in: .year, for: d)! - 1))
    }
    let regions = entries.map { i, r in
        ZCOpsRegion(anchor: CGPoint(x: r.midX, y: r.midY), title: data.categories[i], rows: [ZCTipRow(color: nil, label: nil, value: e.format(vals[i]))]) { r.insetBy(dx: -1, dy: -1).contains($0) }
    }
    return ZCOpsGeo(regions: regions) { ctx, size, sel in
        let inset: CGFloat = 0.75
        for i in 0..<len { ctx.fill(Path(rectAt(i).insetBy(dx: inset, dy: inset)), with: .color(e.c.surface2)) }
        for (i, r) in entries { ctx.fill(Path(r.insetBy(dx: inset, dy: inset)), with: .color(zcLerp(e.c.surface3, e.palette[1], min(max(CGFloat(vals[i] / mx), 0), 1)))) }
        if let sel, entries.indices.contains(sel) { ctx.stroke(Path(entries[sel].1), with: .color(e.c.text), lineWidth: 1.5) }
        for (row, name) in dayNames.enumerated() where !e.narrow || row % 2 == 0 {
            e.draw(&ctx, name, at: CGPoint(x: left - 6, y: top + (CGFloat(row) + 0.5) * cellH), anchor: .trailing, color: e.c.textMuted, pt: 10)
        }
        var lastEnd: CGFloat = -1
        for (wk, name) in monthStarts {
            let x = left + CGFloat(wk) * cw
            if x >= lastEnd + 4 { e.draw(&ctx, name, at: CGPoint(x: x, y: top - 6), anchor: .bottomLeading, color: e.c.textMuted, pt: 11); lastEnd = x + e.size(name, 11).width }
        }
        drawRamp(e, &ctx, end: e.palette[1], centerX: size.width / 2, top: top + 7 * cellH + 14, less: less, more: more)
    }
}

// MARK: - Sankey

private func bez(_ a: CGFloat, _ b: CGFloat, _ c: CGFloat, _ d: CGFloat, _ t: CGFloat) -> CGFloat {
    let u = 1 - t
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

private func buildSankey(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let vals = firstSeries(data)
    struct Link { let s: Int; let t: Int; let v: Double }
    var names: [String] = []
    func id(_ name: String) -> Int { if let k = names.firstIndex(of: name) { return k }; names.append(name); return names.count - 1 }
    var links: [Link] = []
    for (i, c) in data.categories.enumerated() {
        let p = c.components(separatedBy: " → ")
        if p.count == 2 && vals[i] > 0 { let s = id(p[0]), t = id(p[1]); links.append(Link(s: s, t: t, v: vals[i])) }
    }
    if links.isEmpty { return emptyGeo }
    let count = names.count
    var depth = [Int](repeating: 0, count: count)
    for _ in 0..<count { for l in links where depth[l.t] < depth[l.s] + 1 { depth[l.t] = depth[l.s] + 1 } }
    var outSum = [Double](repeating: 0, count: count), inSum = [Double](repeating: 0, count: count)
    for l in links { outSum[l.s] += l.v; inSum[l.t] += l.v }
    let nodeV = (0..<count).map { max(outSum[$0], inSum[$0]) }
    let cols = (depth.max() ?? 0) + 1
    let left: CGFloat = 4, right = e.w - (e.narrow ? 70 : 100), top: CGFloat = 8, bottom = e.h - 8
    let nodeW: CGFloat = 12, gap: CGFloat = 12
    let k: CGFloat = (0..<cols).map { c -> CGFloat in
        let idx = (0..<count).filter { depth[$0] == c }
        let sum = idx.reduce(0.0) { $0 + nodeV[$1] }
        return sum <= 0 ? .greatestFiniteMagnitude : (bottom - top - gap * CGFloat(idx.count - 1)) / CGFloat(sum)
    }.min() ?? 1
    var nx = [CGFloat](repeating: 0, count: count), ny = nx, nh = nx
    for c in 0..<cols {
        var y = top
        for i in (0..<count).filter({ depth[$0] == c }) {
            nx[i] = cols == 1 ? left : left + CGFloat(c) * (right - left - nodeW) / CGFloat(cols - 1)
            ny[i] = y; nh[i] = max(CGFloat(nodeV[i]) * k, 2); y += nh[i] + gap
        }
    }
    let th = links.map { CGFloat($0.v) * k }
    var sy = [CGFloat](repeating: 0, count: links.count), ey = sy
    for i in 0..<count {
        var o = ny[i]
        for li in links.indices.filter({ links[$0].s == i }).sorted(by: { ny[links[$0].t] < ny[links[$1].t] }) { sy[li] = o; o += th[li] }
        var q = ny[i]
        for li in links.indices.filter({ links[$0].t == i }).sorted(by: { ny[links[$0].s] < ny[links[$1].s] }) { ey[li] = q; q += th[li] }
    }
    func linkContains(_ li: Int, _ p: CGPoint) -> Bool {
        let l = links[li], sx = nx[l.s] + nodeW, ex = nx[l.t]
        if ex <= sx || p.x < sx || p.x > ex { return false }
        var lo: CGFloat = 0, hi: CGFloat = 1
        for _ in 0..<20 { let t = (lo + hi) / 2; if bez(sx, (sx + ex) / 2, (sx + ex) / 2, ex, t) < p.x { lo = t } else { hi = t } }
        let yTop = bez(sy[li], sy[li], ey[li], ey[li], (lo + hi) / 2)
        return p.y >= yTop && p.y <= yTop + th[li]
    }
    let nodeRegions = (0..<count).map { i -> ZCOpsRegion in
        let r = CGRect(x: nx[i] - 4, y: ny[i], width: nodeW + 8, height: nh[i])
        return ZCOpsRegion(anchor: CGPoint(x: nx[i] + nodeW, y: ny[i] + nh[i] / 2), title: names[i], rows: [ZCTipRow(color: e.palette[i % e.palette.count], label: nil, value: e.format(nodeV[i]))]) { r.contains($0) }
    }
    let linkRegions = links.indices.map { li -> ZCOpsRegion in
        let l = links[li], sx = nx[l.s] + nodeW, ex = nx[l.t]
        return ZCOpsRegion(anchor: CGPoint(x: (sx + ex) / 2, y: (sy[li] + ey[li] + th[li]) / 2), title: "\(names[l.s]) → \(names[l.t])", rows: [ZCTipRow(color: nil, label: nil, value: e.format(l.v))]) { linkContains(li, $0) }
    }
    return ZCOpsGeo(regions: nodeRegions + linkRegions) { ctx, _, sel in
        for li in links.indices {
            let l = links[li], sx = nx[l.s] + nodeW, ex = nx[l.t]
            if ex <= sx { continue }
            let mid = (sx + ex) / 2
            var path = Path()
            path.move(to: CGPoint(x: sx, y: sy[li]))
            path.addCurve(to: CGPoint(x: ex, y: ey[li]), control1: CGPoint(x: mid, y: sy[li]), control2: CGPoint(x: mid, y: ey[li]))
            path.addLine(to: CGPoint(x: ex, y: ey[li] + th[li]))
            path.addCurve(to: CGPoint(x: sx, y: sy[li] + th[li]), control1: CGPoint(x: mid, y: ey[li] + th[li]), control2: CGPoint(x: mid, y: sy[li] + th[li]))
            path.closeSubpath()
            let a = sel == count + li ? 0.65 : 0.35
            ctx.fill(path, with: .linearGradient(Gradient(colors: [e.palette[l.s % e.palette.count].opacity(a), e.palette[l.t % e.palette.count].opacity(a)]), startPoint: CGPoint(x: sx, y: 0), endPoint: CGPoint(x: ex, y: 0)))
        }
        for i in 0..<count {
            let r = CGRect(x: nx[i], y: ny[i], width: nodeW, height: nh[i])
            ctx.fill(Path(r), with: .color(e.palette[i % e.palette.count]))
            if sel == i { ctx.stroke(Path(r), with: .color(e.c.text), lineWidth: 2) }
            e.draw(&ctx, names[i], at: CGPoint(x: nx[i] + nodeW + 6, y: ny[i] + nh[i] / 2), anchor: .leading, color: e.c.text, maxWidth: max(1, e.w - (nx[i] + nodeW + 6)))
        }
    }
}

// MARK: - Medidor

private func buildGauge(_ e: ZCOpsEnv, _ data: ZCChartData) -> ZCOpsGeo {
    let vals = data.series.first?.values ?? []
    let done = vals.first ?? 0
    let goal = vals.indices.contains(1) && vals[1] != 0 ? vals[1] : 1
    let pct = Int((done / goal * 100).rounded())
    let r = 0.92 * min(e.w, e.h) / 2
    let cx = e.w / 2, cy = e.h * 0.62
    let sw: CGFloat = 16, mid = r - sw / 2
    let detail = "\(e.format(done)) / \(e.format(goal))"
    let region = ZCOpsRegion(anchor: CGPoint(x: cx, y: cy - r), title: nil, rows: [ZCTipRow(color: e.palette[0], label: nil, value: "\(detail) (\(pct) %)")]) { p in
        let dist = hypot(p.x - cx, p.y - cy)
        var a = atan2(p.y - cy, p.x - cx) * 180 / .pi
        if a < 0 { a += 360 }
        return dist >= r - sw - 6 && dist <= r + 6 && (a >= 160 || a <= 20)
    }
    return ZCOpsGeo(regions: [region]) { ctx, _, _ in
        let center = CGPoint(x: cx, y: cy)
        var back = Path(); back.addArc(center: center, radius: mid, startAngle: .degrees(160), endAngle: .degrees(160 + 220), clockwise: false)
        ctx.stroke(back, with: .color(e.c.surface3), style: StrokeStyle(lineWidth: sw, lineCap: .round))
        let prog = 220.0 * Double(min(max(pct, 0), 100)) / 100
        if prog > 0 {
            var fg = Path(); fg.addArc(center: center, radius: mid, startAngle: .degrees(160), endAngle: .degrees(160 + prog), clockwise: false)
            ctx.stroke(fg, with: .color(e.palette[0]), style: StrokeStyle(lineWidth: sw, lineCap: .round))
        }
        e.draw(&ctx, "\(pct) %", at: CGPoint(x: cx, y: cy - 0.05 * r), anchor: .center, color: e.c.text, pt: 28, weight: ZCWeight.semibold)
        e.draw(&ctx, detail, at: CGPoint(x: cx, y: cy + 0.30 * r), anchor: .center, color: e.c.textMuted, pt: 13)
    }
}

private func buildOps(_ kind: ZCChartKind, _ data: ZCChartData, _ e: ZCOpsEnv) -> ZCOpsGeo {
    switch kind {
    case .funnel: return buildFunnel(e, data)
    case .waterfall: return buildWaterfall(e, data)
    case .heatmap: return buildHeatmap(e, data)
    case .treemap: return buildTreemap(e, data)
    case .calendar: return buildCalendar(e, data)
    case .sankey: return buildSankey(e, data)
    case .gauge: return buildGauge(e, data)
    default: return emptyGeo
    }
}

func zcOpsHeight(_ kind: ZCChartKind, _ data: ZCChartData, narrow: Bool) -> CGFloat {
    switch kind {
    case .funnel: return CGFloat(data.categories.count * 52 + 16)
    case .waterfall: return 240
    case .heatmap: return CGFloat(data.series.count * 30 + 96)
    case .calendar: return CGFloat(24 + 7 * (narrow ? 9 : 13) + 48)
    case .sankey: return 260
    case .gauge: return 200
    default: return 220
    }
}

struct ZCOpsBody: View {
    @Environment(\.zcTheme) private var theme
    @State private var sel: Int?
    let data: ZCChartData
    let kind: ZCChartKind
    let narrow: Bool
    let format: (Double) -> String
    let description: String?
    let height: CGFloat?
    let palette: [Color]

    init(data: ZCChartData, kind: ZCChartKind, narrow: Bool, format: @escaping (Double) -> String, description: String?, height: CGFloat?, palette: [Color], initialSelection: Int?) {
        self.data = data; self.kind = kind; self.narrow = narrow; self.format = format; self.description = description; self.height = height; self.palette = palette
        _sel = State(initialValue: initialSelection)
    }

    var body: some View {
        let summary = zcChartSummary(title: description, data: data, kind: kind, format: format)
        let en = Locale.current.language.languageCode?.identifier == "en"
        GeometryReader { geo in
            let env = ZCOpsEnv(c: theme.colors, palette: palette, format: format, narrow: narrow, size: geo.size, en: en, family: theme.fontFamily, theme: theme)
            let ops = geo.size.width > 0 && geo.size.height > 0 ? buildOps(kind, data, env) : emptyGeo
            ZStack(alignment: .topLeading) {
                Canvas { ctx, size in ops.draw(&ctx, size, sel.flatMap { $0 < ops.regions.count ? $0 : nil }) }
                    .contentShape(Rectangle())
                    .gesture(DragGesture(minimumDistance: 0).onEnded { v in
                        let i = ops.regions.firstIndex { $0.contains(v.location) }
                        sel = i == sel ? nil : i
                    })
                if let i = sel, ops.regions.indices.contains(i) {
                    let region = ops.regions[i]
                    ZCChartTooltip(anchor: region.anchor, bounds: geo.size, title: region.title, rows: region.rows)
                }
            }
        }
        .frame(height: height ?? zcOpsHeight(kind, data, narrow: narrow))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(summary)
        .accessibilityAddTraits(.isImage)
    }
}
