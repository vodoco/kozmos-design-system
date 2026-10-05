import Foundation

/// The destination Kozmos puts behind a link, or nil to show the text unlinked.
/// One rule for every link it draws (MapAttribution's credits, MapInfoPanel's
/// entries), as on the web and Android: http or https with a host, and, where a
/// contact link belongs, mailto or tel with a target; no credentials
/// (`https://maps.example@evil.example` reads as one host and goes to another);
/// no whitespace or control characters. Until 2026-10-04 the credits checked
/// only the scheme and host.
enum KozmosSafeLink {
    static func destination(_ href: String?, contact: Bool = false) -> URL? {
        guard let href, !href.unicodeScalars.contains(where: { $0.value <= 32 }),
              let url = URL(string: href), url.user == nil, url.password == nil else { return nil }
        let scheme = url.scheme?.lowercased() ?? ""
        if ["http", "https"].contains(scheme), let host = url.host, !host.isEmpty { return url }
        if contact, ["mailto", "tel"].contains(scheme), !url.path.isEmpty { return url }
        return nil
    }
}
