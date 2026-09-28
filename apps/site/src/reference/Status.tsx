import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { SiteLink } from "../site/links";
import { platformLabel, platformOrder, stateLabel } from "./nav";
import type { ComponentSummary, PlatformState } from "./types";

/**
 * One platform's state as words. The colour only repeats them: green where
 * the component is there, an outline where it is not yet, a quiet fill where
 * nobody expects it.
 */
export function StatusTag({ state }: { state: PlatformState }) {
  // A pill keeps its words on one line; a narrow table scrolls instead.
  if (state === "implemented" || state === "linked") {
    return (
      <Tag variant="outline" emotion="success" className="site-status-tag">
        {stateLabel[state]}
      </Tag>
    );
  }
  if (state === "not-expected") {
    return (
      <Tag variant="secondary" className="site-status-tag">
        {stateLabel[state]}
      </Tag>
    );
  }
  return (
    <Tag variant="outline" className="site-status-tag">
      {stateLabel[state]}
    </Tag>
  );
}

/**
 * Components by platform, one row each: the component's name, a link to its
 * page, as the row's header, then React, SwiftUI, Compose and Figma. On a
 * narrow screen the table scrolls inside its own frame, as Kozmos's Table
 * lets it.
 */
export function StatusTable({
  label,
  components,
}: {
  label: string;
  components: readonly ComponentSummary[];
}) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Component</TableHead>
          {platformOrder.map((platform) => (
            <TableHead key={platform} scope="col">
              {platformLabel[platform]}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {components.map((component) => (
          <TableRow key={component.slug}>
            <TableHead scope="row">
              <Text as="span" size="sm">
                <SiteLink to={`/components/${component.slug}`}>
                  {component.name}
                </SiteLink>
              </Text>
            </TableHead>
            {platformOrder.map((platform) => (
              <TableCell key={platform}>
                <StatusTag state={component.platforms[platform]} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * One component's four answers, a platform to a row, so a phone shows all
 * four without scrolling sideways, as a desktop does.
 */
export function PlatformStatus({
  label,
  component,
}: {
  label: string;
  component: ComponentSummary;
}) {
  return (
    <Box className="site-status-single">
      <Table aria-label={label}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Platform</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {platformOrder.map((platform) => (
            <TableRow key={platform}>
              <TableHead scope="row">
                <Text as="span" size="sm" weight="medium">
                  {platformLabel[platform]}
                </Text>
              </TableHead>
              <TableCell>
                <StatusTag state={component.platforms[platform]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
