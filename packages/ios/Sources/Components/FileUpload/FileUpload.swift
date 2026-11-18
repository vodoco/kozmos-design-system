import ImageIO
import SwiftUI
import UniformTypeIdentifiers

/// What FileUpload shows of the file it holds, as React's `preview` prop.
public enum KozmosFileUploadPreview: Equatable {
    /// The file's name, with a remove button.
    case none
    /// One image, shown once chosen as an avatar-sized thumbnail beside its
    /// name, with Change and Remove (GAP-270).
    case image
}

/// What the visitor picks with, as React's `variant` prop (GAP-274).
public enum KozmosFileUploadVariant: Equatable, Sendable, CaseIterable {
    /// The dashed drop area, as it always was.
    case dropzone
    /// A Button-sized trigger: the outline KozmosButton with the upload icon
    /// and the browse label, for a field with no room for a drop area, such
    /// as a client's logo beside its name.
    case button
}

public struct KozmosFileUpload: View {
    @State private var isImporting = false
    @State private var file: URL?
    @State private var image: CGImage?
    let allowedContentTypes: [UTType]
    let browseLabel: String
    let removeLabel: String
    let variant: KozmosFileUploadVariant
    let preview: KozmosFileUploadPreview
    let changeLabel: String
    let previewAlt: String?
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
    ///
    /// `preview: .image` holds one image: the importer offers images unless
    /// `allowedContentTypes` names others, and the chosen one shows as an
    /// avatar-sized thumbnail, its accessibility label `previewAlt` (the
    /// file's name unless you pass one), with a `changeLabel` button,
    /// "Change" by default, that opens the importer again, and the remove
    /// button.
    public init(
        allowedContentTypes: [UTType] = [.content],
        onFileSelected: ((URL) -> Void)? = nil,
        onFileRemoved: ((URL) -> Void)? = nil,
        browseLabel: String? = nil,
        removeLabel: String = "Remove",
        preview: KozmosFileUploadPreview = .none,
        changeLabel: String = "Change",
        previewAlt: String? = nil,
        variant: KozmosFileUploadVariant = .dropzone
    ) {
        self.allowedContentTypes = allowedContentTypes
        self.variant = variant
        self.browseLabel = browseLabel ?? Self.defaultBrowseLabel(for: variant)
        self.removeLabel = removeLabel
        self.preview = preview
        self.changeLabel = changeLabel
        self.previewAlt = previewAlt
        self.onFileSelected = onFileSelected
        self.onFileRemoved = onFileRemoved
    }

    /// The words that open the importer when the product passes none: the
    /// drop area's "Tap to upload file", and a button's "Choose file", as
    /// React's.
    static func defaultBrowseLabel(for variant: KozmosFileUploadVariant) -> String {
        variant == .button ? "Choose file" : "Tap to upload file"
    }

    /// A part already holding `file`, for the tests: a picked file comes only
    /// from the system's importer.
    init(
        holding file: URL,
        onFileRemoved: ((URL) -> Void)? = nil,
        removeLabel: String = "Remove",
        preview: KozmosFileUploadPreview = .none,
        changeLabel: String = "Change",
        previewAlt: String? = nil,
        variant: KozmosFileUploadVariant = .dropzone
    ) {
        self.init(
            onFileRemoved: onFileRemoved,
            removeLabel: removeLabel,
            preview: preview,
            changeLabel: changeLabel,
            previewAlt: previewAlt,
            variant: variant
        )
        self._file = State(initialValue: file)
    }

    /// The types the importer offers: images for an image preview whose
    /// caller named none, as React's `accept` falls back to `image/*`.
    var importedTypes: [UTType] {
        preview == .image && allowedContentTypes == [.content] ? [.image] : allowedContentTypes
    }

    /// The image at `url`, read inside its security scope, as the importer
    /// hands out; nil for a file that is not one.
    static func loadImage(at url: URL) -> CGImage? {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        return CGImageSourceCreateImageAtIndex(source, 0, nil)
    }
    
    public var body: some View {
        VStack {
            if let file, preview == .image {
                imagePreview(of: file)
            } else if let file {
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
            } else if variant == .button {
                // In place of the drop area, the outline Button at its default
                // size, the upload icon and the browse label (GAP-274). It
                // opens the same importer, of the same types, and what is
                // chosen shows as the drop area's does.
                HStack {
                    KozmosButton(browseLabel, variant: .outline, leadingIconName: "upload-01") {
                        isImporting = true
                    }
                    Spacer(minLength: 0)
                }
            } else {
                Button(action: { isImporting = true }) {
                    VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        Image(systemName: "arrow.up.doc")
                            .font(KozmosTypography.title2)
                        Text(browseLabel)
                            .font(KozmosTypography.body)
                    }
                    // Muted, as React's `text-muted-foreground` mark and words
                    // and Compose's are; it was the button's default tint.
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
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
        .task(id: preview == .image ? file : nil) {
            guard preview == .image, let file else {
                image = nil
                return
            }
            image = Self.loadImage(at: file)
        }
        .fileImporter(
            isPresented: $isImporting,
            allowedContentTypes: importedTypes,
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

    /// The chosen image, avatar-sized and round as KozmosAvatar, then its
    /// name, Change and the remove button, on the file row's surface.
    private func imagePreview(of file: URL) -> some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            ZStack {
                Circle().fill(KozmosColors.primitivesColorsBackground300)
                if let image {
                    Image(image, scale: 1, label: Text(verbatim: previewAlt ?? file.lastPathComponent))
                        .resizable()
                        .scaledToFill()
                }
            }
            .frame(width: KozmosDimensions.primitivesLayoutSizing500, height: KozmosDimensions.primitivesLayoutSizing500)
            .clipShape(Circle())
            Text(file.lastPathComponent)
                .font(KozmosTypography.body)
                .lineLimit(1)
                .truncationMode(.middle)
            Spacer(minLength: 0)
            KozmosButton(changeLabel, variant: .outline, size: .sm) { isImporting = true }
            Button(action: {
                self.file = nil
                onFileRemoved?(file)
            }) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
            .accessibilityLabel(Text(verbatim: removeLabel))
        }
        .padding()
        .background(KozmosColors.primitivesColorsBackground100)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
    }
}
