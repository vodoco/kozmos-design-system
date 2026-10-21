import SwiftUI
import UniformTypeIdentifiers

public struct KozmosFileUpload: View {
    @State private var isImporting = false
    @State private var file: URL?
    let allowedContentTypes: [UTType]
    let browseLabel: String
    let removeLabel: String
    var onFileSelected: ((URL) -> Void)?
    var onFileRemoved: ((URL) -> Void)?
    
    /// `onFileRemoved` is told the file the visitor removed, as React's
    /// `onFilesChange` is told the files left. `browseLabel` is the drop
    /// area's words, "Tap to upload file" by default, as React's
    /// `browseLabel`, and `removeLabel` the remove button's spoken name,
    /// "Remove" by default, as Compose's; a product that translates passes
    /// its own.
    ///
    /// The labels are last so that a lone trailing closure is still
    /// `onFileSelected` in every language mode: with the two callbacks last,
    /// Swift 5's backward matching gave it to `onFileRemoved`.
    public init(
        allowedContentTypes: [UTType] = [.content],
        onFileSelected: ((URL) -> Void)? = nil,
        onFileRemoved: ((URL) -> Void)? = nil,
        browseLabel: String = "Tap to upload file",
        removeLabel: String = "Remove"
    ) {
        self.allowedContentTypes = allowedContentTypes
        self.browseLabel = browseLabel
        self.removeLabel = removeLabel
        self.onFileSelected = onFileSelected
        self.onFileRemoved = onFileRemoved
    }

    /// A part already holding `file`, for the tests: a picked file comes only
    /// from the system's importer.
    init(holding file: URL, onFileRemoved: ((URL) -> Void)? = nil, removeLabel: String = "Remove") {
        self.init(onFileRemoved: onFileRemoved, removeLabel: removeLabel)
        self._file = State(initialValue: file)
    }
    
    public var body: some View {
        VStack {
            if let file {
                HStack {
                    // A theme-coloured icon: theme 600 (decision 59).
                    // Decoration, as React's file icon: the name beside it
                    // says what it is. VoiceOver read it as "Document".
                    Image(systemName: "doc.fill")
                        .foregroundColor(KozmosColors.primitivesColorsTheme600)
                        .accessibilityHidden(true)
                    Text(file.lastPathComponent)
                        .lineLimit(1)
                        .truncationMode(.middle)
                    Spacer()
                    Button(action: {
                        self.file = nil
                        onFileRemoved?(file)
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(KozmosColors.primitivesColorsForeground500)
                    }
                    // The symbol's own name, "Close", was all VoiceOver had.
                    .accessibilityLabel(Text(verbatim: removeLabel))
                }
                .padding()
                .background(KozmosColors.primitivesColorsBackground100)
                .cornerRadius(KozmosDimensions.semanticsRadiusControl)
            } else {
                Button(action: { isImporting = true }) {
                    VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        Image(systemName: "arrow.up.doc")
                            .font(KozmosTypography.title2)
                        Text(browseLabel)
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
                self.file = selectedFile
                onFileSelected?(selectedFile)
            } catch {
                print("Error selecting file: \(error.localizedDescription)")
            }
        }
    }
}
