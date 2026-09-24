import SwiftUI

#if canImport(UIKit)
import UIKit

// Extension to create Color from Hex safely natively
extension UIColor {
    convenience init(hex: String?) {
        guard let hex = hex else {
            self.init(white: 0, alpha: 0)
            return
        }
        let hexString = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hexString.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit): alpha first, as the token build writes it
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(red: CGFloat(r) / 255, green: CGFloat(g) / 255, blue: CGFloat(b) / 255, alpha: CGFloat(a) / 255)
    }
}
#elseif canImport(AppKit)
import AppKit

extension NSColor {
    convenience init(hex: String?) {
        guard let hex = hex else {
            self.init(white: 0, alpha: 0)
            return
        }
        let hexString = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hexString.count {
        case 3: 
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: 
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: 
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(red: CGFloat(r) / 255, green: CGFloat(g) / 255, blue: CGFloat(b) / 255, alpha: CGFloat(a) / 255)
    }
}
#endif

public class KozmosColors {
    public static var primitivesColorsTheme0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#051C4F") : UIColor(hex: "#F1F5FE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#051C4F") : NSColor(hex: "#F1F5FE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#082975") : UIColor(hex: "#CAD9FC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#082975") : NSColor(hex: "#CAD9FC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0B369C") : UIColor(hex: "#A4BEF9")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0B369C") : NSColor(hex: "#A4BEF9")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0D44C2") : UIColor(hex: "#7EA2F6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0D44C2") : NSColor(hex: "#7EA2F6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1051E8") : UIColor(hex: "#5887F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1051E8") : NSColor(hex: "#5887F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#135BEC") : UIColor(hex: "#135BEC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#135BEC") : NSColor(hex: "#135BEC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A4BEF9") : UIColor(hex: "#0B369C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A4BEF9") : NSColor(hex: "#0B369C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CAD9FC") : UIColor(hex: "#082975")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CAD9FC") : NSColor(hex: "#082975")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTheme1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F1F5FE") : UIColor(hex: "#051C4F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F1F5FE") : NSColor(hex: "#051C4F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant10: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0A054F") : UIColor(hex: "#F1F1FE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0A054F") : NSColor(hex: "#F1F1FE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0F0875") : UIColor(hex: "#CECAFC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0F0875") : NSColor(hex: "#CECAFC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#140B9C") : UIColor(hex: "#AAA4F9")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#140B9C") : NSColor(hex: "#AAA4F9")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#190DC2") : UIColor(hex: "#867EF6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#190DC2") : NSColor(hex: "#867EF6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1E10E8") : UIColor(hex: "#6258F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1E10E8") : NSColor(hex: "#6258F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4134F1") : UIColor(hex: "#4134F1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4134F1") : NSColor(hex: "#4134F1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6258F3") : UIColor(hex: "#1E10E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6258F3") : NSColor(hex: "#1E10E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#867EF6") : UIColor(hex: "#190DC2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#867EF6") : NSColor(hex: "#190DC2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#AAA4F9") : UIColor(hex: "#140B9C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#AAA4F9") : NSColor(hex: "#140B9C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant1900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CECAFC") : UIColor(hex: "#0F0875")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CECAFC") : NSColor(hex: "#0F0875")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant11000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F1F1FE") : UIColor(hex: "#0A054F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F1F1FE") : NSColor(hex: "#0A054F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant20: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#23054F") : UIColor(hex: "#F6F1FE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#23054F") : NSColor(hex: "#F6F1FE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#340875") : UIColor(hex: "#DECAFC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#340875") : NSColor(hex: "#DECAFC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#450B9C") : UIColor(hex: "#C6A4F9")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#450B9C") : NSColor(hex: "#C6A4F9")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#550DC2") : UIColor(hex: "#AE7EF6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#550DC2") : NSColor(hex: "#AE7EF6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6610E8") : UIColor(hex: "#9658F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6610E8") : NSColor(hex: "#9658F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8034F1") : UIColor(hex: "#8034F1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8034F1") : NSColor(hex: "#8034F1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#9658F3") : UIColor(hex: "#6610E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#9658F3") : NSColor(hex: "#6610E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#AE7EF6") : UIColor(hex: "#550DC2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#AE7EF6") : NSColor(hex: "#550DC2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#C6A4F9") : UIColor(hex: "#450B9C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#C6A4F9") : NSColor(hex: "#450B9C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant2900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#DECAFC") : UIColor(hex: "#340875")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#DECAFC") : NSColor(hex: "#340875")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsThemeVariant21000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F6F1FE") : UIColor(hex: "#23054F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F6F1FE") : NSColor(hex: "#23054F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0F4C2D") : UIColor(hex: "#F6FDF9")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0F4C2D") : NSColor(hex: "#F6FDF9")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#14653D") : UIColor(hex: "#CBF5E0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#14653D") : NSColor(hex: "#CBF5E0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#197F4C") : UIColor(hex: "#A0ECC6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#197F4C") : NSColor(hex: "#A0ECC6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1E995B") : UIColor(hex: "#76E4AD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1E995B") : NSColor(hex: "#76E4AD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#23B26B") : UIColor(hex: "#4BDC93")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#23B26B") : NSColor(hex: "#4BDC93")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#28CC7A") : UIColor(hex: "#28CC7A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#28CC7A") : NSColor(hex: "#28CC7A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#1E995B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#1E995B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A0ECC6") : UIColor(hex: "#197F4C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A0ECC6") : NSColor(hex: "#197F4C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CBF5E0") : UIColor(hex: "#14653D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CBF5E0") : NSColor(hex: "#14653D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalSuccess1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F6FDF9") : UIColor(hex: "#0F4C2D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F6FDF9") : NSColor(hex: "#0F4C2D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#430915") : UIColor(hex: "#FCEAEE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#430915") : NSColor(hex: "#FCEAEE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#670E20") : UIColor(hex: "#F8C6D0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#670E20") : NSColor(hex: "#F8C6D0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8C132B") : UIColor(hex: "#F3A2B3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8C132B") : NSColor(hex: "#F3A2B3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#B01736") : UIColor(hex: "#EE7E95")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#B01736") : NSColor(hex: "#EE7E95")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#D41C42") : UIColor(hex: "#E95A77")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#D41C42") : NSColor(hex: "#E95A77")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E43458") : UIColor(hex: "#E43458")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E43458") : NSColor(hex: "#E43458")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F3A2B3") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F3A2B3") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F8C6D0") : UIColor(hex: "#670E20")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F8C6D0") : NSColor(hex: "#670E20")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalDanger1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCEAEE") : UIColor(hex: "#430915")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCEAEE") : NSColor(hex: "#430915")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#472F02") : UIColor(hex: "#FFFCF8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#472F02") : NSColor(hex: "#FFFCF8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A06B04") : UIColor(hex: "#FDE0A8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A06B04") : NSColor(hex: "#FDE0A8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CD8905") : UIColor(hex: "#FCD281")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CD8905") : NSColor(hex: "#FCD281")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F9A707") : UIColor(hex: "#FBC459")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F9A707") : NSColor(hex: "#FBC459")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FAB735") : UIColor(hex: "#FAB735")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FAB735") : NSColor(hex: "#FAB735")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#F9A707")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#F9A707")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCD281") : UIColor(hex: "#CD8905")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCD281") : NSColor(hex: "#CD8905")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FDE0A8") : UIColor(hex: "#A06B04")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FDE0A8") : NSColor(hex: "#A06B04")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FEEED0") : UIColor(hex: "#744D03")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FEEED0") : NSColor(hex: "#744D03")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalAlert1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFCF8") : UIColor(hex: "#472F02")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFCF8") : NSColor(hex: "#472F02")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0E2E3F") : UIColor(hex: "#ECF6FB")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0E2E3F") : NSColor(hex: "#ECF6FB")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#154761") : UIColor(hex: "#CAE6F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#154761") : NSColor(hex: "#CAE6F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1C6082") : UIColor(hex: "#A9D6EC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1C6082") : NSColor(hex: "#A9D6EC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2379A4") : UIColor(hex: "#87C6E5")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2379A4") : NSColor(hex: "#87C6E5")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2A92C6") : UIColor(hex: "#65B6DE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2A92C6") : NSColor(hex: "#65B6DE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#42A5D7") : UIColor(hex: "#42A5D7")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#42A5D7") : NSColor(hex: "#42A5D7")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CAE6F3") : UIColor(hex: "#154761")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CAE6F3") : NSColor(hex: "#154761")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsEmotionalInfo1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#ECF6FB") : UIColor(hex: "#0E2E3F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#ECF6FB") : NSColor(hex: "#0E2E3F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent3: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0817191C") : UIColor(hex: "#0817191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0817191C") : NSColor(hex: "#0817191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent5: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0D17191C") : UIColor(hex: "#0D17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0D17191C") : NSColor(hex: "#0D17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent10: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1A17191C") : UIColor(hex: "#1A17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1A17191C") : NSColor(hex: "#1A17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent25: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4017191C") : UIColor(hex: "#4017191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4017191C") : NSColor(hex: "#4017191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent50: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8017191C") : UIColor(hex: "#8017191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8017191C") : NSColor(hex: "#8017191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent60: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#9917191C") : UIColor(hex: "#9917191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#9917191C") : NSColor(hex: "#9917191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent75: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#BF17191C") : UIColor(hex: "#BF17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#BF17191C") : NSColor(hex: "#BF17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent80: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CC17191C") : UIColor(hex: "#CC17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CC17191C") : NSColor(hex: "#CC17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent90: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E517191C") : UIColor(hex: "#E517191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E517191C") : NSColor(hex: "#E517191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparent95: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F217191C") : UIColor(hex: "#F217191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F217191C") : NSColor(hex: "#F217191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted3: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#08FCFCFD") : UIColor(hex: "#08FCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#08FCFCFD") : NSColor(hex: "#08FCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted5: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0DFCFCFD") : UIColor(hex: "#0DFCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0DFCFCFD") : NSColor(hex: "#0DFCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted10: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1AFCFCFD") : UIColor(hex: "#1AFCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1AFCFCFD") : NSColor(hex: "#1AFCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted25: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#40FCFCFD") : UIColor(hex: "#40FCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#40FCFCFD") : NSColor(hex: "#40FCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted50: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#80FCFCFD") : UIColor(hex: "#80FCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#80FCFCFD") : NSColor(hex: "#80FCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted60: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#99FCFCFD") : UIColor(hex: "#99FCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#99FCFCFD") : NSColor(hex: "#99FCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted75: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#BFFCFCFD") : UIColor(hex: "#BFFCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#BFFCFCFD") : NSColor(hex: "#BFFCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted80: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CCFCFCFD") : UIColor(hex: "#CCFCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CCFCFCFD") : NSColor(hex: "#CCFCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted90: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E5FCFCFD") : UIColor(hex: "#E5FCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E5FCFCFD") : NSColor(hex: "#E5FCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsTransparentInverted95: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F2FCFCFD") : UIColor(hex: "#F2FCFCFD")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F2FCFCFD") : NSColor(hex: "#F2FCFCFD")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground25: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#070708") : UIColor(hex: "#F7F8FA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#070708") : NSColor(hex: "#F7F8FA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground50: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#0C0D0E") : UIColor(hex: "#F1F2F4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#0C0D0E") : NSColor(hex: "#F1F2F4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#17191C") : UIColor(hex: "#E3E4E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#17191C") : NSColor(hex: "#E3E4E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2E3138") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2E3138") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#464A53") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#464A53") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#a29d90") : UIColor(hex: "#5D626F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#a29d90") : NSColor(hex: "#5D626F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#e8e6e3") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#e8e6e3") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsBackground1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#ffffff") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#ffffff") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#ffffff") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#ffffff") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#e8e6e3") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#e8e6e3") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground400: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#a29d90") : UIColor(hex: "#5D626F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#a29d90") : NSColor(hex: "#5D626F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground500: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground600: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground700: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#545045") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#545045") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground800: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#38352e") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#38352e") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground900: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1c1b17") : UIColor(hex: "#E3E4E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1c1b17") : NSColor(hex: "#E3E4E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesColorsForeground1000: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesBorderBevelTop: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#80FFFFFF") : UIColor(hex: "#80FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#80FFFFFF") : NSColor(hex: "#80FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var primitivesBorderBevelBottom: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#33000000") : UIColor(hex: "#33000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#33000000") : NSColor(hex: "#33000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsSurface0: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsSurface100: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#17191C") : UIColor(hex: "#F8F9FA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#17191C") : NSColor(hex: "#F8F9FA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsSurface200: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2E3138") : UIColor(hex: "#E9ECEF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2E3138") : NSColor(hex: "#E9ECEF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsSurface300: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#464A53") : UIColor(hex: "#DEE2E6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#464A53") : NSColor(hex: "#DEE2E6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsBorderSubtle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2E3138") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2E3138") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsBorderInput: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionNeutralSurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2E3138") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2E3138") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionNeutralOnsurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#ffffff") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#ffffff") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionNeutralText: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#a29d90") : UIColor(hex: "#5D626F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#a29d90") : NSColor(hex: "#5D626F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionThemedSurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#082975") : UIColor(hex: "#CAD9FC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#082975") : NSColor(hex: "#CAD9FC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionThemedOnsurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CAD9FC") : UIColor(hex: "#082975")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CAD9FC") : NSColor(hex: "#082975")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionThemedText: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionSuccessSurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#14653D") : UIColor(hex: "#CBF5E0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#14653D") : NSColor(hex: "#CBF5E0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionSuccessOnsurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CBF5E0") : UIColor(hex: "#14653D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CBF5E0") : NSColor(hex: "#14653D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionSuccessText: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CBF5E0") : UIColor(hex: "#14653D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CBF5E0") : NSColor(hex: "#14653D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionDangerSurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#670E20") : UIColor(hex: "#F8C6D0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#670E20") : NSColor(hex: "#F8C6D0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionDangerOnsurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F8C6D0") : UIColor(hex: "#670E20")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F8C6D0") : NSColor(hex: "#670E20")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionDangerText: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionAlertSurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionAlertOnsurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FEEED0") : UIColor(hex: "#744D03")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FEEED0") : NSColor(hex: "#744D03")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionAlertText: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FEEED0") : UIColor(hex: "#744D03")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FEEED0") : NSColor(hex: "#744D03")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionInformativeSurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#154761") : UIColor(hex: "#CAE6F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#154761") : NSColor(hex: "#CAE6F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionInformativeOnsurface: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#CAE6F3") : UIColor(hex: "#154761")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#CAE6F3") : NSColor(hex: "#154761")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsEmotionInformativeText: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDiffNew: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4FD98D") : UIColor(hex: "#2FBF71")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4FD98D") : NSColor(hex: "#2FBF71")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDiffUpdated: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6BA5FF") : UIColor(hex: "#3B82F6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6BA5FF") : NSColor(hex: "#3B82F6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDiffDeleted: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FF6B6B") : UIColor(hex: "#EF4444")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FF6B6B") : NSColor(hex: "#EF4444")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDiffOverride: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#B48CFF") : UIColor(hex: "#9C6EFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#B48CFF") : NSColor(hex: "#9C6EFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDataBlue: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#60A5FA") : UIColor(hex: "#2563EB")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#60A5FA") : NSColor(hex: "#2563EB")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDataPurple: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#C084FC") : UIColor(hex: "#9333EA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#C084FC") : NSColor(hex: "#9333EA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDataTeal: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2DD4BF") : UIColor(hex: "#0D9488")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2DD4BF") : NSColor(hex: "#0D9488")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDataOrange: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FB923C") : UIColor(hex: "#EA580C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FB923C") : NSColor(hex: "#EA580C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDataRed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F87171") : UIColor(hex: "#DC2626")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F87171") : NSColor(hex: "#DC2626")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsDataYellow: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBBF24") : UIColor(hex: "#D97706")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBBF24") : NSColor(hex: "#D97706")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsOverlayScrim: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#80000000") : UIColor(hex: "#80000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#80000000") : NSColor(hex: "#80000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsOverlayDim: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#33000000") : UIColor(hex: "#33000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#33000000") : NSColor(hex: "#33000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentYellow: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F9AC17") : UIColor(hex: "#F9AC17")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F9AC17") : NSColor(hex: "#F9AC17")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentOrange: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E5801A") : UIColor(hex: "#E5801A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E5801A") : NSColor(hex: "#E5801A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentTurquoise: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#37A4A4") : UIColor(hex: "#37A4A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#37A4A4") : NSColor(hex: "#37A4A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentRed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#D92626") : UIColor(hex: "#D92626")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#D92626") : NSColor(hex: "#D92626")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentBlue: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2080DF") : UIColor(hex: "#2080DF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2080DF") : NSColor(hex: "#2080DF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentNavy: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4D4DB2") : UIColor(hex: "#4D4DB2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4D4DB2") : NSColor(hex: "#4D4DB2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentGreen: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#339933") : UIColor(hex: "#339933")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#339933") : NSColor(hex: "#339933")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryAccentPink: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#B24DB2") : UIColor(hex: "#B24DB2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#B24DB2") : NSColor(hex: "#B24DB2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillYellow: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F9AC17") : UIColor(hex: "#F9AC17")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F9AC17") : NSColor(hex: "#F9AC17")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillOrange: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E5801A") : UIColor(hex: "#E5801A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E5801A") : NSColor(hex: "#E5801A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillTurquoise: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#37A4A4") : UIColor(hex: "#37A4A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#37A4A4") : NSColor(hex: "#37A4A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillRed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#D92626") : UIColor(hex: "#D92626")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#D92626") : NSColor(hex: "#D92626")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillBlue: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#1E77CF") : UIColor(hex: "#1E77CF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#1E77CF") : NSColor(hex: "#1E77CF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillNavy: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4D4DB2") : UIColor(hex: "#4D4DB2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4D4DB2") : NSColor(hex: "#4D4DB2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillGreen: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#339933") : UIColor(hex: "#339933")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#339933") : NSColor(hex: "#339933")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryFillPink: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#B24DB2") : UIColor(hex: "#B24DB2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#B24DB2") : NSColor(hex: "#B24DB2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillYellow: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#17191C") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#17191C") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillOrange: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#17191C") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#17191C") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillTurquoise: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#17191C") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#17191C") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillRed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillBlue: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillNavy: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillGreen: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#17191C") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#17191C") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var semanticsCategoryOnfillPink: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A4BEF9") : UIColor(hex: "#0B369C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A4BEF9") : NSColor(hex: "#0B369C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#082975") : UIColor(hex: "#CAD9FC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#082975") : NSColor(hex: "#CAD9FC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#082975") : UIColor(hex: "#CAD9FC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#082975") : NSColor(hex: "#CAD9FC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#082975") : UIColor(hex: "#CAD9FC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#082975") : NSColor(hex: "#CAD9FC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsThemedForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#082975") : UIColor(hex: "#CAD9FC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#082975") : NSColor(hex: "#CAD9FC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#197F4C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#197F4C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#14653D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#14653D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A0ECC6") : UIColor(hex: "#0F4C2D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A0ECC6") : NSColor(hex: "#0F4C2D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#14653D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#14653D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#14653D") : UIColor(hex: "#CBF5E0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#14653D") : NSColor(hex: "#CBF5E0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#14653D") : UIColor(hex: "#CBF5E0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#14653D") : NSColor(hex: "#CBF5E0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#14653D") : UIColor(hex: "#CBF5E0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#14653D") : NSColor(hex: "#CBF5E0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsSuccessForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#14653D") : UIColor(hex: "#CBF5E0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#14653D") : NSColor(hex: "#CBF5E0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCD281") : UIColor(hex: "#A06B04")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCD281") : NSColor(hex: "#A06B04")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#744D03")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#744D03")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FDE0A8") : UIColor(hex: "#472F02")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FDE0A8") : NSColor(hex: "#472F02")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#744D03")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#744D03")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsAlertForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F3A2B3") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F3A2B3") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#430915") : UIColor(hex: "#FCEAEE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#430915") : NSColor(hex: "#FCEAEE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#430915") : UIColor(hex: "#FCEAEE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#430915") : NSColor(hex: "#FCEAEE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#430915") : UIColor(hex: "#FCEAEE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#430915") : NSColor(hex: "#FCEAEE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsDangerForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#430915") : UIColor(hex: "#FCEAEE")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#430915") : NSColor(hex: "#FCEAEE")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#000000") : UIColor(hex: "#FFFFFF")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#000000") : NSColor(hex: "#FFFFFF")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#154761") : UIColor(hex: "#CAE6F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#154761") : NSColor(hex: "#CAE6F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#154761") : UIColor(hex: "#CAE6F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#154761") : NSColor(hex: "#CAE6F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#154761") : UIColor(hex: "#CAE6F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#154761") : NSColor(hex: "#CAE6F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsInformativeForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#154761") : UIColor(hex: "#CAE6F3")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#154761") : NSColor(hex: "#CAE6F3")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#464A53") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#464A53") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2E3138") : UIColor(hex: "#E3E4E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2E3138") : NSColor(hex: "#E3E4E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#e8e6e3") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#e8e6e3") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#e8e6e3") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#e8e6e3") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#e8e6e3") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#e8e6e3") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsPrimaryButtonsNeutralForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#e8e6e3") : UIColor(hex: "#17191C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#e8e6e3") : NSColor(hex: "#17191C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A4BEF9") : UIColor(hex: "#0B369C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A4BEF9") : NSColor(hex: "#0B369C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A4BEF9") : UIColor(hex: "#0B369C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A4BEF9") : NSColor(hex: "#0B369C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#135BEC") : UIColor(hex: "#135BEC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#135BEC") : NSColor(hex: "#135BEC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsThemedForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#135BEC") : UIColor(hex: "#135BEC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#135BEC") : NSColor(hex: "#135BEC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#1E995B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#1E995B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A0ECC6") : UIColor(hex: "#197F4C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A0ECC6") : NSColor(hex: "#197F4C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#14653D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#14653D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#0F4C2D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#0F4C2D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A0ECC6") : UIColor(hex: "#0F4C2D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A0ECC6") : NSColor(hex: "#0F4C2D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#0F4C2D")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#0F4C2D")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#28CC7A") : UIColor(hex: "#28CC7A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#28CC7A") : NSColor(hex: "#28CC7A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#1E995B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#1E995B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsSuccessForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#28CC7A") : UIColor(hex: "#28CC7A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#28CC7A") : NSColor(hex: "#28CC7A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F3A2B3") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F3A2B3") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F3A2B3") : UIColor(hex: "#670E20")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F3A2B3") : NSColor(hex: "#670E20")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E43458") : UIColor(hex: "#E43458")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E43458") : NSColor(hex: "#E43458")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsDangerForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E43458") : UIColor(hex: "#E43458")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E43458") : NSColor(hex: "#E43458")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCD281") : UIColor(hex: "#CD8905")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCD281") : NSColor(hex: "#CD8905")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#F9A707")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#F9A707")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FDE0A8") : UIColor(hex: "#A06B04")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FDE0A8") : NSColor(hex: "#A06B04")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#F9A707")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#F9A707")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCD281") : UIColor(hex: "#744D03")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCD281") : NSColor(hex: "#744D03")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#472F02")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#472F02")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FDE0A8") : UIColor(hex: "#472F02")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FDE0A8") : NSColor(hex: "#472F02")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#472F02")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#472F02")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#F9A707")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#F9A707")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FAB735") : UIColor(hex: "#FAB735")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FAB735") : NSColor(hex: "#FAB735")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCD281") : UIColor(hex: "#CD8905")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCD281") : NSColor(hex: "#CD8905")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsAlertForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FAB735") : UIColor(hex: "#FAB735")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FAB735") : NSColor(hex: "#FAB735")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#154761")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#154761")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#154761")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#154761")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#154761")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#154761")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#42A5D7") : UIColor(hex: "#42A5D7")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#42A5D7") : NSColor(hex: "#42A5D7")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsInformativeForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#42A5D7") : UIColor(hex: "#42A5D7")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#42A5D7") : NSColor(hex: "#42A5D7")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#464A53") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#464A53") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#a29d90") : UIColor(hex: "#5D626F")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#a29d90") : NSColor(hex: "#5D626F")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsSecondaryButtonsNeutralForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A4BEF9") : UIColor(hex: "#0B369C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A4BEF9") : NSColor(hex: "#0B369C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A4BEF9") : UIColor(hex: "#0B369C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A4BEF9") : NSColor(hex: "#0B369C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5887F3") : UIColor(hex: "#1051E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5887F3") : NSColor(hex: "#1051E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#135BEC") : UIColor(hex: "#135BEC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#135BEC") : NSColor(hex: "#135BEC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#7EA2F6") : NSColor(hex: "#0D44C2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsThemedForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#135BEC") : UIColor(hex: "#135BEC")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#135BEC") : NSColor(hex: "#135BEC")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#1E995B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#1E995B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A0ECC6") : UIColor(hex: "#197F4C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A0ECC6") : NSColor(hex: "#197F4C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#1E995B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#1E995B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A0ECC6") : UIColor(hex: "#197F4C")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A0ECC6") : NSColor(hex: "#197F4C")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#4BDC93") : UIColor(hex: "#23B26B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#4BDC93") : NSColor(hex: "#23B26B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#28CC7A") : UIColor(hex: "#28CC7A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#28CC7A") : NSColor(hex: "#28CC7A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#76E4AD") : UIColor(hex: "#1E995B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#76E4AD") : NSColor(hex: "#1E995B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsSuccessForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#28CC7A") : UIColor(hex: "#28CC7A")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#28CC7A") : NSColor(hex: "#28CC7A")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F3A2B3") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F3A2B3") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#F3A2B3") : UIColor(hex: "#8C132B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#F3A2B3") : NSColor(hex: "#8C132B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E95A77") : UIColor(hex: "#D41C42")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E95A77") : NSColor(hex: "#D41C42")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E43458") : UIColor(hex: "#E43458")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E43458") : NSColor(hex: "#E43458")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#EE7E95") : NSColor(hex: "#B01736")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsDangerForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#E43458") : UIColor(hex: "#E43458")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#E43458") : NSColor(hex: "#E43458")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FCD281") : UIColor(hex: "#CD8905")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FCD281") : NSColor(hex: "#CD8905")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#F9A707")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#F9A707")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FDE0A8") : UIColor(hex: "#A06B04")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FDE0A8") : NSColor(hex: "#A06B04")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FBC459") : UIColor(hex: "#F9A707")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FBC459") : NSColor(hex: "#F9A707")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#FFFFFF") : UIColor(hex: "#000000")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#FFFFFF") : NSColor(hex: "#000000")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsAlertForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#744D03") : UIColor(hex: "#FEEED0")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#744D03") : NSColor(hex: "#FEEED0")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#A9D6EC") : UIColor(hex: "#1C6082")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#A9D6EC") : NSColor(hex: "#1C6082")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#65B6DE") : UIColor(hex: "#2A92C6")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#65B6DE") : NSColor(hex: "#2A92C6")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#42A5D7") : UIColor(hex: "#42A5D7")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#42A5D7") : NSColor(hex: "#42A5D7")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#87C6E5") : UIColor(hex: "#2379A4")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#87C6E5") : NSColor(hex: "#2379A4")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsInformativeForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#42A5D7") : UIColor(hex: "#42A5D7")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#42A5D7") : NSColor(hex: "#42A5D7")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonBackgroundIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#464A53") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#464A53") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonBackgroundDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#d1cec7") : UIColor(hex: "#2E3138")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#d1cec7") : NSColor(hex: "#2E3138")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonBackgroundHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonBackgroundPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#2E3138") : UIColor(hex: "#E3E4E8")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#2E3138") : NSColor(hex: "#E3E4E8")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonBackgroundFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonForegroundContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonForegroundContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonForegroundContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonForegroundContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#464A53") : UIColor(hex: "#C7CAD1")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#464A53") : NSColor(hex: "#C7CAD1")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralButtonForegroundContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralForegroundDimmedContentIdle: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#6f6a5d") : UIColor(hex: "#9095A2")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#6f6a5d") : NSColor(hex: "#9095A2")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralForegroundDimmedContentDisabled: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#b9b5ac") : UIColor(hex: "#464A53")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#b9b5ac") : NSColor(hex: "#464A53")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralForegroundDimmedContentHover: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralForegroundDimmedContentPressed: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#5C6069") : UIColor(hex: "#ABAFBA")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#5C6069") : NSColor(hex: "#ABAFBA")
        }))
        #else
        return Color.clear
        #endif
    }
    public static var componentsTertiaryButtonsNeutralForegroundDimmedContentFocus: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "#8b8474") : UIColor(hex: "#747B8B")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "#8b8474") : NSColor(hex: "#747B8B")
        }))
        #else
        return Color.clear
        #endif
    }
}