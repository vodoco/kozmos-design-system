package com.kozmos.components.directionstep

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6763")
class KozmosDirectionStepConnect {
    @FigmaProperty(FigmaType.Text, "Instruction Text")
    val instruction: String = "Continue past the escalators"

    @FigmaProperty(FigmaType.Text, "Distance Text")
    val distance: String = "40 m"

    @FigmaProperty(FigmaType.Text, "Duration Text")
    val duration: String = "1 min"

    // The nineteen cases: the four turns, the six level changes by lift,
    // escalator and stairs, a plain level change, a transition between
    // buildings, turning back, walking, entry, exit and the two ramps.
    @FigmaProperty(FigmaType.Enum, "Type")
    val type: DirectionType = Figma.mapping(
        "Straight" to DirectionType.Straight,
        "Left" to DirectionType.Left,
        "Right" to DirectionType.Right,
        "Destination" to DirectionType.Destination,
        "LiftUp" to DirectionType.LiftUp,
        "LiftDown" to DirectionType.LiftDown,
        "EscalatorUp" to DirectionType.EscalatorUp,
        "EscalatorDown" to DirectionType.EscalatorDown,
        "StairsUp" to DirectionType.StairsUp,
        "StairsDown" to DirectionType.StairsDown,
        "LevelUp" to DirectionType.LevelUp,
        "LevelDown" to DirectionType.LevelDown,
        "Transition" to DirectionType.Transition,
        "TurnBack" to DirectionType.TurnBack,
        "Walking" to DirectionType.Walking,
        "Enter" to DirectionType.Enter,
        "Exit" to DirectionType.Exit,
        "RampUp" to DirectionType.RampUp,
        "RampDown" to DirectionType.RampDown
    )

    @Composable
    fun ComponentExample() {
        KozmosDirectionStep(
            type = type,
            instruction = instruction,
            distance = distance,
            duration = duration
        )
    }
}
