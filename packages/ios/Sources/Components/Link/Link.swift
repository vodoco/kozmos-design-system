import SwiftUI

public struct KozmosLink: View {
    let label: String
    let destination: URL
    
    public init(_ label: String, destination: URL) {
        self.label = label
        self.destination = destination
    }
    
    public var body: some View {
        // Decision 59: theme-coloured text on a surface is theme 600, as
        // React's; 500 read 3.13:1 on a dark sheet.
        Link(label, destination: destination)
            .foregroundColor(KozmosColors.primitivesColorsTheme600)
    }
}
