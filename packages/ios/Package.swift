// swift-tools-version: 5.8
import PackageDescription

let package = Package(
    name: "Kozmos",
    platforms: [.iOS(.v16), .macOS(.v13), .macCatalyst(.v16)],
    products: [
        .library(
            name: "Kozmos",
            targets: ["Kozmos"]),
    ],
    dependencies: [
        .package(url: "https://github.com/figma/code-connect", from: "1.0.0"),
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing.git", from: "1.15.0")
    ],
    targets: [
        .target(
            name: "Kozmos",
            dependencies: [
                .product(name: "Figma", package: "code-connect")
            ],
            path: "Sources",
            resources: [.process("Resources")]
        ),
        .testTarget(
            name: "KozmosTests",
            dependencies: [
                "Kozmos",
                .product(name: "SnapshotTesting", package: "swift-snapshot-testing")
            ],
            path: "Tests"
        ),
    ]
)
