import {
  Box,
  Icon,
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function OnIconButtons() {
  return (
    <TooltipProvider>
      <Box className="site-demo-row">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton variant="outline" aria-label="Zoom in">
              <Icon name="plus" size="sm" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton variant="outline" aria-label="Zoom out">
              <Icon name="minus" size="sm" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent side="bottom">Zoom out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton variant="outline" aria-label="Show my location">
              <Icon name="navigation-pointer-01" size="sm" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent side="right">Show my location</TooltipContent>
        </Tooltip>
      </Box>
    </TooltipProvider>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "On icon buttons",
    description:
      "Shown on hover and focus; side chooses the edge. The button still carries its own label, so the tooltip is a repeat, not the name.",
    Component: OnIconButtons,
  },
];
