import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// GAP-194: content or a footer that is the card's first child pays the top.
///
/// `KozmosCardContent` and `KozmosCardFooter` pad their sides and bottom
/// only, because a header above them has already paid the top. With no
/// header, the content (or a footer alone) touched the card's top edge: a
/// site card's name sat on its border. The card now pays its padding above
/// its first subview when that is content or a footer, 24 by default and 16
/// compact, as React's card has since #421.
///
/// Measured, in a window, from where each part's content starts — a block,
/// the probe, as wide as the part gives it — to the card's edges. Then held
/// to a `VStack` drawing the same subviews, which is what the card was: a
/// header-led card lays out exactly as before, whatever it is offered.
final class KozmosCardColumnTests: XCTestCase {
    #if os(iOS)
    private let paddings: [(KozmosCardPadding, CGFloat)] = [(.default, 24), (.compact, 16)]

    // MARK: - The top, measured

    /// A header pays its own top; content and a footer under it pay none,
    /// as before.
    @MainActor func testAHeaderLedCardIsDrawnAsBefore() async throws {
        for (padding, p) in paddings {
            let read = try await measure {
                KozmosCard(padding: padding) {
                    KozmosCardHeader { Probe("header") }
                    KozmosCardContent { Probe("content") }
                    KozmosCardFooter { Probe("footer") }
                }
            }
            let state = "\(padding)"
            XCTAssertEqual(read.inset("header").top, p, state)
            XCTAssertEqual(read["content"].minY - read["header"].maxY, p, accuracy: 0.5, "the content pays no top: \(state)")
            XCTAssertEqual(read["footer"].minY - read["content"].maxY, p, accuracy: 0.5, "the footer pays no top: \(state)")
            XCTAssertEqual(read.inset("footer").bottom, p, state)
            for part in ["header", "content", "footer"] {
                XCTAssertEqual(read.inset(part).leading, p, "\(part): \(state)")
                XCTAssertEqual(read.inset(part).trailing, p, "\(part): \(state)")
            }
            XCTAssertEqual(read["card"].height, 3 * 20 + 4 * p, accuracy: 0.5, state)
        }
    }

    /// Content alone pays the top, as well as its sides and bottom.
    @MainActor func testContentAlonePaysTheTop() async throws {
        for (padding, p) in paddings {
            let read = try await measure {
                KozmosCard(padding: padding) { KozmosCardContent { Probe("content") } }
            }
            XCTAssertEqual(read.inset("content"), Inset(top: p, leading: p, trailing: p, bottom: p), "\(padding)")
        }
    }

    /// Content above a footer: the content pays the top, the footer none.
    @MainActor func testContentAboveAFooterPaysTheTopOnce() async throws {
        for (padding, p) in paddings {
            let read = try await measure {
                KozmosCard(padding: padding) {
                    KozmosCardContent { Probe("content") }
                    KozmosCardFooter { Probe("footer") }
                }
            }
            let state = "\(padding)"
            XCTAssertEqual(read.inset("content").top, p, state)
            XCTAssertEqual(read["footer"].minY - read["content"].maxY, p, accuracy: 0.5, "the footer pays no top: \(state)")
            XCTAssertEqual(read.inset("footer").bottom, p, state)
            XCTAssertEqual(read.inset("footer").leading, p, state)
            XCTAssertEqual(read.inset("footer").trailing, p, state)
        }
    }

    /// A footer alone pays the top.
    @MainActor func testAFooterAlonePaysTheTop() async throws {
        for (padding, p) in paddings {
            let read = try await measure {
                KozmosCard(padding: padding) { KozmosCardFooter { Probe("footer") } }
            }
            XCTAssertEqual(read.inset("footer"), Inset(top: p, leading: p, trailing: p, bottom: p), "\(padding)")
        }
    }

    /// The parts inside a wrapper are not the card's subviews: a header-led
    /// wrapper (Card's Header and Full Code Connect examples) is drawn as
    /// before, and content alone in one is left alone, as React leaves a
    /// part inside a `form`.
    @MainActor func testAPartInsideAWrapperIsLeftAlone() async throws {
        for (padding, p) in paddings {
            let led = try await measure {
                KozmosCard(padding: padding) {
                    VStack(alignment: .leading, spacing: 0) {
                        KozmosCardHeader { Probe("header") }
                        KozmosCardContent { Probe("content") }
                    }
                }
            }
            XCTAssertEqual(led.inset("header").top, p, "\(padding)")
            XCTAssertEqual(led["content"].minY - led["header"].maxY, p, accuracy: 0.5, "\(padding)")
            let alone = try await measure {
                KozmosCard(padding: padding) {
                    VStack(alignment: .leading, spacing: 0) { KozmosCardContent { Probe("content") } }
                }
            }
            XCTAssertEqual(alone.inset("content").top, 0, "\(padding)")
        }
    }

    /// A view before the part is the card's first subview, and the part is
    /// not: the MAP-64 boards' 16pt spacer keeps its 16 until it goes.
    @MainActor func testAViewBeforeThePartKeepsItFromBeingFirst() async throws {
        let read = try await measure {
            KozmosCard {
                Color.clear.frame(height: 16)
                KozmosCardContent { Probe("content") }
            }
        }
        XCTAssertEqual(read.inset("content").top, 16)
    }

    /// A caller's padding on a part is applied outside it, as on its sides:
    /// it adds to the top the card pays rather than replacing it. So a top
    /// padding a product put on header-less content to work round GAP-194
    /// now doubles, and goes (the changelog's migration).
    @MainActor func testACallersPaddingAddsOutsideThePart() async throws {
        let read = try await measure {
            KozmosCard { KozmosCardContent { Probe("content") }.padding(.top, 8).padding(.leading, 4) }
        }
        XCTAssertEqual(read.inset("content"), Inset(top: 24 + 8, leading: 24 + 4, trailing: 24, bottom: 24))
    }

    /// What a ViewBuilder makes of the parts does not hide them: a part in a
    /// Group, an `if`, a ForEach or an AnyView (Card's Basic Code Connect
    /// example) is still the card's first subview.
    @MainActor func testThePartIsFirstHoweverItIsBuilt() async throws {
        let shown = true
        let builds: [(String, AnyView)] = [
            ("Group", AnyView(KozmosCard { Group { KozmosCardContent { Probe("content") } } })),
            ("if", AnyView(KozmosCard { if shown { KozmosCardContent { Probe("content") } } })),
            ("ForEach", AnyView(KozmosCard { ForEach(0..<1, id: \.self) { _ in KozmosCardContent { Probe("content") } } })),
            ("AnyView", AnyView(KozmosCard { AnyView(KozmosCardContent { Probe("content") }) })),
        ]
        for (name, card) in builds {
            let read = try await measure { card }
            XCTAssertEqual(read.inset("content").top, 24, name)
        }
    }

    /// A card in a card's content reads only its own subviews: the outer
    /// content pays the outer top, the inner header-led card's content none.
    @MainActor func testANestedCardTakesNothingFromTheOuterOne() async throws {
        let read = try await measure {
            KozmosCard {
                KozmosCardContent {
                    Probe("outer")
                    KozmosCard {
                        KozmosCardHeader { Probe("inner-header") }
                        KozmosCardContent { Probe("inner-content") }
                    }
                }
            }
        }
        XCTAssertEqual(read.inset("outer").top, 24)
        XCTAssertEqual(read["inner-content"].minY - read["inner-header"].maxY, 24, accuracy: 0.5)
    }

    /// Offered a height, a header-less card shares it out below the top:
    /// a spacer between the content and the footer takes what is left, and
    /// the footer keeps its bottom.
    @MainActor func testAHeaderlessCardOfAGivenHeightKeepsItsTopAndBottom() async throws {
        let read = try await measure {
            KozmosCard {
                KozmosCardContent { Probe("content") }
                Spacer(minLength: 0)
                KozmosCardFooter { Probe("footer") }
            }
            .frame(height: 300)
        }
        XCTAssertEqual(read["card"].height, 300, accuracy: 0.5)
        XCTAssertEqual(read.inset("content").top, 24)
        XCTAssertEqual(read.inset("footer").bottom, 24)
    }

    // MARK: - Drawn as the VStack it was

    /// The card lays its subviews out as `VStack(alignment: .leading,
    /// spacing: 0)` did, below the top it pays: offered its ideal height, a
    /// fixed one, too little, with a spacer, a flexible part, a part of
    /// higher priority, text that wraps, and subviews of their own widths.
    /// Each shape is drawn twice, as a card and as that VStack under the
    /// top (none for a header-led card), and every probe, and the card,
    /// sits where the VStack put it.
    @MainActor func testItLaysOutAsTheVStackItWas() async throws {
        let words = "Terminal B's parking is open again from six, with step-free access from level 2."
        let shapes: [(name: String, height: CGFloat?, leads: Bool, probes: [String], content: AnyView)] = [
            ("header-led", nil, false, ["a", "b", "c"], AnyView(Group {
                KozmosCardHeader { Probe("a") }
                KozmosCardContent { Probe("b") }
                KozmosCardFooter { Probe("c") }
            })),
            ("header-led, given a height, with a spacer", 400, false, ["a", "b", "c"], AnyView(Group {
                KozmosCardHeader { Probe("a") }
                KozmosCardContent { Probe("b") }
                Spacer()
                KozmosCardFooter { Probe("c") }
            })),
            ("header-less, given a height, a flexible content", 300, true, ["b", "c"], AnyView(Group {
                KozmosCardContent { Color.blue.frame(minHeight: 10, maxHeight: .infinity).measured("b") }
                KozmosCardFooter { Probe("c") }
            })),
            ("header-led, too little height, priority to the content", 120, false, ["a", "b", "c"], AnyView(Group {
                KozmosCardHeader { Text(words).measured("a") }
                KozmosCardContent { Text(words).measured("b") }.layoutPriority(1)
                KozmosCardFooter { Text(words).measured("c") }
            })),
            ("header-less, text that wraps", nil, true, ["b", "c"], AnyView(Group {
                KozmosCardContent { Text(words).measured("b") }
                KozmosCardFooter { Text(words).measured("c") }
            })),
            ("subviews of their own widths", nil, false, ["a", "b", "c"], AnyView(Group {
                KozmosCardHeader { Probe("a").frame(width: 60) }
                Color.blue.frame(width: 100, height: 20).measured("b")
                KozmosCardFooter { Probe("c").frame(width: 30) }
            })),
        ]
        for shape in shapes {
            for (padding, p) in paddings {
                let top = shape.leads ? p : 0
                let card = try await measure(height: shape.height) {
                    KozmosCard(padding: padding) { shape.content }
                }
                let stack = try await measure(height: shape.height) {
                    VStack(alignment: .leading, spacing: 0) { shape.content }
                        .padding(.top, top)
                        .environment(\.kozmosCardPadding, padding)
                }
                let state = "\(shape.name), \(padding)"
                XCTAssertEqual(card["card"].size.width, stack["card"].size.width, accuracy: 0.5, "the card's width: \(state)")
                XCTAssertEqual(card["card"].size.height, stack["card"].size.height, accuracy: 0.5, "the card's height: \(state)")
                for probe in shape.probes {
                    XCTAssertNotNil(card.frames[probe], "\(probe) was not drawn in the card: \(state)")
                    XCTAssertNotNil(stack.frames[probe], "\(probe) was not drawn in the VStack: \(state)")
                    let drawn = card.relative(probe), was = stack.relative(probe)
                    XCTAssertEqual(drawn.minX, was.minX, accuracy: 0.5, "\(probe)'s x: \(state)")
                    XCTAssertEqual(drawn.minY, was.minY, accuracy: 0.5, "\(probe)'s y: \(state)")
                    XCTAssertEqual(drawn.width, was.width, accuracy: 0.5, "\(probe)'s width: \(state)")
                    XCTAssertEqual(drawn.height, was.height, accuracy: 0.5, "\(probe)'s height: \(state)")
                }
            }
        }
    }

    /// Beside text aligned by its first baseline, and under text in a stack
    /// with the system's spacing, a card sits where the VStack sat.
    @MainActor func testItSitsAmongOtherViewsAsTheVStackDid() async throws {
        func row<Card: View>(_ card: Card) -> some View {
            VStack {
                Text("Above").measured("above")
                HStack(alignment: .firstTextBaseline) {
                    Text("Beside").measured("beside")
                    card.measured("card")
                }
            }
        }
        let content = Group {
            KozmosCardHeader { KozmosCardTitle("Terminal B") }
            KozmosCardContent { Text("Open from six") }
        }
        let card = try await measure(framed: false) { row(KozmosCard { content }) }
        let stack = try await measure(framed: false) { row(VStack(alignment: .leading, spacing: 0) { content }) }
        for name in ["above", "beside", "card"] {
            XCTAssertEqual(card[name].minY, stack[name].minY, accuracy: 0.5, name)
            XCTAssertEqual(card[name].minX, stack[name].minX, accuracy: 0.5, name)
        }
    }

    // MARK: - Measuring

    private struct Inset: Equatable, CustomStringConvertible {
        var top: CGFloat?, leading: CGFloat?, trailing: CGFloat?, bottom: CGFloat?
        var description: String { "top \(top.map { "\($0)" } ?? "-"), leading \(leading.map { "\($0)" } ?? "-"), trailing \(trailing.map { "\($0)" } ?? "-"), bottom \(bottom.map { "\($0)" } ?? "-")" }
    }

    private struct Frames {
        let frames: [String: CGRect]
        subscript(_ name: String) -> CGRect { frames[name] ?? .null }
        /// A probe's frame from the card's top leading corner.
        func relative(_ name: String) -> CGRect {
            self[name].offsetBy(dx: -self["card"].minX, dy: -self["card"].minY)
        }
        /// How far a probe is from each of the card's edges, rounded to the
        /// half point.
        func inset(_ name: String) -> Inset {
            let card = self["card"], probe = self[name]
            let round = { (value: CGFloat) in (value * 2).rounded() / 2 }
            return Inset(top: round(probe.minY - card.minY), leading: round(probe.minX - card.minX),
                         trailing: round(card.maxX - probe.maxX), bottom: round(card.maxY - probe.maxY))
        }
    }

    /// Lays `content` out in a window, 320pt wide (and `height` tall, when
    /// given), and reads back every frame reported by `measured`; the card,
    /// unless `framed` is false, is "card".
    @MainActor private func measure<V: View>(height: CGFloat? = nil, framed: Bool = true,
                                            @ViewBuilder _ content: () -> V) async throws -> Frames {
        let box = FramesBox()
        let laid = Group {
            if framed { content().measured("card").frame(height: height) } else { content() }
        }
        .frame(width: 320)
        .fixedSize(horizontal: false, vertical: height == nil)
        .coordinateSpace(name: "root")
        .onPreferenceChange(FramesKey.self) { box.frames = $0 }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: laid)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 200_000_000)
        let frames = Frames(frames: box.frames)
        if framed { XCTAssertNotNil(frames.frames["card"], "nothing was laid out") }
        return frames
    }
    #endif
}

#if os(iOS)
/// Where the frames a layout reported land.
private final class FramesBox { var frames: [String: CGRect] = [:] }

private struct FramesKey: PreferenceKey {
    static var defaultValue: [String: CGRect] = [:]
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue()) { $1 }
    }
}

private extension View {
    /// Reports this view's frame, in the window's laid-out root, as `name`.
    func measured(_ name: String) -> some View {
        background(GeometryReader { proxy in
            Color.clear.preference(key: FramesKey.self, value: [name: proxy.frame(in: .named("root"))])
        })
    }
}

/// Where a part's content starts: a 20pt block as wide as the part gives it.
private struct Probe: View {
    let name: String
    init(_ name: String) { self.name = name }
    var body: some View { Color.blue.frame(height: 20).measured(name) }
}
#endif
