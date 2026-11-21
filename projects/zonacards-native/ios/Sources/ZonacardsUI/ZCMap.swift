import SwiftUI
import ZonacardsTokens

/// Punto del mapa (ciudad): `value` es la cantidad y fija el tamaño.
public struct ZCMapPoint: Sendable {
    public let name: String
    public let lat: Double
    public let lng: Double
    public let value: Double

    public init(name: String, lat: Double, lng: Double, value: Double) {
        self.name = name
        self.lat = lat
        self.lng = lng
        self.value = value
    }
}

struct ZCGeoCountry {
    let name: String
    let cc: String
    let rings: [[(lng: Double, lat: Double)]]
}

/// Lee `latam.json` (el mismo de la web: `properties.n` = nombre, `properties.cc` = código del alcance).
func zcParseGeo(_ data: Data) -> [ZCGeoCountry] {
    guard let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any], let feats = root["features"] as? [[String: Any]] else { return [] }
    func ring(_ a: [[Double]]) -> [(lng: Double, lat: Double)] { a.compactMap { $0.count >= 2 ? (lng: $0[0], lat: $0[1]) : nil } }
    return feats.compactMap { f in
        guard let props = f["properties"] as? [String: Any], let g = f["geometry"] as? [String: Any], let type = g["type"] as? String else { return nil }
        var rings: [[(lng: Double, lat: Double)]] = []
        if type == "Polygon", let coords = g["coordinates"] as? [[[Double]]] { rings = coords.map(ring) }
        else if let polys = g["coordinates"] as? [[[[Double]]]] { rings = polys.flatMap { $0.map(ring) } }
        return ZCGeoCountry(name: props["n"] as? String ?? "", cc: props["cc"] as? String ?? "", rings: rings)
    }
}

/// Los países de la web, leídos una sola vez (205 KB, unos 13 mil puntos). Nulo si el recurso no se pudo leer.
let zcLatamGeo: [ZCGeoCountry]? = ZCData.json("latam").map(zcParseGeo).flatMap { $0.isEmpty ? nil : $0 }

/// Mapa del cuadro: la web lo dibuja con `aspectScale` 0,75 (el eje x se comprime) y el encuadre sale de los puntos ± 4°.
private struct ZCMapLayout {
    let land: [(country: ZCGeoCountry, path: Path)]
    let base: [CGPoint]

    init(geo: [ZCGeoCountry], points: [ZCMapPoint], size: CGSize) {
        let pad = 4.0
        let minLng: Double, maxLng: Double, minLat: Double, maxLat: Double
        if points.isEmpty { minLng = -120; maxLng = -30; minLat = -56; maxLat = 33 }
        else { minLng = points.map(\.lng).min()! - pad; maxLng = points.map(\.lng).max()! + pad; minLat = points.map(\.lat).min()! - pad; maxLat = points.map(\.lat).max()! + pad }
        let kx = 0.75
        let s = min(Double(size.width) / ((maxLng - minLng) * kx), Double(size.height) / (maxLat - minLat))
        let cLng = (minLng + maxLng) / 2, cLat = (minLat + maxLat) / 2
        func px(_ lng: Double) -> CGFloat { size.width / 2 + CGFloat((lng - cLng) * kx * s) }
        func py(_ lat: Double) -> CGFloat { size.height / 2 - CGFloat((lat - cLat) * s) }
        land = geo.map { c in
            var path = Path()
            for r in c.rings where !r.isEmpty {
                path.move(to: CGPoint(x: px(r[0].lng), y: py(r[0].lat)))
                for k in 1..<r.count { path.addLine(to: CGPoint(x: px(r[k].lng), y: py(r[k].lat))) }
                path.closeSubpath()
            }
            return (c, path)
        }
        base = points.map { CGPoint(x: px($0.lng), y: py($0.lat)) }
    }
}

/// Guarda el encuadre calculado: armar los trazados (unos 13 mil puntos) en cada movimiento del dedo sería lento.
private final class ZCMapLayoutCache {
    var key = ""
    var layout: ZCMapLayout?
}

private func plainNumber(_ v: Double) -> String { v.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(v)) : String(v) }

/// Mapa de puntos: los límites de países de la web (sin teselas externas), los países del `scope` en `mapScope` y un punto por ciudad con tamaño según la
/// cantidad. Pellizco para acercar y un dedo para mover (con zoom; sin zoom el dedo sigue desplazando la página); los botones + y − hacen lo mismo con un solo
/// toque. Tocar un punto abre el globo con su cantidad. Para VoiceOver, el resumen lista cada ciudad con su cantidad.
public struct ZCMap: View {
    @Environment(\.zcTheme) private var theme
    @State private var zoom: CGFloat
    @State private var pan: CGSize = .zero
    @State private var panStart: CGSize = .zero
    @State private var zoomStart: CGFloat = 1
    @State private var sel: Int?
    @State private var cache = ZCMapLayoutCache()
    private let label: String
    private let points: [ZCMapPoint]
    private let scope: [String]
    private let unit: String
    private let format: (Double) -> String

    public init(label: String, points: [ZCMapPoint], scope: [String] = [], unit: String = "", format: ((Double) -> String)? = nil, initialZoom: CGFloat = 1, initialSelection: Int? = nil) {
        self.label = label
        self.points = points
        self.scope = scope
        self.unit = unit
        self.format = format ?? { plainNumber($0) }
        _zoom = State(initialValue: min(max(initialZoom, 1), 8))
        _sel = State(initialValue: initialSelection)
    }

    private var mapHeight: CGFloat {
        let w = UIScreen.main.bounds.width
        return w >= 1280 ? 440 : (w >= 768 ? 380 : 280)
    }

    private func clampPan(_ p: CGSize, zoom z: CGFloat, size s: CGSize) -> CGSize {
        let mx = (z - 1) * s.width / 2 + s.width * 0.25, my = (z - 1) * s.height / 2 + s.height * 0.25
        return CGSize(width: min(max(p.width, -mx), mx), height: min(max(p.height, -my), my))
    }

    /// Acerca o aleja alrededor del punto `q` (el punto del mapa bajo `q` se queda donde está).
    private func zoomBy(_ factor: CGFloat, at q: CGPoint, size s: CGSize) {
        let z2 = min(max(zoom * factor, 1), 8)
        let center = CGPoint(x: s.width / 2, y: s.height / 2)
        let nx = (q.x - center.x) - ((q.x - pan.width - center.x) * (z2 / zoom))
        let ny = (q.y - center.y) - ((q.y - pan.height - center.y) * (z2 / zoom))
        pan = clampPan(CGSize(width: nx, height: ny), zoom: z2, size: s)
        zoom = z2
    }

    private func screenOf(_ base: CGPoint, size s: CGSize) -> CGPoint {
        let c = CGPoint(x: s.width / 2, y: s.height / 2)
        return CGPoint(x: c.x + (base.x - c.x) * zoom + pan.width, y: c.y + (base.y - c.y) * zoom + pan.height)
    }

    private func radius(_ p: ZCMapPoint) -> CGFloat { (10 + CGFloat(max(p.value, 0)).squareRoot() * 1.8) / 2 }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        let summary = label + ". " + points.map { "\($0.name): \(format($0.value)) \(unit)".trimmingCharacters(in: .whitespaces) }.joined(separator: "; ")
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            GeometryReader { geo in
                let size = geo.size
                let key = "\(Int(size.width))x\(Int(size.height))|" + points.map { "\($0.lat),\($0.lng)" }.joined(separator: ";")
                let layout: ZCMapLayout? = {
                    if cache.key != key { cache.layout = zcLatamGeo.map { ZCMapLayout(geo: $0, points: points, size: size) }; cache.key = key }
                    return cache.layout
                }()
                ZStack(alignment: .topLeading) {
                    c.mapWater
                    if layout == nil {
                        Text(ZCString.text("mol.mapa.error")).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).padding(ZCSpace.v4)
                    }
                    Canvas { ctx, sz in
                        guard let l = layout else { return }
                        let ctr = CGPoint(x: sz.width / 2, y: sz.height / 2)
                        var t = CGAffineTransform(translationX: ctr.x * (1 - zoom) + pan.width, y: ctr.y * (1 - zoom) + pan.height)
                        t = t.scaledBy(x: zoom, y: zoom)
                        for (country, path) in l.land {
                            let moved = path.applying(t)
                            ctx.fill(moved, with: .color(scope.contains(country.cc) ? c.mapScope : c.mapLand), style: FillStyle(eoFill: true))
                            ctx.stroke(moved, with: .color(c.mapLine), lineWidth: 1)
                        }
                        for (i, p) in points.enumerated() {
                            let at = screenOf(l.base[i], size: sz), r = radius(p)
                            ctx.fill(Path(ellipseIn: CGRect(x: at.x - r, y: at.y - r, width: r * 2, height: r * 2)), with: .color(c.brandAccent.opacity(0.9)))
                            ctx.stroke(Path(ellipseIn: CGRect(x: at.x - r + 1, y: at.y - r + 1, width: r * 2 - 2, height: r * 2 - 2)), with: .color(c.chart1), lineWidth: 2)
                            if sel == i { ctx.stroke(Path(ellipseIn: CGRect(x: at.x - r - 3, y: at.y - r - 3, width: r * 2 + 6, height: r * 2 + 6)), with: .color(c.text), lineWidth: 2) }
                        }
                    }
                    .contentShape(Rectangle())
                    .gesture(SpatialTapGesture().onEnded { tap in
                        guard let l = layout else { return }
                        var best: Int?, bestD = CGFloat.greatestFiniteMagnitude
                        for (i, p) in points.enumerated() {
                            let at = screenOf(l.base[i], size: size)
                            let d = hypot(at.x - tap.location.x, at.y - tap.location.y)
                            if d <= max(radius(p), 22) && d < bestD { best = i; bestD = d }
                        }
                        sel = best == sel ? nil : best
                    })
                    .simultaneousGesture(
                        DragGesture(minimumDistance: 6)
                            .onChanged { v in if zoom > 1.001 { pan = clampPan(CGSize(width: panStart.width + v.translation.width, height: panStart.height + v.translation.height), zoom: zoom, size: size) } }
                            .onEnded { _ in panStart = pan }
                    )
                    .simultaneousGesture(
                        MagnifyGesture()
                            .onChanged { v in
                                if zoomStart == 1 && zoom != 1 { zoomStart = zoom }
                                let target = min(max(zoomStart * v.magnification, 1), 8)
                                zoomBy(target / zoom, at: v.startLocation, size: size)
                            }
                            .onEnded { _ in zoomStart = 1; panStart = pan }
                    )
                    if let l = layout, let i = sel, points.indices.contains(i) {
                        ZCChartTooltip(anchor: screenOf(l.base[i], size: size), bounds: size, title: points[i].name, rows: [ZCTipRow(color: nil, label: nil, value: "\(format(points[i].value)) \(unit)".trimmingCharacters(in: .whitespaces))])
                    }
                    VStack(spacing: ZCSpace.v2) {
                        ZCIconButton(.lPlus, label: ZCString.text("mol.mapa.acercar"), variant: .outline, small: true) { zoomBy(1.6, at: CGPoint(x: size.width / 2, y: size.height / 2), size: size); panStart = pan }
                            .disabled(zoom >= 8)
                        ZCIconButton(.lMinus, label: ZCString.text("mol.mapa.alejar"), variant: .outline, small: true) { zoomBy(1 / 1.6, at: CGPoint(x: size.width / 2, y: size.height / 2), size: size); panStart = pan }
                            .disabled(zoom <= 1.001)
                    }
                    .padding(ZCSpace.v2)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                }
                .clipped()
            }
            .frame(height: mapHeight)
            .background(c.mapWater, in: shape)
            .clipShape(shape)
            .overlay(shape.stroke(c.border))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(summary)
            .accessibilityAddTraits(.isImage)
            ZCFlowLayout(spacing: ZCSpace.v4, lineSpacing: ZCSpace.v1) {
                HStack(spacing: 6) {
                    Circle().fill(c.brandAccent).overlay(Circle().stroke(c.chart1, lineWidth: 2)).frame(width: 12, height: 12)
                    Text(ZCString.text("mol.mapa.puntos", unit)).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted)
                }
                HStack(spacing: 6) {
                    Circle().fill(c.mapScope).frame(width: 12, height: 12)
                    Text(ZCString.text("mol.mapa.alcance")).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted)
                }
            }
            .accessibilityHidden(true)
        }
    }
}
