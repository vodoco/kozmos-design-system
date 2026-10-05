import SwiftUI

public struct KozmosUserLocationMarker: View {
    public let heading: Double
    public let showHeading: Bool
    public let compact: Bool
    /// What the marker is called, for a visitor who cannot see it. It had no
    /// name until row 67, so VoiceOver passed over the visitor's own position;
    /// React's was "User location" in English whatever the device's language.
    public let label: String

    /// One full expand-and-fade of the pulse, in seconds.
    private static let pulsePeriod: Double = 1.5

    public init(heading: Double = 0, showHeading: Bool = true, label: String = "User location", compact: Bool = false) {
        self.heading = heading
        self.showHeading = showHeading
        self.label = label
        self.compact = compact
    }

    public var body: some View {
        ZStack {
            // Pulsing background.
            //
            // Driven from the timeline rather than a `repeatForever` animation
            // on `@State` set in `onAppear`. A marker on a map is rebuilt
            // constantly — the floor changes, the camera moves — and a
            // repeating implicit animation left mid-flight by a rebuild renders
            // a stray ring adrift from the marker. A clock cannot get stranded.
            // The halo: 64 at 14 %, still.
            if !compact { Circle()
                .fill(KozmosColors.semanticsMapMarkerDot)
                .opacity(0.14)
                .frame(width: 64, height: 64)

            // The ring: 48, pulsing.
            TimelineView(.animation) { context in
                let phase = Self.pulsePhase(at: context.date)
                Circle()
                    .fill(KozmosColors.semanticsMapMarkerDot)
                    .frame(width: 48, height: 48)
                    .scaleEffect(0.6 + 0.4 * phase)
                    .opacity(0.3 * (1 - phase))
            }
            }

            // Heading Cone
            if showHeading && !compact {
                ConeShape()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                KozmosColors.semanticsMapMarkerDot.opacity(0.4),
                                Color.clear
                            ]),
                            center: .center,
                            startRadius: 0,
                            endRadius: 32
                        )
                    )
                    .frame(width: 64, height: 64)
                    .rotationEffect(.degrees(heading))
            }

            // The dot: 18, with a 3 ring inside it: the map marker's white, the
            // same in both themes, or for the compact dot the surface it sits
            // on. Inside, as Compose's border and React's are: a stroke on the
            // edge drew the full marker 21 across.
            Circle()
                .fill(KozmosColors.semanticsMapMarkerDot)
                .frame(width: 18, height: 18)
                .overlay(
                    Group {
                        if compact { Circle().strokeBorder(KozmosColors.primitivesColorsBackground0, lineWidth: 3) }
                        else { Circle().strokeBorder(KozmosColors.semanticsMapMarkerRing, lineWidth: 3) }
                    }
                )
        }
        .frame(width: compact ? 18 : 64, height: compact ? 18 : 64)
        // One element, an image, as React's `role="img"` is: the rings and the
        // cone are drawing, and the name is the whole of what it says.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityAddTraits(.isImage)
    }

    /// 0 at the start of a pulse, approaching 1 as it fades out.
    private static func pulsePhase(at date: Date) -> Double {
        let elapsed = date.timeIntervalSinceReferenceDate
            .truncatingRemainder(dividingBy: pulsePeriod)
        return elapsed / pulsePeriod
    }
}

private struct ConeShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        
        path.move(to: center)
        path.addLine(to: CGPoint(x: rect.width * 0.15, y: 0))
        path.addQuadCurve(
            to: CGPoint(x: rect.width * 0.85, y: 0),
            control: CGPoint(x: rect.midX, y: -rect.height * 0.1)
        )
        path.closeSubpath()
        return path
    }
}
