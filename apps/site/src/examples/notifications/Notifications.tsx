import "./Notifications.css";
import { useState } from "react";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Counter,
  EmptyState,
  Heading,
  Icon,
  IconButton,
  List,
  ListItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";
import {
  kindLabel,
  notifications as initial,
  type Kind,
  type Notification,
} from "./data";

type Filter = "all" | Kind;

const filters: readonly { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "alert", label: "Alerts" },
  { value: "mention", label: "Mentions" },
  { value: "system", label: "System" },
];

const kindIcon: Record<Kind, "alert-triangle" | "user-01" | "info-circle"> = {
  alert: "alert-triangle",
  mention: "user-01",
  system: "info-circle",
};

const kindEmotion: Record<Kind, "alert" | "informative" | "neutral"> = {
  alert: "alert",
  mention: "informative",
  system: "neutral",
};

export default function Notifications() {
  const [items, setItems] = useState<readonly Notification[]>(initial);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [undo, setUndo] = useState<readonly string[]>();
  // Marking read removes the button that was pressed (an item's, or "Mark all"
  // disables itself), so focus goes to the Undo that appears; after Undo, to
  // "Mark all as read" (../focus.ts).
  const undoFocus = useFocusOnChange(undo, Boolean(undo));
  const markAllFocus = useFocusOnChange(undo, !undo);
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    digest: false,
  });

  const unread = items.filter((item) => !item.read);

  function markRead(ids: readonly string[]) {
    if (ids.length === 0) return;
    setItems((list) =>
      list.map((item) =>
        ids.includes(item.id) ? { ...item, read: true } : item,
      ),
    );
    setUndo(ids);
  }

  function undoRead() {
    if (!undo) return;
    setItems((list) =>
      list.map((item) =>
        undo.includes(item.id) ? { ...item, read: false } : item,
      ),
    );
    setUndo(undefined);
  }

  function shownFor(filter: Filter) {
    return items
      .filter((item) => filter === "all" || item.kind === filter)
      .filter((item) => !unreadOnly || !item.read);
  }

  return (
    <Box className="ex-inbox">
      <Stack gap={6}>
        <Stack
          direction="row"
          align="center"
          justify="between"
          wrap="wrap"
          gap={3}
        >
          <Stack direction="row" align="center" gap={2}>
            <Heading level={2}>Notifications</Heading>
            {unread.length > 0 ? (
              <Counter tone="brand" aria-label={`${unread.length} unread`}>
                {unread.length}
              </Counter>
            ) : null}
          </Stack>
          <Stack direction="row" align="center" wrap="wrap" gap={3}>
            <Switch
              label="Only unread"
              checked={unreadOnly}
              onCheckedChange={setUnreadOnly}
            />
            <Button
              variant="outline"
              size="sm"
              ref={markAllFocus}
              disabled={unread.length === 0}
              onClick={() => markRead(unread.map((item) => item.id))}
            >
              Mark all as read
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                {/* The icon's space from the word is the example's. */}
                <Button variant="ghost" size="sm">
                  <Icon name="settings-01" size="sm" />
                  Preferences
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Stack gap={3}>
                  <Text weight="semibold">How to reach you</Text>
                  <Switch
                    label="Email"
                    checked={prefs.email}
                    onCheckedChange={(value) =>
                      setPrefs({ ...prefs, email: value })
                    }
                  />
                  <Switch
                    label="Push on your phone"
                    checked={prefs.push}
                    onCheckedChange={(value) =>
                      setPrefs({ ...prefs, push: value })
                    }
                  />
                  <Switch
                    label="Weekly digest instead"
                    checked={prefs.digest}
                    onCheckedChange={(value) =>
                      setPrefs({ ...prefs, digest: value })
                    }
                  />
                </Stack>
              </PopoverContent>
            </Popover>
          </Stack>
        </Stack>

        {/* A toast would sit at the browser's corner, outside the page
            (GAPS.md, GAP-36), so the confirmation stays inline, in a status
            region that is always there; the Alert inside is only its look
            (Alert is always role="alert", GAP-12). */}
        <Box role="status" className="ex-inbox-live">
          {undo ? (
            <Alert variant="success" role="none">
              <AlertDescription>
                <Stack
                  direction="row"
                  align="center"
                  justify="between"
                  wrap="wrap"
                  gap={2}
                >
                  <Text as="span" size="sm">
                    {undo.length === 1
                      ? "1 notification marked as read."
                      : `${undo.length} notifications marked as read.`}
                  </Text>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={undoRead}
                    ref={undoFocus}
                  >
                    Undo
                  </Button>
                </Stack>
              </AlertDescription>
            </Alert>
          ) : null}
        </Box>

        <Tabs defaultValue="all">
          <TabsList aria-label="Kind">
            {filters.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {filters.map((filter) => {
            const shown = shownFor(filter.value);
            return (
              <TabsContent key={filter.value} value={filter.value}>
                {shown.length === 0 ? (
                  <EmptyState
                    icon={<Icon name="check" size="xl" />}
                    title="You are all caught up"
                    description={
                      unreadOnly
                        ? "Nothing unread here. Switch off “Only unread” to see the rest."
                        : "Nothing of this kind yet."
                    }
                  />
                ) : (
                  <List aria-label={`${filter.label} notifications`}>
                    {shown.map((item) => (
                      <ListItem key={item.id}>
                        <Box className="ex-inbox-item">
                          <Icon name={kindIcon[item.kind]} size="lg" />
                          <Stack gap={1}>
                            <Text weight={item.read ? "normal" : "semibold"}>
                              {item.title}
                            </Text>
                            <Text size="sm" color="muted">
                              {item.body}
                            </Text>
                            <Stack direction="row" align="center" gap={2}>
                              <Tag
                                variant="outline"
                                emotion={kindEmotion[item.kind]}
                              >
                                {kindLabel[item.kind]}
                              </Tag>
                              <Text as="span" size="xs" color="muted">
                                {item.when}
                              </Text>
                              {!item.read ? (
                                <Tag emotion="themed">New</Tag>
                              ) : null}
                            </Stack>
                          </Stack>
                          {!item.read ? (
                            <IconButton
                              aria-label={`Mark “${item.title}” as read`}
                              size="sm"
                              onClick={() => markRead([item.id])}
                            >
                              <Icon name="check" size="sm" />
                            </IconButton>
                          ) : null}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Stack>
    </Box>
  );
}
