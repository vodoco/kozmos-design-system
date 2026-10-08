import SwiftUI
import UniformTypeIdentifiers

public struct KozmosFileUpload: View {
    @State private var isImporting = false
    @State private var fileName: String?
    let allowedContentTypes: [UTType]
    var onFileSelected: ((URL) -> Void)?
    
    public init(allowedContentTypes: [UTType] = [.content], onFileSelected: ((URL) -> Void)? = nil) {
        self.allowedContentTypes = allowedContentTypes
        self.onFileSelected = onFileSelected
    }
    
    public var body: some View {
        VStack {
            if let fileName = fileName {
                HStack {
                    // A theme-coloured icon: theme 600 (decision 59).
                    Image(systemName: "doc.fill")
                        .foregroundColor(KozmosColors.primitivesColorsTheme600)
                    Text(fileName)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    Spacer()
                    Button(action: {
                        self.fileName = nil
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(KozmosColors.primitivesColorsForeground500)
                    }
                }
                .padding()
                .background(KozmosColors.primitivesColorsBackground100)
                .cornerRadius(KozmosDimensions.semanticsRadiusControl)
            } else {
                Button(action: { isImporting = true }) {
                    VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        Image(systemName: "arrow.up.doc")
                            .font(KozmosTypography.title2)
                        Text("Tap to upload file")
                            .font(KozmosTypography.body)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 120)
                    .background(
                        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                            .stroke(style: StrokeStyle(lineWidth: 2, dash: [5]))
                            .foregroundColor(KozmosColors.primitivesColorsForeground400.opacity(0.5))
                    )
                }
            }
        }
        .fileImporter(
            isPresented: $isImporting,
            allowedContentTypes: allowedContentTypes,
            allowsMultipleSelection: false
        ) { result in
            do {
                let selectedFile: URL = try result.get().first!
                self.fileName = selectedFile.lastPathComponent
                onFileSelected?(selectedFile)
            } catch {
                print("Error selecting file: \(error.localizedDescription)")
            }
        }
    }
}
