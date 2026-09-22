import "./Dashboard.css";
import { useId, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  Box,
  Button,
  Chip,
  ChipGroup,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  EmptyState,
  FieldWrapper,
  Heading,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  MetaStrip,
  MetaStripItem,
  Navbar,
  NavigationItem,
  NumberInput,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  SearchBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sidebar,
  Skeleton,
  Stack,
  Surface,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
} from "@kozmos/react";
import { useFocusOnChange } from "../focus";
import {
  cities,
  formatDate,
  PAGE_SIZE,
  thousands,
  statuses,
  venues as initialVenues,
  type Venue,
  type VenueStatus,
} from "./data";

const sections = [
  { id: "venues", label: "Venues", icon: "building-01" },
  { id: "places", label: "Places", icon: "marker-pin-01" },
  { id: "reports", label: "Reports", icon: "activity" },
  { id: "team", label: "Team", icon: "user-01" },
  { id: "settings", label: "Settings", icon: "settings-01" },
] as const;

const statusEmotion: Record<
  VenueStatus,
  "success" | "neutral" | "informative"
> = {
  Live: "success",
  Draft: "neutral",
  Review: "informative",
  Archived: "neutral",
};

export default function Dashboard() {
  const [section, setSection] = useState<string>("venues");
  const [menuOpen, setMenuOpen] = useState(false);
  // "Back to venues" leaves with the empty section it sits in; the venues'
  // heading then takes focus (../focus.ts). A section chosen in the sidebar
  // keeps focus where it was pressed.
  const [backToVenues, setBackToVenues] = useState(0);
  const venuesHeading = useFocusOnChange(backToVenues);
  const [venues, setVenues] = useState<readonly Venue[]>(initialVenues);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VenueStatus | "all">("all");
  const [city, setCity] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [draft, setDraft] = useState({ name: "", city: "London", floors: 1 });
  const [draftSubmitted, setDraftSubmitted] = useState(false);
  const cityFieldId = useId();
  const draftCityId = useId();

  const shown = useMemo(
    () =>
      venues
        .filter((venue) => status === "all" || venue.status === status)
        .filter((venue) => city === "all" || venue.city === city)
        .filter((venue) =>
          venue.name.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [venues, status, city, query],
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const live = venues.filter((venue) => venue.status === "Live").length;
  const places = venues.reduce((sum, venue) => sum + venue.places, 0);

  function refresh() {
    // A product fetches; the example shows the loading rows for a moment.
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 700);
  }

  function setVenueStatus(id: string, next: VenueStatus) {
    setVenues((list) =>
      list.map((venue) =>
        venue.id === id
          ? { ...venue, status: next, updated: "2026-09-22" }
          : venue,
      ),
    );
    const venue = venues.find((entry) => entry.id === id);
    setNotice(`${venue?.name ?? "The venue"} is now ${next.toLowerCase()}.`);
  }

  function addVenue() {
    setDraftSubmitted(true);
    if (!draft.name.trim()) return;
    const id = draft.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    setVenues((list) => [
      {
        id: `${id}-${list.length}`,
        name: draft.name.trim(),
        city: draft.city,
        floors: draft.floors,
        places: 0,
        status: "Draft",
        updated: "2026-09-22",
      },
      ...list,
    ]);
    setNotice(`${draft.name.trim()} was added as a draft.`);
    setAdding(false);
    setDraft({ name: "", city: "London", floors: 1 });
    setDraftSubmitted(false);
    setPage(1);
  }

  /** The console's sections: in the sidebar, or in the drawer below 64rem. */
  const navigation = (onChoose?: () => void) => (
    <Stack gap={1}>
      {sections.map((entry) => (
        <NavigationItem
          key={entry.id}
          icon={<Icon name={entry.icon} />}
          selected={section === entry.id}
          onClick={() => {
            setSection(entry.id);
            onChoose?.();
          }}
        >
          {entry.label}
        </NavigationItem>
      ))}
    </Stack>
  );

  const go = (next: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(Math.max(next, 1), pages));
  };

  return (
    <Box className="ex-dash">
      <Navbar
        navigationLabel="Venue Manager"
        logo={
          <Text as="span" weight="bold">
            Venue Manager
          </Text>
        }
        context={<Tag variant="secondary">Pointr operations</Tag>}
        primaryAction={
          // The icon's space from the words is the example's (GAP-56).
          <Button
            size="sm"
            onClick={() => setAdding(true)}
            className="ex-dash-add"
          >
            <Icon name="plus" size="sm" />
            Add venue
          </Button>
        }
        utilities={
          <>
            <IconButton
              aria-label="Notifications"
              onClick={() => setNotice("No new notifications.")}
            >
              <Icon name="bell-01" size="sm" />
            </IconButton>
            {/* Below 64rem the sidebar goes and its sections open from here:
                Kozmos's Sidebar has no narrow mode of its own (GAP-47). */}
            <Box className="ex-dash-menu">
              <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                <DrawerTrigger asChild>
                  <IconButton aria-label="Console menu">
                    <Icon name="menu-01" size="sm" />
                  </IconButton>
                </DrawerTrigger>
                <DrawerContent side="right">
                  <DrawerHeader>
                    <DrawerTitle>Pointr operations</DrawerTitle>
                    <DrawerDescription>
                      The console’s sections.
                    </DrawerDescription>
                  </DrawerHeader>
                  <nav aria-label="Console" className="ex-dash-drawer-nav">
                    {navigation(() => setMenuOpen(false))}
                  </nav>
                </DrawerContent>
              </Drawer>
            </Box>
          </>
        }
        account={
          <Avatar role="img" aria-label="Sam Rivera">
            <AvatarFallback aria-hidden="true">SR</AvatarFallback>
          </Avatar>
        }
      />
      <Box className="ex-dash-body">
        {/* The wrapper is what hides: the Sidebar's own display is one of
            Kozmos's scoped utilities, which a class cannot outrank (GAP-04). */}
        <Box className="ex-dash-aside">
          <Sidebar
            aria-label="Console"
            header={
              <Text as="span" size="sm" color="muted">
                Pointr operations
              </Text>
            }
            navigation={navigation()}
            footer={
              <Text as="span" size="xs" color="muted">
                Signed in as Sam Rivera
              </Text>
            }
          />
        </Box>
        <Surface className="ex-dash-main">
          {section !== "venues" ? (
            <EmptyState
              title={`${sections.find((entry) => entry.id === section)?.label} is not part of this example`}
              description="The venues section is; the rest of the console would be built the same way."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSection("venues");
                    setBackToVenues((count) => count + 1);
                  }}
                >
                  Back to venues
                </Button>
              }
            />
          ) : (
            <Stack gap={6}>
              <Stack gap={2}>
                <Heading
                  level={2}
                  ref={venuesHeading}
                  tabIndex={-1}
                  className="ex-dash-title"
                >
                  Venues
                </Heading>
                <MetaStrip aria-label="Across every venue">
                  <MetaStripItem label="Venues" showLabel>
                    {venues.length}
                  </MetaStripItem>
                  <MetaStripItem label="Live" showLabel>
                    {live}
                  </MetaStripItem>
                  <MetaStripItem label="Places" showLabel>
                    {thousands(places)}
                  </MetaStripItem>
                  <MetaStripItem label="Visitors today" showLabel>
                    12,480
                  </MetaStripItem>
                </MetaStrip>
              </Stack>

              <Box className="ex-dash-toolbar">
                <SearchBar
                  variant="inline"
                  aria-label="Search venues"
                  placeholder="Search venues"
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setPage(1);
                  }}
                  onClear={() => setQuery("")}
                />
                {/* GAP-32: ChipGroup is a plain div; the role makes the label count. */}
                <ChipGroup role="group" aria-label="Status">
                  <Chip
                    size="sm"
                    selected={status === "all"}
                    onClick={() => {
                      setStatus("all");
                      setPage(1);
                    }}
                  >
                    All
                  </Chip>
                  {statuses.map((entry) => (
                    <Chip
                      key={entry}
                      size="sm"
                      selected={status === entry}
                      onClick={() => {
                        setStatus(status === entry ? "all" : entry);
                        setPage(1);
                      }}
                    >
                      {entry}
                    </Chip>
                  ))}
                </ChipGroup>
                {/* SelectTrigger takes no label (GAPS.md, GAP-13). */}
                <Box className="ex-dash-city">
                  <FieldWrapper label="City" inputId={cityFieldId}>
                    <Select
                      value={city}
                      onValueChange={(value) => {
                        setCity(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger id={cityFieldId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Every city</SelectItem>
                        {cities.map((entry) => (
                          <SelectItem key={entry} value={entry}>
                            {entry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldWrapper>
                </Box>
                <Button
                  variant="outline"
                  onClick={refresh}
                  isLoading={refreshing}
                >
                  Refresh
                </Button>
              </Box>

              {/* Always on the page, so a screen reader hears each notice put
                  in it; the Alert inside is only its look (Alert is always
                  role="alert", GAP-12, and a confirmation is a status). */}
              <Box role="status" className="ex-dash-live">
                {notice ? (
                  <Alert variant="success" role="none">
                    <AlertDescription>{notice}</AlertDescription>
                  </Alert>
                ) : null}
              </Box>

              {shown.length === 0 ? (
                <EmptyState
                  title="No venue matches"
                  description="Try another name, or clear the status and city."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setStatus("all");
                        setCity("all");
                      }}
                    >
                      Clear the filters
                    </Button>
                  }
                />
              ) : (
                <Stack gap={4}>
                  <Text size="sm" color="muted" aria-live="polite">
                    {shown.length === 1 ? "1 venue" : `${shown.length} venues`}
                    {pages > 1 ? ` · page ${current} of ${pages}` : ""}
                  </Text>
                  <Table aria-label="Venues">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Venue</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Floors</TableHead>
                        <TableHead>Places</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refreshing
                        ? rows.map((row) => (
                            <TableRow key={row.id}>
                              {[0, 1, 2, 3, 4, 5, 6].map((cell) => (
                                <TableCell key={cell}>
                                  <Skeleton className="ex-dash-skeleton" />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        : rows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>
                                <Text as="span" weight="medium">
                                  {row.name}
                                </Text>
                              </TableCell>
                              <TableCell>{row.city}</TableCell>
                              <TableCell>{row.floors}</TableCell>
                              <TableCell>{thousands(row.places)}</TableCell>
                              <TableCell>
                                <Tag
                                  variant="outline"
                                  emotion={statusEmotion[row.status]}
                                >
                                  {row.status}
                                </Tag>
                              </TableCell>
                              <TableCell>{formatDate(row.updated)}</TableCell>
                              <TableCell>
                                <Menu>
                                  <MenuTrigger asChild>
                                    <IconButton
                                      aria-label={`Actions for ${row.name}`}
                                      size="sm"
                                    >
                                      <Icon name="menu-01" size="sm" />
                                    </IconButton>
                                  </MenuTrigger>
                                  <MenuContent>
                                    <MenuItem
                                      onSelect={() =>
                                        setVenueStatus(row.id, "Live")
                                      }
                                    >
                                      Publish
                                    </MenuItem>
                                    <MenuItem
                                      onSelect={() =>
                                        setVenueStatus(row.id, "Review")
                                      }
                                    >
                                      Send for review
                                    </MenuItem>
                                    <MenuItem
                                      onSelect={() =>
                                        setVenueStatus(row.id, "Archived")
                                      }
                                    >
                                      Archive
                                    </MenuItem>
                                  </MenuContent>
                                </Menu>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                  {pages > 1 ? (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#main"
                            onClick={go(current - 1)}
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: pages },
                          (_, index) => index + 1,
                        ).map((number) => (
                          <PaginationItem key={number}>
                            <PaginationLink
                              href="#main"
                              isActive={current === number}
                              onClick={go(number)}
                            >
                              {number}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#main"
                            onClick={go(current + 1)}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  ) : null}
                </Stack>
              )}
            </Stack>
          )}
        </Surface>
      </Box>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a venue</DialogTitle>
            <DialogDescription>
              It starts as a draft; publish it from the list when its map is
              ready.
            </DialogDescription>
          </DialogHeader>
          <form
            className="ex-dash-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              addVenue();
            }}
          >
            <Input
              label="Name"
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              error={
                draftSubmitted && !draft.name.trim()
                  ? "Give the venue a name."
                  : undefined
              }
            />
            <FieldWrapper label="City" inputId={draftCityId}>
              <Select
                value={draft.city}
                onValueChange={(value) => setDraft({ ...draft, city: value })}
              >
                <SelectTrigger id={draftCityId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>
            <NumberInput
              label="Floors"
              min={1}
              max={60}
              value={draft.floors}
              onValueChange={(value) =>
                setDraft({ ...draft, floors: value ?? 1 })
              }
              helperText="Including basements and car parks."
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add venue</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
