import XCTest
@testable import Kozmos

/// When a map control that reveals on change shows its label, on a clock the
/// test moves by hand.
///
/// A port of useRevealOnChange.test.ts, case for case, so the platforms agree
/// on how long "a while" is: open 2.5 seconds by default, an optional wait
/// before it opens, nothing on the first render, and a change mid-reveal
/// restarting the window rather than stacking a second one on it.
final class KozmosRevealOnChangeTests: XCTestCase {
    private var clock: ManualClock!
    private var reveal: KozmosRevealOnChange!

    override func setUp() {
        super.setUp()
        clock = ManualClock()
        reveal = KozmosRevealOnChange(schedule: clock.schedule)
    }

    func testStaysClosedOnTheFirstRender() {
        reveal.observe("off", enabled: true)
        XCTAssertFalse(reveal.isRevealed)

        clock.advance(milliseconds: 5000)
        XCTAssertFalse(reveal.isRevealed)
    }

    func testOpensWhenTheValueChangesAndClosesAfterTheDuration() {
        reveal.observe("off", enabled: true, duration: 2.5)
        reveal.observe("on", enabled: true, duration: 2.5)
        clock.advance(milliseconds: 0)
        XCTAssertTrue(reveal.isRevealed)

        clock.advance(milliseconds: 2499)
        XCTAssertTrue(reveal.isRevealed)

        clock.advance(milliseconds: 1)
        XCTAssertFalse(reveal.isRevealed)
    }

    /// React's default, which the SDK's control reads by.
    func testStaysOpenTwoAndAHalfSecondsUnlessToldOtherwise() {
        reveal.observe("off", enabled: true)
        reveal.observe("on", enabled: true)

        clock.advance(milliseconds: 2499)
        XCTAssertTrue(reveal.isRevealed)
        clock.advance(milliseconds: 1)
        XCTAssertFalse(reveal.isRevealed)
    }

    func testWaitsOutTheDelayBeforeOpening() {
        reveal.observe("off", enabled: true, duration: 3, delay: 1.4)
        reveal.observe("on", enabled: true, duration: 3, delay: 1.4)

        clock.advance(milliseconds: 1399)
        XCTAssertFalse(reveal.isRevealed)

        clock.advance(milliseconds: 1)
        XCTAssertTrue(reveal.isRevealed)

        clock.advance(milliseconds: 3000)
        XCTAssertFalse(reveal.isRevealed)
    }

    func testRestartsRatherThanStackingWhenTheValueChangesAgainMidReveal() {
        reveal.observe("off", enabled: true, duration: 2)
        reveal.observe("on", enabled: true, duration: 2)
        clock.advance(milliseconds: 1500)
        XCTAssertTrue(reveal.isRevealed)

        reveal.observe("off", enabled: true, duration: 2)
        clock.advance(milliseconds: 1500)
        // The first reveal's close fell due at 2000ms and would have shut this
        // one early if the timers stacked; the second reveal owns the window.
        XCTAssertTrue(reveal.isRevealed)

        clock.advance(milliseconds: 500)
        XCTAssertFalse(reveal.isRevealed)
    }

    func testStaysClosedWhileDisabled() {
        reveal.observe("off", enabled: false)
        reveal.observe("on", enabled: false)

        clock.advance(milliseconds: 5000)
        XCTAssertFalse(reveal.isRevealed)
    }

    /// Turning it off mid-reveal closes the label rather than freezing it, and
    /// turning it back on does not replay a change it was not watching.
    func testClosesWhenTurnedOffAndDoesNotReplayWhenTurnedBackOn() {
        reveal.observe("off", enabled: true)
        reveal.observe("on", enabled: true)
        clock.advance(milliseconds: 500)
        XCTAssertTrue(reveal.isRevealed)

        reveal.observe("on", enabled: false)
        XCTAssertFalse(reveal.isRevealed)

        reveal.observe("on", enabled: true)
        clock.advance(milliseconds: 5000)
        XCTAssertFalse(reveal.isRevealed)
    }

    /// A caller may compute the timing, so it can change while the label is
    /// open. The window already open keeps the timing it opened with, and the
    /// new timing applies from the next change.
    func testClosesEvenWhenItsTimingChangesWhileItIsOpen() {
        reveal.observe("off", enabled: true, duration: 2, delay: 0)
        reveal.observe("on", enabled: true, duration: 2, delay: 0)
        clock.advance(milliseconds: 500)
        XCTAssertTrue(reveal.isRevealed)

        reveal.observe("on", enabled: true, duration: 5, delay: 0.3)
        clock.advance(milliseconds: 1500)
        XCTAssertFalse(reveal.isRevealed)

        reveal.observe("off", enabled: true, duration: 5, delay: 0.3)
        clock.advance(milliseconds: 299)
        XCTAssertFalse(reveal.isRevealed)
        clock.advance(milliseconds: 1)
        XCTAssertTrue(reveal.isRevealed)
        clock.advance(milliseconds: 5000)
        XCTAssertFalse(reveal.isRevealed)
    }
}

/// `setTimeout` and `clearTimeout` on a clock that moves only when told to —
/// what vitest's fake timers are to the React tests. Kept in whole
/// milliseconds, so 2499 + 1 lands on 2500 exactly.
final class ManualClock {
    private struct Timer {
        let id: Int
        let due: Int
        let fire: () -> Void
    }

    private(set) var now = 0
    private var timers: [Timer] = []
    private var lastID = 0

    func schedule(after seconds: TimeInterval, _ fire: @escaping () -> Void) -> () -> Void {
        lastID += 1
        let id = lastID
        timers.append(Timer(id: id, due: now + Int((seconds * 1000).rounded()), fire: fire))
        return { [weak self] in self?.timers.removeAll { $0.id == id } }
    }

    /// Moves the clock on, firing each timer that falls due on the way, in the
    /// order it falls due.
    func advance(milliseconds: Int) {
        let end = now + milliseconds
        while let next = timers.filter({ $0.due <= end }).min(by: { ($0.due, $0.id) < ($1.due, $1.id) }) {
            timers.removeAll { $0.id == next.id }
            now = next.due
            next.fire()
        }
        now = end
    }
}
