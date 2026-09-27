import Foundation
import Combine

/// Reveals something for a while after a value changes, then closes it again.
///
/// React's `useRevealOnChange`, for SwiftUI. A map mode toggle rests
/// icon-only; when its mode changes it widens to say which mode it is now,
/// holds long enough to be read, and collapses so it stops covering the map.
/// That is timing, not appearance, so it lives here rather than in
/// `KozmosMapControlButton`'s body — and apart from any view, so the timing can
/// be tested on a clock the test moves by hand.
///
/// The first value it is shown never reveals: a control that announces its
/// state on arrival is announcing something the visitor did not just do.
///
/// A change of `duration` or `delay` applies from the next change of value; a
/// window that is already open keeps the timing it opened with.
final class KozmosRevealOnChange: ObservableObject {
    /// Runs `fire` after `delay` seconds and returns a way to call it off. The
    /// main queue in an app; a test passes a clock it moves by hand.
    typealias Schedule = (_ delay: TimeInterval, _ fire: @escaping () -> Void) -> () -> Void

    /// Whether the caller should be showing its label right now.
    @Published private(set) var isRevealed = false

    private let schedule: Schedule
    private var observed: AnyHashable?
    private var hasObserved = false
    private var cancelPending: (() -> Void)?

    init(schedule: @escaping Schedule = KozmosRevealOnChange.onMainQueue) {
        self.schedule = schedule
    }

    deinit {
        cancelPending?()
    }

    /// Tells the reveal what the control shows now, every time that may have
    /// changed. Only a change of `value` opens it; turning `enabled` off closes
    /// it, and turning it back on replays nothing.
    func observe(
        _ value: AnyHashable,
        enabled: Bool,
        duration: TimeInterval = 2.5,
        delay: TimeInterval = 0
    ) {
        let changed = hasObserved && observed != value
        hasObserved = true
        observed = value

        guard enabled else {
            // Off mid-reveal closes rather than freezes.
            cancel()
            if isRevealed { isRevealed = false }
            return
        }
        guard changed else { return }

        // A second change restarts the window rather than stacking another on
        // it: the first reveal's close would otherwise cut the second short.
        cancel()
        cancelPending = schedule(delay) { [weak self] in
            guard let self else { return }
            self.isRevealed = true
            self.cancelPending = self.schedule(duration) { [weak self] in
                self?.isRevealed = false
                self?.cancelPending = nil
            }
        }
    }

    private func cancel() {
        cancelPending?()
        cancelPending = nil
    }

    static let onMainQueue: Schedule = { delay, fire in
        let work = DispatchWorkItem(block: fire)
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
        return { work.cancel() }
    }
}
