import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Secciones del catálogo. Mismos niveles que el catálogo de Android: se suman a medida que se escriben las olas.
enum CatalogSection: String, CaseIterable, Identifiable {
    case fundamentos, atomos, formularios, estructura, dominio, compra, cuenta, acceso, graficos, adaptable
    var id: String { rawValue }
    var title: String {
        switch self {
        case .fundamentos: return "Fundamentos"
        case .atomos: return "Átomos"
        case .formularios: return "Formularios"
        case .estructura: return "Estructura"
        case .dominio: return "Dominio"
        case .compra: return "Compra y cuenta"
        case .cuenta: return "Cuenta y wallet"
        case .acceso: return "Acceso y cámara"
        case .graficos: return "Gráficos y mapa"
        case .adaptable: return "Adaptable (iPhone y iPad)"
        }
    }

    @ViewBuilder var content: some View {
        switch self {
        case .fundamentos: FoundationsSection()
        case .atomos: AtomsSection()
        case .formularios: FormsSection()
        case .estructura: StructureSection()
        case .dominio: DomainSection()
        case .compra: CommerceSection()
        case .cuenta: AccountSection()
        case .acceso: AuthSection()
        case .graficos: ChartsSection()
        case .adaptable: AdaptiveSection()
        }
    }
}

@main
struct CatalogApp: App {
    // La marca y el modo viven en un ZCBrandStore: cambian en vivo y se recuerdan entre sesiones.
    @State private var store = ZCBrandStore()

    var body: some Scene {
        WindowGroup {
            ZCLiveThemeProvider(store: store) {
                if CommandLine.arguments.contains("-dtlab") {
                    DynamicTypeLab()   // banco de pruebas de Dynamic Type, solo para la auditoría
                } else {
                    NavigationStack {
                        CatalogHome(brand: store.brandBinding, dark: store.darkBinding)
                    }
                }
            }
        }
    }
}

struct CatalogHome: View {
    @Environment(\.zcTheme) private var theme
    var brand: Binding<ZCBrand>
    var dark: Binding<Bool?>

    var body: some View {
        List(CatalogSection.allCases) { section in
            NavigationLink(value: section) {
                ZCText(section.title, style: ZCType.body)
                    .frame(minHeight: ZCSize.targetSm, alignment: .leading)
            }
            .accessibilityIdentifier("section-\(section.rawValue)")
            .listRowBackground(theme.colors.surface)
        }
        .scrollContentBackground(.hidden)
        .navigationTitle("Zonacards")
        .navigationDestination(for: CatalogSection.self) { section in
            ScrollView { section.content.padding(ZCSpace.v4) }
                .navigationTitle(section.title)
        }
        .toolbar {
            Menu {
                Picker("Marca", selection: brand) {
                    ForEach(ZCBrand.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) }
                }
                Picker("Modo", selection: dark) {
                    Text("Sistema").tag(Bool?.none)
                    Text("Claro").tag(Bool?.some(false))
                    Text("Oscuro").tag(Bool?.some(true))
                }
            } label: {
                Image(systemName: "ellipsis.circle").frame(minWidth: ZCSize.targetSm, minHeight: ZCSize.targetSm)
            }
            .accessibilityLabel("Marca y modo")
        }
    }
}
