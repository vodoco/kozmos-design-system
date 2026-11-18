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
    @State private var files: [URL] = []
    /// Why the last pick was turned away, as React's field error says it.
    @State private var refusal: String?
    @State private var image: CGImage?
    /// The first file held, the one an image preview shows.
    private var file: URL? { files.first }
    let allowedContentTypes: [UTType]
    let browseLabel: String
    let removeLabel: String
    let variant: KozmosFileUploadVariant
    let preview: KozmosFileUploadPreview
    let changeLabel: String
    let previewAlt: String?
    var onFileSelected: ((URL) -> Void)?
    var onFileRemoved: ((URL) -> Void)?
    /// How many files one pick may hold, as React's `maxFiles`.
    let maxFiles: Int?
    /// The largest file, in bytes, as React's `maxSize`.
    let maxSize: Int64?
    /// Whether the importer takes several files, as React's `multiple`.
    let multiple: Bool?
    let tooManyFilesLabel: (Int) -> String
    let tooLargeLabel: (String, String) -> String
    var onFilesChange: (([URL]) -> Void)?
    
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
    ///
    /// `maxSize`, in bytes, and `maxFiles` limit a pick as React's do
    /// (GAP-280): a file over the size, or a pick past the count, is turned
    /// away, the files held stay, and the refusal is said under the part, in
    /// `tooLargeLabel` (given the file's name and the limit as written, "2.0
    /// MB") or `tooManyFilesLabel` (given the count), React's English by
    /// default. `multiple` lets the importer take several files; unset, it
    /// does when `maxFiles` is over 1. Each file chosen is listed with its
    /// own remove button, `onFilesChange` is told the files held after each
    /// pick or removal, and `onFileSelected` the first file of a pick, as
    /// React's `onFileSelect`. An image preview holds one image.
    public init(
        allowedContentTypes: [UTType] = [.content],
        onFileSelected: ((URL) -> Void)? = nil,
        onFileRemoved: ((URL) -> Void)? = nil,
        browseLabel: String? = nil,
        removeLabel: String = "Remove",
        preview: KozmosFileUploadPreview = .none,
        changeLabel: String = "Change",
        previewAlt: String? = nil,
        variant: KozmosFileUploadVariant = .dropzone,
        tooManyFilesLabel: @escaping (Int) -> String = KozmosFileUpload.defaultTooManyFilesLabel,
        tooLargeLabel: @escaping (String, String) -> String = KozmosFileUpload.defaultTooLargeLabel,
        onFilesChange: (([URL]) -> Void)? = nil,
        // Not closures, and last: a lone trailing closure is still
        // `onFileSelected` in Swift 5's backward matching.
        maxSize: Int64? = nil,
        maxFiles: Int? = nil,
        multiple: Bool? = nil
    ) {
        self.allowedContentTypes = allowedContentTypes
        self.maxSize = maxSize
        self.maxFiles = maxFiles
        self.multiple = multiple
        self.tooManyFilesLabel = tooManyFilesLabel
        self.tooLargeLabel = tooLargeLabel
        self.onFilesChange = onFilesChange
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

    /// React's refusal of a pick past `maxFiles`: "Select up to 3 files."
    public static func defaultTooManyFilesLabel(_ maxFiles: Int) -> String {
        "Select up to \(maxFiles) \(maxFiles == 1 ? "file" : "files")."
    }

    /// React's refusal of a file over `maxSize`: "plan.pdf exceeds 2.0 MB."
    public static func defaultTooLargeLabel(_ fileName: String, _ maxSize: String) -> String {
        "\(fileName) exceeds \(maxSize)."
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
        self.init(holding: [file], onFileRemoved: onFileRemoved, removeLabel: removeLabel, preview: preview,
                  changeLabel: changeLabel, previewAlt: previewAlt, variant: variant)
    }

    /// A part already holding `files`, and saying `refusal`, for the tests.
    init(
        holding files: [URL],
        refusal: String? = nil,
        onFileRemoved: ((URL) -> Void)? = nil,
        removeLabel: String = "Remove",
        preview: KozmosFileUploadPreview = .none,
        changeLabel: String = "Change",
        previewAlt: String? = nil,
        variant: KozmosFileUploadVariant = .dropzone,
        onFilesChange: (([URL]) -> Void)? = nil
    ) {
        self.init(
            onFileRemoved: onFileRemoved,
            removeLabel: removeLabel,
            preview: preview,
            changeLabel: changeLabel,
            previewAlt: previewAlt,
            variant: variant,
            onFilesChange: onFilesChange
        )
        self._files = State(initialValue: files)
        self._refusal = State(initialValue: refusal)
    }

    /// How many files a pick may hold: one for an image preview, `maxFiles`,
    /// or with neither, any number with `multiple` and one without, as
    /// React's.
    var resolvedMaxFiles: Int {
        if preview == .image { return 1 }
        return maxFiles ?? (multiple == true ? .max : 1)
    }

    /// Whether the importer takes several files: `multiple` when given,
    /// otherwise when the count allows more than one; never for an image.
    var allowsMultipleSelection: Bool {
        preview != .image && (multiple ?? (resolvedMaxFiles > 1))
    }

    /// Why `picked` is turned away, or nil: past the count first, then the
    /// first file over `maxSize`, as React checks them. `sizeOf` reads a
    /// file's size in bytes, nil where it cannot be read (not refused).
    func refusal(for picked: [URL], sizeOf: (URL) -> Int64?) -> String? {
        if picked.count > resolvedMaxFiles { return tooManyFilesLabel(resolvedMaxFiles) }
        if let maxSize, let oversized = picked.first(where: { (sizeOf($0) ?? 0) > maxSize }) {
            return tooLargeLabel(oversized.lastPathComponent, Self.formatBytes(maxSize))
        }
        return nil
    }

    /// A size as React's FileUpload writes it: "0 B", "512 B", "2.0 KB",
    /// "10 MB", one decimal under 10 of a unit past bytes.
    static func formatBytes(_ bytes: Int64) -> String {
        if bytes <= 0 { return "0 B" }
        let units = ["B", "KB", "MB", "GB"]
        let exponent = min(Int(floor(log(Double(bytes)) / log(1024))), units.count - 1)
        let value = Double(bytes) / pow(1024, Double(exponent))
        let digits = value >= 10 || exponent == 0 ? 0 : 1
        return String(format: "%.\(digits)f", value) + " " + units[exponent]
    }

    /// A picked file's size, read inside its security scope, as the importer
    /// hands it out.
    static func fileSize(of url: URL) -> Int64? {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        return (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize).flatMap { $0 }.map(Int64.init)
    }

    /// A pick: refused, keeping the files held, or held in their place.
    private func receive(_ picked: [URL]) {
        guard !picked.isEmpty else { return }
        if let reason = refusal(for: picked, sizeOf: Self.fileSize(of:)) {
            refusal = reason
            return
        }
        refusal = nil
        files = picked
        onFilesChange?(picked)
        onFileSelected?(picked[0])
    }

    private func remove(_ removed: URL) {
        files.removeAll { $0 == removed }
        refusal = nil
        onFilesChange?(files)
        onFileRemoved?(removed)
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
            } else if !files.isEmpty {
                ForEach(files, id: \.self) { file in
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
                        Button(action: { remove(file) }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(KozmosColors.primitivesColorsForeground500)
                        }
                        // The symbol's own name, "Close", was all VoiceOver had.
                        .accessibilityLabel(Text(verbatim: removeLabel))
                    }
                    .padding()
                    .background(KozmosColors.primitivesColorsBackground100)
                    .cornerRadius(KozmosDimensions.semanticsRadiusControl)
                }
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
            // A refused pick, said under the part as React's field error is,
            // in the error colour; the files held stay (GAP-280).
            if let refusal {
                Text(refusal)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsEmotionalDanger600)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
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
            allowsMultipleSelection: allowsMultipleSelection
        ) { result in
            do {
                receive(try result.get())
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
            Button(action: { remove(file) }) {
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
