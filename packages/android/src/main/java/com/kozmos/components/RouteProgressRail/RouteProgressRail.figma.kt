package com.kozmos.components.routeprogressrail

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.progress.KozmosProgressMotion
import com.kozmos.components.progress.KozmosProgressPositionMode
import com.kozmos.components.progress.KozmosProgressRange
import com.kozmos.components.progress.KozmosProgressTrackAppearance

// One mapping per Content variant: each is a story, and the step disc and the
// route mode take different arguments, so no one example can show them all.
// The markers along the route come from the product's routing.

private val stepWaypoints = listOf(
    KozmosRouteProgressWaypoint("entrance", 0f, DirectionType.Straight, "Entrance"),
    KozmosRouteProgressWaypoint("gallery", 0.5f, DirectionType.Left, "Gallery entrance"),
    KozmosRouteProgressWaypoint("destination", 1f, DirectionType.Destination, "Destination"),
)

private val routeTransitions = listOf(
    KozmosRouteProgressWaypoint("start", 0f, DirectionType.Walking, "Entrance"),
    KozmosRouteProgressWaypoint("lift", 0.4f, DirectionType.LiftUp, "Elevator to Level 2"),
    KozmosRouteProgressWaypoint("end", 1f, DirectionType.Destination, "Gallery"),
)

// The step disc.

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "Start")
class KozmosRouteProgressRailStartConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(progress = 0f, type = DirectionType.Straight, label = "Step 1 of 4")
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "Midway")
class KozmosRouteProgressRailMidwayConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(progress = 0.5f, type = DirectionType.Left, label = "Step 2 of 4")
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "Arriving")
class KozmosRouteProgressRailArrivingConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(progress = 0.84f, type = DirectionType.Destination, label = "Step 4 of 4")
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "Unknown")
class KozmosRouteProgressRailUnknownConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = null,
            type = DirectionType.Left,
            label = "Step 2 of 4",
            valueText = "Position unavailable",
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "Waypoints")
class KozmosRouteProgressRailWaypointsConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0.2f,
            type = DirectionType.Left,
            label = "Step 2 of 4",
            waypoints = stepWaypoints,
            showCompletedTrack = true,
        )
    }
}

// The route mode: the active leg, its transitions and the position.

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "ActiveLeg")
class KozmosRouteProgressRailActiveLegConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = null,
            type = DirectionType.Left,
            label = "Journey progress",
            valueText = "Entrance to elevator",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            positionMode = KozmosProgressPositionMode.Static,
            motion = KozmosProgressMotion.Directional,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "WalkingWithinLeg")
class KozmosRouteProgressRailWalkingWithinLegConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0.2f,
            type = DirectionType.Left,
            label = "Journey progress",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            motion = KozmosProgressMotion.Directional,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "AtTransition")
class KozmosRouteProgressRailAtTransitionConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0.4f,
            type = DirectionType.Left,
            label = "Journey progress",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            motion = KozmosProgressMotion.Directional,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "AfterTransition")
class KozmosRouteProgressRailAfterTransitionConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0.6f,
            type = DirectionType.Left,
            label = "Journey progress",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0.4f, 1f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            motion = KozmosProgressMotion.Directional,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "RoutePositionUnknown")
class KozmosRouteProgressRailRoutePositionUnknownConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = null,
            type = DirectionType.Left,
            label = "Journey progress",
            valueText = "Position unavailable",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            motion = KozmosProgressMotion.Directional,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "ThemeRoute")
class KozmosRouteProgressRailThemeRouteConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0.2f,
            type = DirectionType.Left,
            label = "Journey progress",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Theme,
            motion = KozmosProgressMotion.Directional,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "GuidancePaused")
class KozmosRouteProgressRailGuidancePausedConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0.2f,
            type = DirectionType.Left,
            label = "Journey progress",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            motion = KozmosProgressMotion.None,
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2229-9787")
@FigmaVariant("Content", "LiveStart")
class KozmosRouteProgressRailLiveStartConnect {
    @Composable
    fun ComponentExample() {
        KozmosRouteProgressRail(
            progress = 0f,
            type = DirectionType.Left,
            label = "Journey progress",
            waypoints = routeTransitions,
            activeLeg = KozmosProgressRange(0f, 0.4f),
            appearance = KozmosProgressTrackAppearance.Gradient,
            motion = KozmosProgressMotion.Directional,
        )
    }
}
