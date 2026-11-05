import figma from "@figma/code-connect";
import { Navbar } from "./Navbar";

const navbarUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6765";

const navbarProps = {
  actions: figma.slot("Actions Slot"),
  account: figma.slot("Account Slot"),
  context: figma.slot("Context Slot"),
  logo: figma.slot("Logo Slot"),
  // GAP-208: False is the default, so its snippet says nothing.
  logoInset: figma.enum("LogoInset", { True: true, False: undefined }),
  navigation: figma.slot("Navigation Slot"),
  // GAP-196: Center is the default, so its snippet says nothing.
  navigationAlign: figma.enum("NavigationAlign", {
    Start: "start",
    Center: undefined,
    End: "end",
  }),
  primaryAction: figma.slot("Primary Action Slot"),
  utilities: figma.slot("Utility Slot"),
};

figma.connect(Navbar, navbarUrl, {
  variant: { Content: "Basic" },
  props: navbarProps,
  example: ({ logo, logoInset, navigation, navigationAlign }) => (
    <Navbar
      logo={logo}
      logoInset={logoInset}
      navigation={navigation}
      navigationAlign={navigationAlign}
    />
  ),
});

figma.connect(Navbar, navbarUrl, {
  variant: { Content: "Actions" },
  props: navbarProps,
  example: ({ actions, logo, logoInset, navigation, navigationAlign }) => (
    <Navbar
      actions={actions}
      logo={logo}
      logoInset={logoInset}
      navigation={navigation}
      navigationAlign={navigationAlign}
    />
  ),
});

figma.connect(Navbar, navbarUrl, {
  variant: { Content: "Contextual" },
  props: navbarProps,
  example: ({
    account,
    context,
    logo,
    logoInset,
    navigation,
    navigationAlign,
    primaryAction,
    utilities,
  }) => (
    <Navbar
      account={account}
      context={context}
      logo={logo}
      logoInset={logoInset}
      navigation={navigation}
      navigationAlign={navigationAlign}
      primaryAction={primaryAction}
      utilities={utilities}
    />
  ),
});
