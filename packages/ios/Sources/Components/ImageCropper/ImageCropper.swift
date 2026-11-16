import SwiftUI
#if os(iOS)
import UIKit
#endif

/// Where an image is framed: a rectangle of the image, each side a fraction
/// of the image's own width or height (0 to 1), measured from its top-left
/// corner, whatever the layout direction. Data, not pixels: the product
/// crops (`x * pixelWidth` and so on). React's `ImageCropperCrop`.
public struct KozmosImageCrop: Equatable, Sendable {
    public var x: Double
    public var y: Double
    public var width: Double
    public var height: Double

    public init(x: Double, y: Double, width: Double, height: Double) {
        self.x = x
        self.y = y
        self.width = width
        self.height = height
    }
}

/// What `statusLabel` is given: each a whole percentage.
public struct KozmosImageCropperStatus: Equatable, Sendable {
    /// The frame's left edge, from the image's left.
    public let left: Int
    /// The frame's top edge, from the image's top.
    public let top: Int
    /// The zoom: 100 shows the most of the image the ratio allows.
    public let zoom: Int
}

/// The cropper's arithmetic, the same as React's and Compose's: the frame at
/// zoom 1 is the largest of the ratio's shape the image holds, a zoom
/// divides it, and every frame is held inside the image.
struct KozmosImageCropFrame: Equatable {
    /// The frame at zoom 1, as fractions of the image.
    let baseWidth: Double
    let baseHeight: Double
    let maxZoom: Double

    static let zoomStep = 1.25
    static let panStep = 0.1

    init(imageSize: CGSize, aspectRatio: Double, maxZoom: Double) {
        let ratio = aspectRatio > 0 ? aspectRatio : 1
        let width = Swift.max(Double(imageSize.width), 1)
        let height = Swift.max(Double(imageSize.height), 1)
        let framed = Swift.min(width, height * ratio)
        baseWidth = framed / width
        baseHeight = framed / ratio / height
        self.maxZoom = Swift.max(1, maxZoom)
    }

    private func clamp(_ value: Double, _ low: Double, _ high: Double) -> Double {
        Swift.min(Swift.max(value, low), high)
    }

    func zoom(of crop: KozmosImageCrop) -> Double { baseWidth / crop.width }

    /// A frame at `zoom`, its top-left at x and y, held inside the image.
    func place(x: Double, y: Double, zoom: Double) -> KozmosImageCrop {
        let z = clamp(zoom, 1, maxZoom)
        let width = baseWidth / z
        let height = baseHeight / z
        return KozmosImageCrop(
            x: clamp(x, 0, 1 - width),
            y: clamp(y, 0, 1 - height),
            width: width,
            height: height
        )
    }

    /// A frame given in, made one this image and ratio can have; nil is the
    /// middle at zoom 1.
    func normalise(_ crop: KozmosImageCrop?) -> KozmosImageCrop {
        guard let crop else {
            return place(x: (1 - baseWidth) / 2, y: (1 - baseHeight) / 2, zoom: 1)
        }
        return place(x: crop.x, y: crop.y, zoom: zoom(of: crop))
    }

    /// Moved by `dx` and `dy` tenths of the frame, physically: right is
    /// right in right to left too, because an image does not mirror.
    func pan(_ crop: KozmosImageCrop, dx: Double, dy: Double) -> KozmosImageCrop {
        place(
            x: crop.x + dx * crop.width * Self.panStep,
            y: crop.y + dy * crop.height * Self.panStep,
            zoom: zoom(of: crop)
        )
    }

    /// Zoomed to `zoom` about the frame's middle, so what is centred stays.
    func zoom(_ crop: KozmosImageCrop, to zoom: Double) -> KozmosImageCrop {
        let z = clamp(zoom, 1, maxZoom)
        return place(
            x: crop.x + crop.width / 2 - baseWidth / z / 2,
            y: crop.y + crop.height / 2 - baseHeight / z / 2,
            zoom: z
        )
    }

    /// Dragged by a fraction of the box (`dx`, `dy`) and scaled by `scale`
    /// from `start`: the image follows the finger, so the frame moves the
    /// other way.
    func drag(_ start: KozmosImageCrop, dx: Double, dy: Double, scale: Double) -> KozmosImageCrop {
        let z = clamp(zoom(of: start) * scale, 1, maxZoom)
        let middleX = start.x + start.width / 2 - dx * start.width
        let middleY = start.y + start.height / 2 - dy * start.height
        return place(x: middleX - baseWidth / z / 2, y: middleY - baseHeight / z / 2, zoom: z)
    }

    func status(_ crop: KozmosImageCrop) -> KozmosImageCropperStatus {
        KozmosImageCropperStatus(
            left: Int((crop.x * 100).rounded()),
            top: Int((crop.y * 100).rounded()),
            zoom: Int((zoom(of: crop) * 100).rounded())
        )
    }
}

/// An image framed to an aspect ratio (GAP-273), as React's `ImageCropper`:
/// the frame is the box, and the image moves and scales under it. A drag
/// moves the image, a pinch zooms it, and the zoom row under it has Zoom out,
/// a zoom slider and Zoom in. `crop` is the frame as fractions of the image,
/// never pixels; nil frames the middle at zoom 100%, and the cropper writes
/// that frame back once it is drawn, as React's `onCrop` hands it back on
/// load.
///
/// VoiceOver reads the frame as one element, named `label`, with where the
/// frame is as its value: swipe up or down zooms in or out, and the Move
/// actions move it by a tenth of itself; each change is said. A hardware
/// keyboard's arrows move it and plus and minus zoom (iOS 17 and macOS 14).
public struct KozmosImageCropper: View {
    let image: Image
    let imageSize: CGSize
    @Binding var crop: KozmosImageCrop?
    let aspectRatio: Double
    let maxZoom: Double
    let showZoomControls: Bool
    let label: String
    let instructions: String
    let statusLabel: (KozmosImageCropperStatus) -> String
    let zoomInLabel: String
    let zoomOutLabel: String
    let zoomLabel: String
    let moveLabels: KozmosImageCropperMoveLabels

    @Environment(\.isEnabled) private var isEnabled
    @State private var gestureStart: KozmosImageCrop?

    /// - Parameters:
    ///   - image: The image to frame, and `imageSize`, its size in any unit:
    ///     only its shape is read.
    ///   - crop: The frame. nil frames the middle at zoom 100%.
    ///   - aspectRatio: The frame's width over its height: 1, the default,
    ///     for a square logo; 16 / 9 for a cover.
    ///   - maxZoom: How far it zooms in. 4 by default.
    ///   - showZoomControls: Whether the zoom row is drawn.
    ///   - label: The cropper's name, "Image frame".
    ///   - instructions: How to work it, VoiceOver's hint.
    ///   - statusLabel: What is said after each move or zoom, and the frame's value.
    public init(
        image: Image,
        imageSize: CGSize,
        crop: Binding<KozmosImageCrop?>,
        aspectRatio: Double = 1,
        maxZoom: Double = 4,
        showZoomControls: Bool = true,
        label: String = "Image frame",
        instructions: String = "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom.",
        statusLabel: @escaping (KozmosImageCropperStatus) -> String = KozmosImageCropper.defaultStatusLabel,
        zoomInLabel: String = "Zoom in",
        zoomOutLabel: String = "Zoom out",
        zoomLabel: String = "Zoom",
        moveLabels: KozmosImageCropperMoveLabels = KozmosImageCropperMoveLabels()
    ) {
        self.image = image
        self.imageSize = imageSize
        self._crop = crop
        self.aspectRatio = aspectRatio > 0 ? aspectRatio : 1
        self.maxZoom = Swift.max(1, maxZoom)
        self.showZoomControls = showZoomControls
        self.label = label
        self.instructions = instructions
        self.statusLabel = statusLabel
        self.zoomInLabel = zoomInLabel
        self.zoomOutLabel = zoomOutLabel
        self.zoomLabel = zoomLabel
        self.moveLabels = moveLabels
    }

    public static func defaultStatusLabel(_ status: KozmosImageCropperStatus) -> String {
        "Frame \(status.left)% from the left, \(status.top)% from the top, zoom \(status.zoom)%."
    }

    var frame: KozmosImageCropFrame {
        KozmosImageCropFrame(imageSize: imageSize, aspectRatio: aspectRatio, maxZoom: maxZoom)
    }

    /// The frame drawn: the one given, made one this image can have.
    var current: KozmosImageCrop { frame.normalise(crop) }

    var statusText: String { statusLabel(frame.status(current)) }

    /// Moves the frame; says where it is now unless `quiet`.
    func commit(_ next: KozmosImageCrop, quiet: Bool = false) {
        guard isEnabled else { return }
        if next != crop { crop = next }
        if !quiet { announce(next) }
    }

    func zoomIn() { commit(frame.zoom(current, to: frame.zoom(of: current) * KozmosImageCropFrame.zoomStep)) }
    func zoomOut() { commit(frame.zoom(current, to: frame.zoom(of: current) / KozmosImageCropFrame.zoomStep)) }
    func move(dx: Double, dy: Double) { commit(frame.pan(current, dx: dx, dy: dy)) }

    private func announce(_ next: KozmosImageCrop) {
        #if os(iOS)
        UIAccessibility.post(notification: .announcement, argument: statusLabel(frame.status(next)))
        #endif
    }

    private var atMin: Bool { frame.zoom(of: current) <= 1 + 1e-9 }
    private var atMax: Bool { frame.zoom(of: current) >= maxZoom - 1e-9 }

    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            frameView
            if showZoomControls {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    KozmosIconButton(
                        iconName: "minus.magnifyingglass",
                        variant: .outline,
                        isDisabled: !isEnabled || atMin,
                        action: zoomOut
                    )
                    .accessibilityLabel(zoomOutLabel)
                    KozmosSlider(
                        value: Binding(
                            get: { (frame.zoom(of: current) * 100).rounded() },
                            // The slider says its own value: nothing more is said.
                            set: { commit(frame.zoom(current, to: $0 / 100), quiet: true) }
                        ),
                        range: 100...Swift.max(100.5, maxZoom * 100),
                        formatValue: { "\(Int($0.rounded()))%" }
                    )
                    .accessibilityLabel(zoomLabel)
                    .disabled(maxZoom <= 1)
                    KozmosIconButton(
                        iconName: "plus.magnifyingglass",
                        variant: .outline,
                        isDisabled: !isEnabled || atMax,
                        action: zoomIn
                    )
                    .accessibilityLabel(zoomInLabel)
                }
            }
        }
        // nil, or a frame this image cannot have, becomes the one drawn,
        // and the product is handed it.
        .onAppear { if crop != current { crop = current } }
        .onChange(of: imageSize) { _ in if crop != current { crop = current } }
    }

    private var frameView: some View {
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
        return Color.clear
            .aspectRatio(aspectRatio, contentMode: .fit)
            .frame(maxWidth: .infinity)
            .background(KozmosColors.primitivesColorsBackground100)
            .overlay(alignment: .topLeading) {
                GeometryReader { box in
                    let shown = current
                    image
                        .resizable()
                        .frame(width: box.size.width / shown.width, height: box.size.height / shown.height)
                        .offset(
                            x: -shown.x / shown.width * box.size.width,
                            y: -shown.y / shown.height * box.size.height
                        )
                        .accessibilityHidden(true)
                }
                // Physical: an image's pixels do not mirror right to left.
                .environment(\.layoutDirection, .leftToRight)
            }
            .clipShape(shape)
            .overlay(shape.strokeBorder(KozmosColors.semanticsBorderInput, lineWidth: 1))
            .contentShape(shape)
            .opacity(isEnabled ? 1 : 0.5)
            .overlay { GeometryReader { box in Color.clear.contentShape(Rectangle()).gesture(gesture(in: box.size)) } }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label)
            .accessibilityValue(statusText)
            .accessibilityHint(instructions)
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: zoomIn()
                case .decrement: zoomOut()
                @unknown default: break
                }
            }
            // Declared last first: VoiceOver offers the outermost action
            // first, so it reads left, right, up, down.
            .accessibilityAction(named: Text(moveLabels.down)) { move(dx: 0, dy: 1) }
            .accessibilityAction(named: Text(moveLabels.up)) { move(dx: 0, dy: -1) }
            .accessibilityAction(named: Text(moveLabels.right)) { move(dx: 1, dy: 0) }
            .accessibilityAction(named: Text(moveLabels.left)) { move(dx: -1, dy: 0) }
            .modifier(KozmosImageCropperKeys(move: { move(dx: $0, dy: $1) }, zoomIn: zoomIn, zoomOut: zoomOut))
    }

    private func gesture(in size: CGSize) -> some Gesture {
        let drag = DragGesture(minimumDistance: 0)
        let pinch = MagnificationGesture()
        return SimultaneousGesture(drag, pinch)
            .onChanged { value in
                guard isEnabled, size.width > 0, size.height > 0 else { return }
                let start = gestureStart ?? current
                if gestureStart == nil { gestureStart = start }
                let translation = value.first?.translation ?? .zero
                // Quiet while it moves: the place is said once it lets go.
                commit(
                    frame.drag(
                        start,
                        dx: Double(translation.width / size.width),
                        dy: Double(translation.height / size.height),
                        scale: Double(value.second ?? 1)
                    ),
                    quiet: true
                )
            }
            .onEnded { _ in
                guard gestureStart != nil else { return }
                gestureStart = nil
                announce(current)
            }
    }
}

/// The names of VoiceOver's Move actions, in the product's language.
public struct KozmosImageCropperMoveLabels: Equatable, Sendable {
    public var left: String
    public var right: String
    public var up: String
    public var down: String

    public init(left: String = "Move left", right: String = "Move right", up: String = "Move up", down: String = "Move down") {
        self.left = left
        self.right = right
        self.up = up
        self.down = down
    }
}

/// A hardware keyboard: the arrows move the frame, plus and minus zoom. On
/// iOS 17 and macOS 14, where a view takes key presses.
private struct KozmosImageCropperKeys: ViewModifier {
    let move: (Double, Double) -> Void
    let zoomIn: () -> Void
    let zoomOut: () -> Void

    func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, macCatalyst 17.0, *) {
            content
                .focusable()
                .onKeyPress(keys: [.leftArrow, .rightArrow, .upArrow, .downArrow, "+", "=", "-", "_"]) { press in
                    switch press.key {
                    case .leftArrow: move(-1, 0)
                    case .rightArrow: move(1, 0)
                    case .upArrow: move(0, -1)
                    case .downArrow: move(0, 1)
                    case "+", "=": zoomIn()
                    case "-", "_": zoomOut()
                    default: return .ignored
                    }
                    return .handled
                }
        } else {
            content
        }
    }
}
