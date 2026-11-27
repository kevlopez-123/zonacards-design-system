import SwiftUI
import ZonacardsTokens

/// Carrusel (`zc-carousel`): desliza con el dedo y encaja en cada diapositiva; botones Anterior y Siguiente y puntos (cada uno con área de toque de
/// 44 pt). Se ve una diapositiva y un poco de la siguiente en iPhone, y dos en iPad (ancho regular); sin avance automático. Cada diapositiva se
/// anuncia como "N de M: nombre". `content` dibuja cada elemento; el carrusel le pone el marco de tarjeta.
public struct ZCCarousel<Item, Content: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var current: Int? = 0
    private let label: String
    private let items: [Item]
    private let itemLabel: (Item) -> String
    private let content: (Item, Int) -> Content

    public init(_ label: String, items: [Item], itemLabel: @escaping (Item) -> String = { "\($0)" }, @ViewBuilder content: @escaping (Item, Int) -> Content) {
        self.label = label
        self.items = items
        self.itemLabel = itemLabel
        self.content = content
    }

    private func go(_ i: Int) {
        withAnimation(.easeOut(duration: 0.25)) { current = min(max(i, 0), items.count - 1) }
    }

    public var body: some View {
        if items.isEmpty {
            EmptyView()
        } else {
            let c = theme.colors
            let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
            let index = current ?? 0
            VStack(spacing: 12) {
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 12) {
                        ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                            content(item, i)
                                .frame(maxWidth: .infinity)
                                .background(c.surface, in: shape)
                                .clipShape(shape)
                                .overlay(shape.stroke(c.border))
                                .containerRelativeFrame(.horizontal) { length, _ in sizeClass == .regular ? (length - 12) / 2 : length * 0.85 }
                                .accessibilityElement(children: .contain)
                                .accessibilityLabel("\(i + 1) \(ZCString.text("mol.carrusel.de")) \(items.count): \(itemLabel(item))")
                                .id(i)
                        }
                    }
                    .scrollTargetLayout()
                }
                .scrollTargetBehavior(.viewAligned)
                .scrollPosition(id: $current)
                HStack(spacing: 8) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(0..<items.count, id: \.self) { i in
                                Button { go(i) } label: {
                                    Capsule().fill(i == index ? c.text : c.borderStrong).frame(width: i == index ? 24 : 10, height: 10)
                                        .frame(width: 44, height: 44)
                                        .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel(ZCString.text("mol.carrusel.ir", i + 1))
                            }
                        }
                    }
                    ZCIconButton(.sAltArrowLeft, label: ZCString.text("mol.carrusel.anterior"), variant: .outline) { go(index - 1) }
                        .disabled(index <= 0)
                    ZCIconButton(.sAltArrowRight, label: ZCString.text("mol.carrusel.siguiente"), variant: .outline) { go(index + 1) }
                        .disabled(index >= items.count - 1)
                }
            }
            .frame(maxWidth: .infinity)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
        }
    }
}
