import Foundation
import Kozmos

/// Which session the SDK's callbacks belong to. PointrKit calls its listeners
/// on its own threads, and the session queues their work onto the main actor;
/// removing a listener stops new calls but not work already queued. Each
/// callback takes the token current when the SDK called, and its work asks
/// `accepts` when it runs.
///
/// Readable from any thread: the counter sits behind a lock.
final class SDKSessionGeneration: @unchecked Sendable {
    /// A session's identity, or the stopped state between sessions.
    struct Token: Equatable, Sendable {
        fileprivate let value: Int
        fileprivate let live: Bool
    }

    private let lock = NSLock()
    private var value = 0
    private var live = false

    /// The token work queued now carries.
    var current: Token {
        lock.lock()
        defer { lock.unlock() }
        return Token(value: value, live: live)
    }

    /// A session starts; its token is the current one.
    @discardableResult
    func begin() -> Token {
        lock.lock()
        defer { lock.unlock() }
        value += 1
        live = true
        return Token(value: value, live: live)
    }

    /// The session stops; no token is live until the next begins.
    func end() {
        lock.lock()
        defer { lock.unlock() }
        value += 1
        live = false
    }

    /// Whether work queued under `token` may still run: only in the session
    /// it was queued in, and only while that session is running. Work queued
    /// before a stop, before a retry, or between the two is refused; a
    /// `started` flag alone would let the retried session take an old
    /// session's work.
    func accepts(_ token: Token) -> Bool {
        token.live && token == current
    }
}

/// One opening of a place's card: the place, and which time it was opened.
/// Closing a card and opening the same place again is another card.
struct SDKCardIdentity: Equatable {
    let poiId: String
    let serial: Int
}

/// Where a contact action's outcome goes once the device has tried the
/// address.
enum SDKContactOutcome {
    /// The card's action states with the outcome of `action`, tried on
    /// `card`, written in, if that card is still the one showing. Opening a
    /// website, a call or an email returns later; by then the visitor may have
    /// opened another place, or closed this one and opened it again, and that
    /// card never tried the action.
    static func completing(
        _ states: [String: KozmosPOIActionState], action: String, opened: Bool,
        triedOn card: SDKCardIdentity, showing current: SDKCardIdentity?
    ) -> [String: KozmosPOIActionState] {
        guard current == card else { return states }
        var next = states
        next[action] = opened ? .init() : .init(message: "That couldn't be opened.", messageTone: .error)
        return next
    }
}
