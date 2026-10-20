// Input.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// KozmosInput has no type: it is a plain text field. A password is
// KozmosPasswordInput, which hides what is typed and can show it.
struct SignInFields: View {
    @Binding var email: String
    @Binding var password: String

    var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            KozmosInput(text: $email, label: "Email", placeholder: "Enter your email")
            KozmosPasswordInput(text: $password, label: "Password", placeholder: "Password")
        }
    }
}
