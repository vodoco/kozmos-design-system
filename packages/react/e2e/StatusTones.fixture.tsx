import React from "react";
import { Chip } from "../src/components/Chip";
import { EmptyState } from "../src/components/EmptyState";
import { PageHeader } from "../src/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/Select";
import { Tag } from "../src/components/Tag";
import { ThemeProvider } from "../src/components/ThemeProvider";
import { EMOTIONS } from "../src/utils/emotion";

/**
 * Wave B2's new states, in a theme: EmptyState's tones (GAP-213), Chip's
 * emotions and its remove hover (GAP-170, GAP-251), PageHeader's title addon
 * (decision 210) and Select's ghost trigger (decision 151).
 */
export function StatusTones({ theme }: { theme: "light" | "dark" }) {
  return (
    <ThemeProvider theme={theme}>
      <div data-testid="page" className="bg-background" style={{ padding: 16 }}>
        <span
          data-testid="hover-probe"
          className="block h-2 w-2 bg-hover-fill"
        />
        {EMOTIONS.map((emotion) => (
          <EmptyState
            key={emotion}
            data-testid={`empty-${emotion}`}
            tone={emotion}
            icon={
              <svg data-testid={`icon-${emotion}`} width={16} height={16} />
            }
            title={`Title ${emotion}`}
            description={`Description ${emotion}`}
          />
        ))}
        <div className="flex flex-wrap gap-2">
          <Chip onRemove={() => undefined}>Plain</Chip>
          {EMOTIONS.map((emotion) => (
            <React.Fragment key={emotion}>
              <Chip emotion={emotion} onRemove={() => undefined}>
                {`Rest ${emotion}`}
              </Chip>
              <Chip emotion={emotion} selected onRemove={() => undefined}>
                {`Selected ${emotion}`}
              </Chip>
            </React.Fragment>
          ))}
        </div>
        <div data-testid="wide" style={{ width: 900 }}>
          <PageHeader
            title="Map Content"
            titleAddon={<Tag emotion="alert">Changes Awaiting Publish</Tag>}
          />
        </div>
        <div data-testid="narrow" style={{ width: 320 }}>
          <PageHeader
            title="Map Content Overview"
            titleAddon={<Tag emotion="alert">Changes Awaiting Publish</Tag>}
          />
        </div>
        <Select defaultValue="1">
          <SelectTrigger aria-label="Level" variant="ghost">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Level 1</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ThemeProvider>
  );
}
