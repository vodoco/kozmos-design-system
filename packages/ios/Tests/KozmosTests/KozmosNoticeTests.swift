import XCTest
import SwiftUI
@testable import Kozmos

/// GAP-142, GAP-160 and GAP-033: React's Notice on SwiftUI, with the success
/// tone, the progress and done states, and its action under the text.
final class KozmosNoticeTests: XCTestCase {
    typealias A = KozmosNoticeAppearance

    // MARK: Tones

    func testEachToneDrawsToastsMark() {
        XCTAssertEqual(KozmosNoticeTone.allCases, [.warning, .info, .critical, .success])
        XCTAssertEqual(KozmosNoticeTone.warning.markName, "alert-triangle")
        XCTAssertEqual(KozmosNoticeTone.info.markName, "info-circle")
        XCTAssertEqual(KozmosNoticeTone.critical.markName, "alert-circle")
        XCTAssertEqual(KozmosNoticeTone.success.markName, "check")
        for tone in KozmosNoticeTone.allCases {
            XCTAssertTrue(KozmosIcon.drawsArtwork(for: tone.markName), "\(tone)'s mark has no artwork")
        }
    }

    /// The edge is half the tone's fill, critical's 60%, on a 5% wash; the
    /// words are the emotion's text role, as React's classes.
    @MainActor
    func testEachToneTakesItsEmotionsColours() throws {
        let pairs: [(KozmosNoticeTone, Color, Color)] = [
            (.warning, KozmosColors.primitivesColorsEmotionalAlert800, KozmosColors.semanticsEmotionAlertText),
            (.info, KozmosColors.primitivesColorsEmotionalInfo700, KozmosColors.semanticsEmotionInformativeText),
            (.critical, KozmosColors.primitivesColorsEmotionalDanger600, KozmosColors.semanticsEmotionDangerText),
            (.success, KozmosColors.primitivesColorsEmotionalSuccess800, KozmosColors.semanticsEmotionSuccessText),
        ]
        for (tone, fill, ink) in pairs {
            for scheme in [ColorScheme.light, .dark] {
                let want = try DrawnPixels.resolved(fill, in: scheme)
                let got = try DrawnPixels.resolved(tone.fill, in: scheme)
                XCTAssertEqual([want.r, want.g, want.b], [got.r, got.g, got.b], "\(tone) fill, \(scheme)")
                let wantInk = try DrawnPixels.resolved(ink, in: scheme)
                let gotInk = try DrawnPixels.resolved(tone.ink, in: scheme)
                XCTAssertEqual([wantInk.r, wantInk.g, wantInk.b], [gotInk.r, gotInk.g, gotInk.b], "\(tone) ink, \(scheme)")
            }
        }
        XCTAssertEqual(KozmosNoticeTone.warning.edgeOpacity, 0.5)
        XCTAssertEqual(KozmosNoticeTone.success.edgeOpacity, 0.5)
        XCTAssertEqual(KozmosNoticeTone.critical.edgeOpacity, 0.6)
        XCTAssertEqual(KozmosNoticeTone.washOpacity, 0.05)
    }

    // MARK: Marks

    func testWithNoStatusTheMarkIsTheTonesTheCallersOrNone() {
        XCTAssertEqual(A(tone: .success, status: nil, icon: .tone),
                       A(lead: .toneMark("check"), trailingCheck: false, busy: false))
        XCTAssertEqual(A(tone: .info, status: nil, icon: .named("stars-01")),
                       A(lead: .named("stars-01"), trailingCheck: false, busy: false))
        let none = A(tone: .info, status: nil, icon: .none)
        XCTAssertEqual(none, A(lead: .none, trailingCheck: false, busy: false))
        // No mark, no column.
        XCTAssertFalse(none.drawsLead)
    }

    /// In progress the loading arc turns where the mark is, whatever the
    /// icon, and the notice is busy.
    func testInProgressTheArcTakesTheMarksPlaceAndItIsBusy() {
        for icon in [KozmosNoticeIcon.tone, .none, .named("stars-01")] {
            let a = A(tone: .info, status: .progress, icon: icon)
            XCTAssertEqual(a, A(lead: .spinner, trailingCheck: false, busy: true))
            XCTAssertTrue(a.drawsLead)
        }
    }

    /// Done ends the summary in a check, with no mark at its start unless the
    /// product gave one: "Geometry is set".
    func testDoneEndsInACheckAndKeepsOnlyACallersMark() {
        XCTAssertEqual(A(tone: .success, status: .done, icon: .tone),
                       A(lead: .none, trailingCheck: true, busy: false))
        XCTAssertEqual(A(tone: .success, status: .done, icon: .none),
                       A(lead: .none, trailingCheck: true, busy: false))
        XCTAssertEqual(A(tone: .success, status: .done, icon: .named("map-01")),
                       A(lead: .named("map-01"), trailingCheck: true, busy: false))
    }

    // MARK: Announced

    func testItIsAnnouncedPolitelyUnlessAsked() {
        typealias N = KozmosNotice<EmptyView>
        XCTAssertEqual(N.announcement("Geometry is set", live: .polite),
                       KozmosNoticeAnnouncement(message: "Geometry is set", queued: true))
        XCTAssertEqual(N.announcement("Call 112", live: .assertive),
                       KozmosNoticeAnnouncement(message: "Call 112", queued: false))
        XCTAssertNil(N.announcement("Geometry is set", live: .off))
        XCTAssertNil(N.announcement("", live: .polite))
    }

    // MARK: Drawn

    @MainActor
    private func draw<V: View>(_ view: V, direction: LayoutDirection = .leftToRight) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view.frame(width: 320)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light),
            scale: 2
        )
    }

    /// The action is drawn under the text in every state: a notice with
    /// one is taller by the action and its 12 than one without.
    @MainActor
    func testTheActionIsDrawnUnderTheTextInEveryState() throws {
        for status in [nil, KozmosNoticeStatus.progress, .done] {
            let without = try draw(KozmosNotice("Set Geometry", tone: .warning, status: status))
            let with = try draw(KozmosNotice("Set Geometry", tone: .warning, status: status) {
                Rectangle().fill(Color(red: 1, green: 0, blue: 1)).frame(width: 120, height: 32)
            })
            XCTAssertEqual(CGFloat(with.height - without.height) / with.scale, 32 + 12, accuracy: 1,
                           "status \(String(describing: status))")
            // The action starts under the summary, after the mark's column.
            let magenta = DrawnPixels.matches((255, 0, 255, 255), tolerance: 10)
            let action = try XCTUnwrap(with.boundingBox(where: magenta))
            XCTAssertEqual(action.height, 32, accuracy: 1)
            XCTAssertEqual(action.minX, status == .done ? 12 : 12 + 16 + 8, accuracy: 1)
        }
    }

    /// The done check sits at the inline end: on the left, right to left.
    @MainActor
    func testTheDoneCheckIsAtTheInlineEnd() throws {
        let ink = try DrawnPixels.resolved(KozmosColors.semanticsEmotionSuccessText, in: .light)
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let drawn = try draw(KozmosNotice("Set", tone: .success, status: .done), direction: direction)
            let width = CGFloat(drawn.width) / drawn.scale
            // The rightmost (or leftmost) 28 points hold the check.
            let end = direction == .leftToRight
                ? CGRect(x: width - 30, y: 0, width: 30, height: 36)
                : CGRect(x: 0, y: 0, width: 30, height: 36)
            XCTAssertGreaterThan(drawn.count(in: end, where: DrawnPixels.matches(ink, tolerance: 40)), 0,
                                 "no check at the inline end, \(direction)")
        }
    }
}
