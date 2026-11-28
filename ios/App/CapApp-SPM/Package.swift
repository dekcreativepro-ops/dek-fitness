// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.6.3"),
        .package(name: "CapacitorBrowser", path: "../../../../Users/DEK Creative Pro/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/a08a0ec6-e564-421a-9509-eb821457c37f/2bff783f-d0d7-4bf6-8d65-1ed161db36cb/scratch-2026-11-26-6cf466/dek-fitness/node_modules/@capacitor/browser")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorBrowser", package: "CapacitorBrowser")
            ]
        )
    ]
)
