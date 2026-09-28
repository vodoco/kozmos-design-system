/** Invented notifications for the inbox. */

export type Kind = "alert" | "mention" | "system";

export interface Notification {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  when: string;
  read: boolean;
}

export const kindLabel: Record<Kind, string> = {
  alert: "Alert",
  mention: "Mention",
  system: "System",
};

export const notifications: readonly Notification[] = [
  {
    id: "lift",
    kind: "alert",
    title: "Lift 3 is out of service at Riverside Centre",
    body: "Step-free routes now go by the north lifts. The map has been updated.",
    when: "10 min ago",
    read: false,
  },
  {
    id: "mention-ayse",
    kind: "mention",
    title: "Ayşe Kaya mentioned you on Harbour Terminal",
    body: "“Can you check the gate numbers on the second floor before Friday?”",
    when: "25 min ago",
    read: false,
  },
  {
    id: "publish",
    kind: "system",
    title: "Marina Mall was published",
    body: "Version 14 is live in the apps. 380 places, 4 floors.",
    when: "1 h ago",
    read: false,
  },
  {
    id: "closure",
    kind: "alert",
    title: "The rooftop terrace is closed for the season",
    body: "Routes via the terrace are hidden until it reopens in April.",
    when: "3 h ago",
    read: false,
  },
  {
    id: "mention-jonah",
    kind: "mention",
    title: "Jonah Okafor replied to your note on Science Park",
    body: "“Done — the café's opening hours are corrected.”",
    when: "Yesterday",
    read: true,
  },
  {
    id: "review",
    kind: "system",
    title: "Central Station is ready for review",
    body: "Two floors changed since the last publish.",
    when: "Yesterday",
    read: true,
  },
  {
    id: "wifi",
    kind: "alert",
    title: "Wi-Fi beacons offline on Bay Airport, Terminal 2",
    body: "Positioning falls back to GPS near the gates until they are back.",
    when: "2 days ago",
    read: true,
  },
  {
    id: "invite",
    kind: "system",
    title: "Priya Nair joined your team",
    body: "She can edit places on every venue.",
    when: "3 days ago",
    read: true,
  },
];
