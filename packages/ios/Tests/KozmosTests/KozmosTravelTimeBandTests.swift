import XCTest
@testable import Kozmos

/// Decision 50 (Olcay, 2026-09-28): the product passes the walking time it
/// already has, and Kozmos owns the rule that turns it into a band. The rule
/// is written three times, once per platform, so the cases are written once:
/// packages/product-contracts/tests/travel-time-bands.txt, which the web and
/// Compose suites read too.
final class KozmosTravelTimeBandTests: XCTestCase {
    private struct Case {
        let line: Int
        let text: String
        let seconds: Double
        let band: KozmosTravelTimeBand?
    }

    /// The shared table, found by walking up from this file to the repository.
    private func cases() throws -> [Case] {
        var directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        var table: URL?
        while directory.path != "/" {
            let candidate = directory
                .appendingPathComponent("packages/product-contracts/tests/travel-time-bands.txt")
            if FileManager.default.fileExists(atPath: candidate.path) {
                table = candidate
                break
            }
            directory.deleteLastPathComponent()
        }
        let source = try String(
            contentsOf: try XCTUnwrap(table, "no travel-time-bands.txt above \(#filePath)"),
            encoding: .utf8
        )
        var cases: [Case] = []
        for (index, raw) in source.components(separatedBy: "\n").enumerated() {
            let line = String(raw.prefix { $0 != "#" }).trimmingCharacters(in: .whitespaces)
            if line.isEmpty { continue }
            let fields = line.split(whereSeparator: { $0 == " " || $0 == "\t" }).map(String.init)
            guard fields.count == 2, let seconds = Double(fields[0]) else {
                XCTFail("travel-time-bands.txt:\(index + 1) reads \"\(raw)\"")
                continue
            }
            var band: KozmosTravelTimeBand?
            if fields[1] != "none" {
                guard let named = KozmosTravelTimeBand(rawValue: fields[1]) else {
                    XCTFail("travel-time-bands.txt:\(index + 1) names no band: \"\(raw)\"")
                    continue
                }
                band = named
            }
            cases.append(Case(line: index + 1, text: fields[0], seconds: seconds, band: band))
        }
        return cases
    }

    func testTheTableNamesEveryBandAndAWalkWithNone() throws {
        let named = try cases().map { $0.band?.rawValue ?? "none" }
        let missing = (KozmosTravelTimeBand.allCases.map(\.rawValue) + ["none"])
            .filter { !named.contains($0) }
        XCTAssertEqual(missing, [])
    }

    func testEveryWalkInTheTableFallsInTheTablesBand() throws {
        let wrong = try cases().compactMap { entry -> String? in
            let got = KozmosTravelTimeBand(durationSeconds: entry.seconds)
            guard got != entry.band else { return nil }
            return "line \(entry.line): \(entry.text) s read \(got?.rawValue ?? "none"), not \(entry.band?.rawValue ?? "none")"
        }
        XCTAssertEqual(wrong, [])
    }

    func testEachBandKeepsItsUpperEdgeAndGivesTheNextSecondToTheNextBand() {
        // The question for Olcay, as behaviour: a place 2 minutes away reads
        // "1–2 min"; 2 min 1 s reads "2–5 min".
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 59), .nearby)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 60), .oneToTwoMinutes)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 120), .oneToTwoMinutes)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 121), .twoToFiveMinutes)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 300), .twoToFiveMinutes)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 301), .fiveToTenMinutes)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 600), .fiveToTenMinutes)
        XCTAssertEqual(KozmosTravelTimeBand(durationSeconds: 601), .moreThanTenMinutes)
    }

    func testEveryWalkUpToTwentyMinutesFallsInExactlyOneBandNearestFirst() {
        // A quarter of a second at a time: no walk falls in none, and the
        // bands never come back, so each is one unbroken stretch in order.
        let order = KozmosTravelTimeBand.allCases
        var gaps: [Double] = []
        var backwards: [String] = []
        var previous = 0
        for quarter in 0...(20 * 60 * 4) {
            let seconds = Double(quarter) / 4
            guard let band = KozmosTravelTimeBand(durationSeconds: seconds) else {
                gaps.append(seconds)
                continue
            }
            let at = order.firstIndex(of: band)!
            if at < previous { backwards.append("\(seconds) s reads \(band) after \(order[previous])") }
            previous = max(previous, at)
        }
        XCTAssertEqual(Array(gaps.prefix(5)), [])
        XCTAssertEqual(Array(backwards.prefix(5)), [])
        XCTAssertEqual(previous, order.count - 1)
    }

    func testNearbyIsDrawnInTheSuccessToneAndEveryOtherBandNeutral() {
        XCTAssertEqual(
            Dictionary(uniqueKeysWithValues: KozmosTravelTimeBand.allCases.map { ($0.rawValue, $0.tone) }),
            [
                "nearby": .success,
                "oneToTwoMinutes": .neutral,
                "twoToFiveMinutes": .neutral,
                "fiveToTenMinutes": .neutral,
                "moreThanTenMinutes": .neutral
            ]
        )
    }

    func testTheBandsAndTonesCarryTheWebsWireValues() {
        // Compared against the web by `pnpm contracts:parity:check`; asserted
        // here, in order, so a case cannot be renamed on this platform alone.
        XCTAssertEqual(
            KozmosTravelTimeBand.allCases.map(\.rawValue),
            ["nearby", "oneToTwoMinutes", "twoToFiveMinutes", "fiveToTenMinutes", "moreThanTenMinutes"]
        )
        XCTAssertEqual(KozmosTravelTimeTone.allCases.map(\.rawValue), ["success", "neutral"])
    }

    func testAnEstimateCarriesItsBandAndOneWithoutStillDecodes() throws {
        XCTAssertNil(KozmosTravelEstimatePresentation(durationSeconds: 45, durationLabel: "1 min").band)
        // A payload written before the band existed reads as it did.
        let before = try JSONDecoder().decode(
            KozmosTravelEstimatePresentation.self,
            from: Data(#"{"durationSeconds": 45, "durationLabel": "1 min"}"#.utf8)
        )
        XCTAssertNil(before.band)
        let banded = try JSONDecoder().decode(
            KozmosTravelEstimatePresentation.self,
            from: Data(#"{"durationSeconds": 45, "durationLabel": "1 min", "band": "nearby"}"#.utf8)
        )
        XCTAssertEqual(banded.band, .nearby)
        XCTAssertEqual(banded.durationLabel, "1 min")
        XCTAssertEqual(
            try JSONDecoder().decode(KozmosTravelEstimatePresentation.self, from: JSONEncoder().encode(banded)),
            banded
        )
    }

    func testSelectingKeepsTheEstimatesBand() {
        let result = KozmosPOIResultPresentation(
            poiId: "p",
            resultIndex: 0,
            travelEstimate: KozmosTravelEstimatePresentation(
                durationSeconds: 45,
                durationLabel: "1 min",
                band: KozmosTravelTimeBand(durationSeconds: 45)
            )
        )
        XCTAssertEqual(result.selecting("p").travelEstimate?.band, .nearby)
    }
}
