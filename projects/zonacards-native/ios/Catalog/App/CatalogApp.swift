import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Secciones del catálogo. Mismos niveles que el catálogo de Android: se suman a medida que se escriben las olas.
enum CatalogSection: String, CaseIterable, Identifiable {
    case fundamentos, atomos, formularios, estructura
    var id: String { rawValue }
    var title: String {
        switch self {
        case .fundamentos: return "Fundamentos"
        case .atomos: return "Átomos"
        case .formularios: return "Formularios"
        case .estructura: return "Estructura"
        }
    }

    @ViewBuilder var content: some View {
        switch self {
        case .fundamentos: FoundationsSection()
        case .atomos: AtomsSection()
        case .formularios: FormsSection()
        case .estructura: StructureSection()
        }
    }
}

@main
struct CatalogApp: App {
    @State private var brand: ZCBrand = .zonacards
    @State private var dark: Bool? = nil

    var body: some Scene {
        WindowGroup {
            ZCThemeProvider(brand: brand, dark: dark) {
                NavigationStack {
                    CatalogHome(brand: $brand, dark: $dark)
                }
            }
        }
    }
}

struct CatalogHome: View {
    @Environment(\.zcTheme) private var theme
    @Binding var brand: ZCBrand
    @Binding var dark: Bool?

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
                Picker("Marca", selection: $brand) {
                    ForEach(ZCBrand.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) }
                }
                Picker("Modo", selection: $dark) {
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
