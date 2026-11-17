// swift-tools-version:5.9
import PackageDescription

// Tokens, íconos y textos de Zonacards para SwiftUI. Generado con `npm run native` desde @zonacards/ui.
let package = Package(
    name: "ZonacardsUI",
    defaultLocalization: "es",
    platforms: [.iOS(.v16)],
    products: [.library(name: "ZonacardsTokens", targets: ["ZonacardsTokens"])],
    targets: [
        .target(name: "ZonacardsTokens", resources: [.process("Resources")])
    ]
)
