import SwiftUI
import Figma

// GAP-160: the Notice set, a new set: its node id is filled after the
// plugin's Build. Tone and Status are the set's variant axes; Summary, Show
// Icon, Show Detail with Detail, and Show Action are its properties.
struct KozmosNoticeConnect: FigmaConnect {
    let component = KozmosNotice<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"

    @FigmaEnum(
        "Tone",
        mapping: [
            "Warning": KozmosNoticeTone.warning,
            "Info": KozmosNoticeTone.info,
            "Critical": KozmosNoticeTone.critical,
            "Success": KozmosNoticeTone.success
        ]
    )
    var tone: KozmosNoticeTone = .warning

    @FigmaEnum(
        "Status",
        mapping: [
            "None": nil,
            "Progress": KozmosNoticeStatus.progress,
            "Done": KozmosNoticeStatus.done
        ]
    )
    var status: KozmosNoticeStatus? = nil

    @FigmaString("Summary")
    var summary: String = "Set Geometry"

    @FigmaBoolean(
        "Show Icon",
        mapping: [
            true: KozmosNoticeIcon.tone,
            false: KozmosNoticeIcon.none
        ]
    )
    var icon: KozmosNoticeIcon = .tone

    @FigmaBoolean(
        "Show Detail",
        mapping: [
            true: true,
            false: false
        ]
    )
    var defaultExpanded: Bool = false

    @FigmaString("Detail")
    var detail: String = "Draw the building's outline on the map."

    @FigmaBoolean("Show Action")
    var showAction: Bool = false

    var body: some View {
        KozmosNotice(
            self.summary,
            detail: self.detail,
            tone: self.tone,
            status: self.status,
            icon: self.icon,
            defaultExpanded: self.defaultExpanded
        ) {
            AnyView(
                Group {
                    if self.showAction {
                        KozmosButton("Set Building Boundary", variant: .outline, size: .sm) {}
                    }
                }
            )
        }
    }
}
