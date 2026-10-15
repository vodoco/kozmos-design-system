import Foundation

/// Tells a result's double tap from two taps (GAP-143, decision 72), as
/// React's `POIResultCard` does with the browser's click count.
///
/// The first press on a result selects it at once: nothing waits to see
/// whether a second follows. A second press on the same result within
/// `interval` of the first opens it, and is not a second selection, so the
/// first press's selection stands. Every further press in that quick run is
/// ignored, as the browser ignores a third click (`detail` 3). A press after
/// the run has paused for `interval`, or on another result, starts a new run
/// and selects.
///
/// A value with no clock of its own: the caller says when each press came,
/// in seconds on one monotonic clock, so a test drives it without waiting.
struct KozmosDoubleTapGate: Equatable {
    /// What a press does.
    enum Outcome: Equatable {
        case select
        case open
        case ignore
    }

    /// Android's double-tap timeout, and about iOS's: React's `DOUBLE_TAP_MS`.
    static let interval: TimeInterval = 0.3

    private var lastId: String?
    private var lastTime: TimeInterval?
    /// The presses in the current run, this one included.
    private var run = 0

    /// Records a press on the result `id` at `time` and says what it does.
    mutating func press(_ id: String, at time: TimeInterval) -> Outcome {
        if id == lastId, let lastTime, time >= lastTime, time - lastTime < Self.interval {
            run += 1
        } else {
            run = 1
        }
        lastId = id
        lastTime = time
        switch run {
        case 1: return .select
        case 2: return .open
        default: return .ignore
        }
    }
}
