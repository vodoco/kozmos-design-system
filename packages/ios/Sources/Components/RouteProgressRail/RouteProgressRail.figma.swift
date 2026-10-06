import SwiftUI
import Figma

// One mapping per Content variant: each is a story, and the step disc and the
// route mode take different arguments, so no one example can show them all.
// The markers along the route come from the product's routing.

private let stepWaypoints = [
    KozmosRouteProgressWaypoint(id: "entrance", position: 0, type: .straight, label: "Entrance"),
    KozmosRouteProgressWaypoint(id: "gallery", position: 0.5, type: .left, label: "Gallery entrance"),
    KozmosRouteProgressWaypoint(id: "destination", position: 1, type: .destination, label: "Destination"),
]

private let routeTransitions = [
    KozmosRouteProgressWaypoint(id: "start", position: 0, type: .walking, label: "Entrance"),
    KozmosRouteProgressWaypoint(id: "lift", position: 0.4, type: .liftUp, label: "Elevator to Level 2"),
    KozmosRouteProgressWaypoint(id: "end", position: 1, type: .destination, label: "Gallery"),
]

// The step disc.

struct KozmosRouteProgressRailStartConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "Start"]

    var body: some View {
        KozmosRouteProgressRail(progress: 0, type: .straight, label: "Step 1 of 4")
    }
}

struct KozmosRouteProgressRailMidwayConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "Midway"]

    var body: some View {
        KozmosRouteProgressRail(progress: 0.5, type: .left, label: "Step 2 of 4")
    }
}

struct KozmosRouteProgressRailArrivingConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "Arriving"]

    var body: some View {
        KozmosRouteProgressRail(progress: 0.84, type: .destination, label: "Step 4 of 4")
    }
}

struct KozmosRouteProgressRailUnknownConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "Unknown"]

    var body: some View {
        KozmosRouteProgressRail(progress: nil, type: .left, label: "Step 2 of 4", valueText: "Position unavailable")
    }
}

struct KozmosRouteProgressRailWaypointsConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "Waypoints"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0.2,
            type: .left,
            label: "Step 2 of 4",
            waypoints: stepWaypoints,
            showCompletedTrack: true
        )
    }
}

// The route mode: the active leg, its transitions and the position.

struct KozmosRouteProgressRailActiveLegConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "ActiveLeg"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: nil,
            type: .left,
            label: "Journey progress",
            valueText: "Entrance to elevator",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .gradient,
            positionMode: .static,
            motion: .directional
        )
    }
}

struct KozmosRouteProgressRailWalkingWithinLegConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "WalkingWithinLeg"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0.2,
            type: .left,
            label: "Journey progress",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .gradient,
            motion: .directional
        )
    }
}

struct KozmosRouteProgressRailAtTransitionConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "AtTransition"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0.4,
            type: .left,
            label: "Journey progress",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .gradient,
            motion: .directional
        )
    }
}

struct KozmosRouteProgressRailAfterTransitionConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "AfterTransition"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0.6,
            type: .left,
            label: "Journey progress",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0.4, end: 1),
            appearance: .gradient,
            motion: .directional
        )
    }
}

struct KozmosRouteProgressRailRoutePositionUnknownConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "RoutePositionUnknown"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: nil,
            type: .left,
            label: "Journey progress",
            valueText: "Position unavailable",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .gradient,
            motion: .directional
        )
    }
}

struct KozmosRouteProgressRailThemeRouteConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "ThemeRoute"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0.2,
            type: .left,
            label: "Journey progress",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .theme,
            motion: .directional
        )
    }
}

struct KozmosRouteProgressRailGuidancePausedConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "GuidancePaused"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0.2,
            type: .left,
            label: "Journey progress",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .gradient,
            motion: .none
        )
    }
}

struct KozmosRouteProgressRailLiveStartConnect: FigmaConnect {
    let component = KozmosRouteProgressRail.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787"
    var variant = ["Content": "LiveStart"]

    var body: some View {
        KozmosRouteProgressRail(
            progress: 0,
            type: .left,
            label: "Journey progress",
            waypoints: routeTransitions,
            activeLeg: KozmosProgressRange(start: 0, end: 0.4),
            appearance: .gradient,
            motion: .directional
        )
    }
}
