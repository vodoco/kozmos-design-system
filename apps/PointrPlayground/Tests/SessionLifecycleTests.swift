import XCTest
import PointrKit
import Kozmos
@testable import KozmosPointrQA

/// Work the SDK's callbacks queued before a stop or a retry, run after it.
/// The session tests drive the real `SDKSession`: its delegate methods are the
/// ones PointrKit calls, here called directly, and `retry` is given a
/// configuration that fails, so no test reaches the SDK's `start`.
@MainActor
final class SessionLifecycleTests: XCTestCase {
    /// Lets the main actor run what is already queued on it: the callbacks'
    /// work was queued before this, and runs first.
    private func runQueuedWork() async {
        await Task { @MainActor in }.value
    }

    private func missingConfiguration() throws -> QAConfiguration {
        throw QAConfiguration.ConfigurationError.missing
    }

    // MARK: The session's token

    func testWorkQueuedInTheCurrentSessionRuns() {
        let generation = SDKSessionGeneration()
        generation.begin()
        XCTAssertTrue(generation.accepts(generation.current))
    }

    func testWorkQueuedBeforeAStopIsRefusedAfterIt() {
        let generation = SDKSessionGeneration()
        generation.begin()
        let queued = generation.current
        generation.end()
        XCTAssertFalse(generation.accepts(queued))
    }

    /// A `started` flag would let this through: the new session is started too.
    func testWorkQueuedBeforeARetryIsRefusedByTheNewSession() {
        let generation = SDKSessionGeneration()
        generation.begin()
        let queued = generation.current
        generation.end()
        generation.begin()
        XCTAssertFalse(generation.accepts(queued))
    }

    func testWorkQueuedBetweenSessionsRunsInNeither() {
        let generation = SDKSessionGeneration()
        generation.begin()
        generation.end()
        let queued = generation.current
        XCTAssertFalse(generation.accepts(queued), "a stopped session ran it")
        generation.begin()
        XCTAssertFalse(generation.accepts(queued), "the next session ran it")
    }

    // MARK: The session

    /// The review's case: a queued `.running` reaching `handle` after `stop()`
    /// found no widget and no load under way, and began loading again.
    func testARunningStateQueuedBeforeStopDoesNotRestartTheStoppedSession() async {
        let session = SDKSession()
        let status = session.status
        session.pointrStateDidChange(to: .running)
        session.stop()
        await runQueuedWork()
        XCTAssertFalse(session.isLoadingBuilding, "the stopped session began loading a building")
        XCTAssertEqual(session.status, status, "the stopped session took the old state")
    }

    func testARunningStateQueuedBeforeARetryDoesNotReachTheNewSession() async {
        let session = SDKSession()
        session.pointrStateDidChange(to: .running)
        session.retry(loadConfiguration: missingConfiguration)
        await runQueuedWork()
        XCTAssertFalse(session.isLoadingBuilding, "the retried session began loading on the old session's state")
        XCTAssertEqual(session.status, "Connecting to Design-QA…", "the retried session took the old state")
    }

    func testAMapLoadedBeforeStopDoesNotMarkTheStoppedSessionReady() async {
        let session = SDKSession()
        session.mapDidEndLoading(PTRMapViewController())
        session.stop()
        await runQueuedWork()
        XCTAssertNotEqual(session.status, "Ready")
    }

    func testAMapErrorFromBeforeARetryDoesNotFailTheNewSession() async {
        let session = SDKSession()
        session.map(PTRMapViewController(), didFailToLoadWith: NSError(domain: "test", code: 1))
        session.retry(loadConfiguration: missingConfiguration)
        await runQueuedWork()
        XCTAssertEqual(session.failure, "QA configuration is missing or invalid. Run the local setup script.",
                       "the old map's error replaced the new session's own state")
    }

    // MARK: A contact action's outcome

    private let dunkin = SDKCardIdentity(poiId: "dunkin", serial: 1)
    private let loading: [String: KozmosPOIActionState] = ["call": .init(loading: true)]

    func testAContactOutcomeLandsOnTheCardItWasTriedOn() {
        let states = SDKContactOutcome.completing(loading, action: "call", opened: false, triedOn: dunkin, showing: dunkin)
        XCTAssertEqual(states["call"], KozmosPOIActionState(message: "That couldn't be opened.", messageTone: .error))
        XCTAssertEqual(SDKContactOutcome.completing(loading, action: "call", opened: true, triedOn: dunkin, showing: dunkin)["call"], KozmosPOIActionState())
    }

    /// The call was tried on Dunkin'; the visitor has opened Alamo since.
    func testAContactOutcomeForAPlaceNoLongerShownIsDropped() {
        let alamo = SDKCardIdentity(poiId: "alamo", serial: 2)
        let alamosStates: [String: KozmosPOIActionState] = [:]
        XCTAssertEqual(SDKContactOutcome.completing(alamosStates, action: "call", opened: false, triedOn: dunkin, showing: alamo), [:])
        XCTAssertEqual(SDKContactOutcome.completing(alamosStates, action: "call", opened: false, triedOn: dunkin, showing: nil), [:])
    }

    /// Closed and opened again: a new card, which never tried the call.
    func testAContactOutcomeForAnEarlierOpeningOfTheSamePlaceIsDropped() {
        let reopened = SDKCardIdentity(poiId: "dunkin", serial: 3)
        XCTAssertEqual(SDKContactOutcome.completing([:], action: "call", opened: false, triedOn: dunkin, showing: reopened), [:])
    }
}
