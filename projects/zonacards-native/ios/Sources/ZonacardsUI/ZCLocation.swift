import MapKit
import SwiftUI
import ZonacardsTokens

/// Punto del mapa en grados decimales (WGS 84).
public struct ZCLatLng: Equatable, Sendable {
    public let lat: Double
    public let lng: Double

    public init(lat: Double, lng: Double) {
        self.lat = lat
        self.lng = lng
    }

    public var isValid: Bool { lat.isFinite && lng.isFinite && abs(lat) <= 90 && abs(lng) <= 180 }

    /// "-12.04640, -77.04280" (5 decimales, punto decimal siempre).
    public func format() -> String { String(format: "%.5f, %.5f", locale: Locale(identifier: "en_US_POSIX"), lat, lng) }

    /// Redondeado a 6 decimales (≈ 10 cm).
    public func rounded() -> ZCLatLng { ZCLatLng(lat: (lat * 1e6).rounded() / 1e6, lng: (lng * 1e6).rounded() / 1e6) }

    var coordinate: CLLocationCoordinate2D { CLLocationCoordinate2D(latitude: lat, longitude: lng) }
}

/// Punto exacto en el mapa (dirección de entrega, local): mapa de MapKit con pin que se coloca con un toque, botones para moverlo (norte, sur, este y oeste: la
/// alternativa para VoiceOver y para ajustes finos), coordenadas escritas como alternativa (latitud y longitud validadas) y, si la app lo pide, "Usar mi ubicación"
/// (el permiso `NSLocationWhenInUseUsageDescription` y la lectura los hace la app). `center` centra el mapa mientras no hay punto (por ejemplo, el distrito elegido
/// en `ZCUbigeoSelect`).
public struct ZCLocationPicker: View {
    @Environment(\.zcTheme) private var theme
    @State private var camera: MapCameraPosition
    @State private var latText: String
    @State private var lngText: String
    @State private var latError: String?
    @State private var lngError: String?
    private let value: Binding<ZCLatLng?>
    private let label: String
    private let center: ZCLatLng
    private let onUseMyLocation: (() -> Void)?
    private let locating: Bool
    private let locationError: String?

    public init(_ label: String, value: Binding<ZCLatLng?>, center: ZCLatLng = ZCLatLng(lat: -12.0464, lng: -77.0428), onUseMyLocation: (() -> Void)? = nil, locating: Bool = false, locationError: String? = nil) {
        self.label = label
        self.value = value
        self.center = center
        self.onUseMyLocation = onUseMyLocation
        self.locating = locating
        self.locationError = locationError
        let start = value.wrappedValue ?? center
        _camera = State(initialValue: .region(MKCoordinateRegion(center: start.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))))
        _latText = State(initialValue: value.wrappedValue.map { String($0.lat) } ?? "")
        _lngText = State(initialValue: value.wrappedValue.map { String($0.lng) } ?? "")
    }

    private func parse(_ t: String) -> Double? {
        let s = t.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: ",", with: ".")
        return s.range(of: #"^[-+]?\d+(\.\d+)?$"#, options: .regularExpression) != nil ? Double(s) : nil
    }

    private func typed(_ lat: String, _ lng: String) {
        latText = lat; lngText = lng
        let la = parse(lat), ln = parse(lng)
        latError = (!lat.trimmingCharacters(in: .whitespaces).isEmpty && (la == nil || abs(la!) > 90)) ? ZCString.text("mol.ubicacion.latRango") : nil
        lngError = (!lng.trimmingCharacters(in: .whitespaces).isEmpty && (ln == nil || abs(ln!) > 180)) ? ZCString.text("mol.ubicacion.lngRango") : nil
        if let la, let ln, abs(la) <= 90, abs(ln) <= 180 {
            let p = ZCLatLng(lat: la, lng: ln).rounded()
            if value.wrappedValue != p { value.wrappedValue = p }
        }
    }

    private func place(_ p: ZCLatLng) {
        value.wrappedValue = p.rounded()
    }

    private func nudge(dLat: Double, dLng: Double) {
        guard let v = value.wrappedValue else { return }
        let p = ZCLatLng(lat: min(max(v.lat + dLat, -90), 90), lng: min(max(v.lng + dLng, -180), 180))
        place(p)
        camera = .region(MKCoordinateRegion(center: p.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)))
    }

    /// Botón de flecha para mover el pin (el set de íconos no trae las cuatro direcciones: la de arriba es la de abajo girada).
    private func nudgeButton(_ icon: ZCIconName, turn: Double, label: String, action: @escaping () -> Void) -> some View {
        let c = theme.colors
        return Button(action: action) {
            ZCIcon(icon, size: ZCSize.iconMd).rotationEffect(.degrees(turn)).foregroundStyle(c.text)
                .frame(width: ZCSize.targetSm, height: ZCSize.targetSm)
                .background(c.surface, in: RoundedRectangle(cornerRadius: theme.shape.control, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: theme.shape.control, style: .continuous).stroke(c.borderStrong))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    private var map: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        return MapReader { proxy in
            Map(position: $camera) {
                if let v = value.wrappedValue {
                    Annotation("", coordinate: v.coordinate, anchor: .bottom) {
                        ZCIcon(.sMapPoint, size: ZCSize.iconXl).foregroundStyle(c.dangerFg).shadow(color: .black.opacity(0.3), radius: 2, y: 1).accessibilityHidden(true)
                    }
                }
            }
            .onTapGesture { screen in
                if let coord = proxy.convert(screen, from: .local) { place(ZCLatLng(lat: coord.latitude, lng: coord.longitude)) }
            }
        }
        .frame(height: 260)
        .clipShape(shape)
        .overlay(shape.stroke(c.border))
        .accessibilityLabel(label)
        .accessibilityHint(ZCString.text("mol.geoMapa.ayudaEditable"))
    }

    public var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: ZCSpace.v3) {
            HStack(spacing: ZCSpace.v2) {
                ZCIcon(.sMapPoint, size: ZCSize.iconMd).foregroundStyle(c.text)
                Text(label).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text).accessibilityAddTraits(.isHeader)
            }
            map
            if value.wrappedValue != nil {
                HStack(spacing: ZCSpace.v2) {
                    nudgeButton(.sAltArrowDown, turn: 180, label: ZCString.text("mol.ubicacion.mover.norte")) { nudge(dLat: 0.0005, dLng: 0) }
                    nudgeButton(.sAltArrowDown, turn: 0, label: ZCString.text("mol.ubicacion.mover.sur")) { nudge(dLat: -0.0005, dLng: 0) }
                    nudgeButton(.sAltArrowLeft, turn: 0, label: ZCString.text("mol.ubicacion.mover.oeste")) { nudge(dLat: 0, dLng: -0.0005) }
                    nudgeButton(.sAltArrowRight, turn: 0, label: ZCString.text("mol.ubicacion.mover.este")) { nudge(dLat: 0, dLng: 0.0005) }
                }
            }
            Text(value.wrappedValue.map { ZCString.text("mol.ubicacion.coordenadas", $0.format()) } ?? ZCString.text("mol.ubicacion.sinPunto"))
                .font(.zc(ZCType.bodySm, theme: theme).zcTabular()).foregroundStyle(c.textMuted)
                .accessibilityAddTraits(.updatesFrequently)
            HStack(alignment: .top, spacing: ZCSpace.v3) {
                ZCTextField(ZCString.text("mol.ubicacion.latitud"), text: Binding(get: { latText }, set: { typed($0, lngText) }), error: latError, keyboard: .numbersAndPunctuation)
                ZCTextField(ZCString.text("mol.ubicacion.longitud"), text: Binding(get: { lngText }, set: { typed(latText, $0) }), error: lngError, keyboard: .numbersAndPunctuation)
            }
            if let onUseMyLocation {
                ZCButton(ZCString.text("mol.ubicacion.usarMia"), variant: .outline, size: .sm, leadingIcon: .sMapPoint, loading: locating, action: onUseMyLocation)
            }
            if let locationError { ZCAlert(ZCString.text("mol.ubicacion.errorTitulo"), tone: .warning, text: locationError) }
        }
        .onChange(of: value.wrappedValue) { _, v in
            // Las cajas siguen al punto que llega de afuera (mapa o botón) sin pisar lo que se está escribiendo.
            guard let v else { return }
            if parse(latText) != v.lat { latText = String(v.lat) }
            if parse(lngText) != v.lng { lngText = String(v.lng) }
            latError = nil; lngError = nil
        }
        .onChange(of: center) { _, c in
            if value.wrappedValue == nil { camera = .region(MKCoordinateRegion(center: c.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.04, longitudeDelta: 0.04))) }
        }
    }
}
