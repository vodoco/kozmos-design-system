import {
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
 * Components by platform, one row each: React, SwiftUI, Compose and Figma.
 * With `named`, each row starts with the component's name, a link to its
 * page, as the row's header; without, it is one component's row alone.
 */
export function StatusTable({
  label,
  components,
  named = true,
}: {
  label: string;
  components: readonly ComponentSummary[];
  named?: boolean;
}) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          {named ? <TableHead scope="col">Component</TableHead> : null}
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
            {named ? (
              <TableHead scope="row">
                <Text as="span" size="sm">
                  <SiteLink to={`/components/${component.slug}`}>
                    {component.name}
                  </SiteLink>
                </Text>
              </TableHead>
            ) : null}
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
