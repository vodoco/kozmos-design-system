import Darwin
import SwiftUI
import XCTest

@testable import Kozmos

/// With no tracker in the environment, an event goes to the console as
/// `[Kozmos Analytics] <component> -> <eventName>`, the line Compose's
/// `LocalKozmosAnalytics` default prints. Until 17 Oct the Swift string escaped
/// its interpolations, so every event printed
/// `[Kozmos Analytics] \(event.component) -> \(event.eventName)`, word for word.
final class KozmosAnalyticsDefaultTrackerTests: XCTestCase {
    private let event = KozmosAnalyticsEvent(
        eventName: "location_pin_clicked", component: "LocationPin", properties: ["number": 3])

    func testTheLogLineNamesTheComponentAndTheEvent() {
        XCTAssertEqual(
            KozmosAnalyticsKey.logLine(for: event),
            "[Kozmos Analytics] LocationPin -> location_pin_clicked")
    }

    /// The default tracker prints that line, read back from standard output.
    func testTheDefaultTrackerPrintsTheLogLine() throws {
        let printed = try standardOutput { KozmosAnalyticsKey.defaultValue(event) }
        XCTAssertTrue(
            printed.contains("[Kozmos Analytics] LocationPin -> location_pin_clicked\n"),
            "the default tracker printed \(printed.debugDescription)")
        XCTAssertFalse(printed.contains("\\("), "printed an interpolation as text: \(printed.debugDescription)")
    }

    /// What `body` writes to standard output while it runs.
    private func standardOutput(_ body: () -> Void) throws -> String {
        let pipe = Pipe()
        fflush(stdout)
        let saved = dup(STDOUT_FILENO)
        guard saved >= 0, dup2(pipe.fileHandleForWriting.fileDescriptor, STDOUT_FILENO) >= 0 else {
            XCTFail("standard output could not be redirected")
            return ""
        }
        body()
        fflush(stdout)
        dup2(saved, STDOUT_FILENO)
        close(saved)
        try pipe.fileHandleForWriting.close()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(decoding: data, as: UTF8.self)
    }
}
