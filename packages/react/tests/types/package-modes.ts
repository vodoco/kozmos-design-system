import { createElement, type ComponentProps } from "react";
import * as kozmos from "@kozmos-ds/react";
import { getIconComponent, type KozmosIconName } from "@kozmos-ds/icons";
import type { RouteOptionPresentation } from "@kozmos-ds/product-contracts";

type IsAny<T> = 0 extends 1 & T ? true : false;
const typedButton: IsAny<ComponentProps<typeof kozmos.Button>> = false;
const typedIcon: IsAny<KozmosIconName> = false;
const typedContract: IsAny<RouteOptionPresentation> = false;
void [typedButton, typedIcon, typedContract];
createElement(kozmos.Button, { type: "submit", emotion: "success" }, "Save");
getIconComponent("check");
// @ts-expect-error Native buttons do not accept link targets.
createElement(kozmos.Button, { href: "/somewhere" });
// @ts-expect-error Invalid names must not disappear into any.
const invalidName: KozmosIconName = "not-a-kozmos-icon";
// @ts-expect-error The contract requires a stable identifier and presentation data.
const invalidRoute: RouteOptionPresentation = { label: "Quickest" };
void [invalidName, invalidRoute];
