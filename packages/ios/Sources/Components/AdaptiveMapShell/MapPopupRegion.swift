import SwiftUI

struct KozmosMapPopupRegion: Equatable {
    var bounds: CGRect
    var available: Bool
}
private struct KozmosMapPopupRegionKey: EnvironmentKey {
    static var defaultValue: KozmosMapPopupRegion? = nil
}
extension EnvironmentValues {
    var kozmosMapPopupRegion: KozmosMapPopupRegion? {
        get { self[KozmosMapPopupRegionKey.self] }
        set { self[KozmosMapPopupRegionKey.self] = newValue }
    }
}

/// Prefer the original upward column; use the larger side when neither side
/// fits. A scroll viewport, never smaller floor targets, handles the remainder.
func kozmosFloorPopupFrame(anchor: CGRect, bounds: CGRect, desiredHeight: CGFloat, inset: CGFloat, rtl: Bool, allowHorizontalShift: Bool = false) -> CGRect? {
    // A shell can reserve the clear map beside a same-side panel, leaving
    // the visible trigger outside that region horizontally. Clamp the popup
    // into it without treating the trigger as unavailable.
    guard anchor.width > 0, anchor.height > 0,
          bounds.width >= anchor.width + inset * 2, bounds.height > 0,
          anchor.minY >= bounds.minY - 0.5, anchor.maxY <= bounds.maxY + 0.5,
          allowHorizontalShift || bounds.insetBy(dx: -0.5, dy: -0.5).contains(anchor) else { return nil }
    let above = min(bounds.maxY, anchor.maxY + inset) - bounds.minY
    let below = bounds.maxY - max(bounds.minY, anchor.minY - inset)
    let up = desiredHeight <= above || above >= below
    let height = min(desiredHeight, up ? above : below)
    guard height >= anchor.height + inset * 2 else { return nil }
    let width = anchor.width + inset * 2
    let x = min(max(rtl ? anchor.minX - inset : anchor.maxX + inset - width, bounds.minX), bounds.maxX - width)
    let y = min(max(up ? anchor.maxY + inset - height : anchor.minY - inset, bounds.minY), bounds.maxY - height)
    return CGRect(x: x, y: y, width: width, height: height)
}

struct KozmosFloorAnchorFrameKey: PreferenceKey {
    static var defaultValue: CGRect = .zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        let next = nextValue()
        if !next.isEmpty { value = next }
    }
}
