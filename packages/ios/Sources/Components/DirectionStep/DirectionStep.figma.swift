import SwiftUI
import Figma

struct KozmosDirectionStepConnect: FigmaConnect {
    let component = KozmosDirectionStep.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6763"

    @FigmaString("Instruction Text")
    var instruction: String = "Continue past the escalators"

    @FigmaString("Distance Text")
    var distance: String = "40 m"

    @FigmaString("Duration Text")
    var duration: String = "1 min"

    // The nineteen cases: the four turns, the six level changes by lift,
    // escalator and stairs, a plain level change, a transition between
    // buildings, turning back, walking, entry, exit and the two ramps.
    @FigmaEnum(
        "Type",
        mapping: [
            "Straight": DirectionType.straight,
            "Left": DirectionType.left,
            "Right": DirectionType.right,
            "Destination": DirectionType.destination,
            "LiftUp": DirectionType.liftUp,
            "LiftDown": DirectionType.liftDown,
            "EscalatorUp": DirectionType.escalatorUp,
            "EscalatorDown": DirectionType.escalatorDown,
            "StairsUp": DirectionType.stairsUp,
            "StairsDown": DirectionType.stairsDown,
            "LevelUp": DirectionType.levelUp,
            "LevelDown": DirectionType.levelDown,
            "Transition": DirectionType.transition,
            "TurnBack": DirectionType.turnBack,
            "Walking": DirectionType.walking,
            "Enter": DirectionType.enter,
            "Exit": DirectionType.exit,
            "RampUp": DirectionType.rampUp,
            "RampDown": DirectionType.rampDown
        ]
    )
    var type: DirectionType = .straight

    var body: some View {
        KozmosDirectionStep(
            type: self.type,
            instruction: self.instruction,
            distance: self.distance,
            duration: self.duration
        )
    }
}
