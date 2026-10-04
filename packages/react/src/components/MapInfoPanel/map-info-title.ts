import React from "react";

/**
 * Set by MapInfo, inside its dialog: wraps MapInfoPanel's own heading in the
 * dialog's title, so the dialog is named once, by the words on screen, and the
 * panel does not repeat that name as a second landmark. Not exported.
 */
export const MapInfoDialogTitle = React.createContext<React.ComponentType<{
  children: React.ReactElement;
}> | null>(null);
