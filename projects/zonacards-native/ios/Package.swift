// swift-tools-version:5.9
import PackageDescription

// Zonacards para SwiftUI.
//  - ZonacardsTokens: tokens, íconos, textos, datos y dominio. Generado con `npm run native` desde @zonacards/tokens y @zonacards/ui.
//  - ZonacardsUI: componentes SwiftUI escritos a mano sobre los tokens (mismos nombres que Android, con prefijo ZC).
// Sin dependencias externas: las capturas (swift-snapshot-testing) viven en Catalog/, no aquí.
let package = Package(
    name: "ZonacardsUI",
    defaultLocalization: "es",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "ZonacardsTokens", targets: ["ZonacardsTokens"]),
        .library(name: "ZonacardsUI", targets: ["ZonacardsUI"])
    ],
    targets: [
        .target(name: "ZonacardsTokens", resources: [.process("Resources")]),
        .target(name: "ZonacardsUI", dependencies: ["ZonacardsTokens"]),
        .testTarget(name: "ZonacardsTokensTests", dependencies: ["ZonacardsTokens"], resources: [.process("Resources")]),
        .testTarget(name: "ZonacardsUITests", dependencies: ["ZonacardsUI"])
    ]
)
