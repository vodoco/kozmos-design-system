import SwiftUI

public struct KozmosStepper: View {
    let steps: [String]
    let currentStep: Int
    
    public init(steps: [String], currentStep: Int) {
        self.steps = steps
        self.currentStep = currentStep
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            ForEach(0..<steps.count, id: \.self) { index in
                VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    // A 32 circle, as Figma and React draw it, its ring inside
                    // the circle: 2 for the current and completed steps, 1 for
                    // a pending one, as the plugin paints them. It was 24 with
                    // a centred 2 on every step until 2026-09-22. The accent is
                    // React's primary pair: theme/600 with foreground/1000 on
                    // it, and the current number in ink. It was theme/500 with
                    // background/0, black on the saturated blue in the dark.
                    ZStack {
                        Circle()
                            .strokeBorder(index <= currentStep ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsForeground500, lineWidth: index <= currentStep ? 2 : 1)
                            .background(Circle().fill(index < currentStep ? KozmosColors.primitivesColorsTheme600 : Color.clear))
                            .frame(width: KozmosDimensions.primitivesLayoutSizing400, height: KozmosDimensions.primitivesLayoutSizing400)
                        
                        if index < currentStep {
                            Image(systemName: "checkmark")
                                .font(KozmosTypography.caption)
                                .fontWeight(.bold)
                                .foregroundColor(KozmosColors.primitivesColorsForeground1000)
                        } else {
                            Text("\(index + 1)")
                                .font(KozmosTypography.caption)
                                .foregroundColor(index == currentStep ? KozmosColors.primitivesColorsForeground0 : KozmosColors.primitivesColorsForeground400)
                        }
                    }
                    
                    // React's label: the current step's in the foreground at medium
                    // weight, every other in the muted foreground, foreground/400
                    // (4.8:1 even on a sheet's grey). It was foreground/100 and /500
                    // until 2026-09-22.
                    Text(steps[index])
                        .font(KozmosTypography.caption)
                        .fontWeight(index == currentStep ? .medium : .regular)
                        .foregroundColor(index == currentStep ? KozmosColors.primitivesColorsForeground0 : KozmosColors.primitivesColorsForeground400)
                }
                
                if index < steps.count - 1 {
                    Rectangle()
                        .fill(index < currentStep ? KozmosColors.primitivesColorsTheme600 : KozmosColors.semanticsBorderSubtle)
                        .frame(height: 1)
                        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing50)
                }
            }
        }
    }
}
