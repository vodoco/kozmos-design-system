import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ImageField, type ImageFieldImage } from "./ImageField";
import { Card, CardContent } from "../../components/Card/Card";

// A Dashboard module (decision 183): its stories are filed under Dashboard/,
// and draw only with Kozmos parts. src/dashboard is not scanned for
// style.css's utilities, so a story here writes no utility classes either.
// The images are drawn in place, as SVG, so a story never waits on a network.
const picture = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200"><rect width="1600" height="1200" fill="${color}"/><text x="800" y="600" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="96" fill="#17191c">${label}</text></svg>`,
  )}`;

const images: ImageFieldImage[] = [
  {
    id: "entrance",
    src: picture("Entrance", "#dff3ef"),
    alt: "Main entrance, from the car park",
    crop: { x: 0, y: 0.125, width: 1, height: 0.75 },
  },
  {
    id: "counter",
    src: picture("Counter", "#f4e6ff"),
    alt: "",
    crop: { x: 0.25, y: 0.3, width: 0.5, height: 0.375 },
  },
];

const meta: Meta<typeof ImageField> = {
  id: "dashboard-imagefield",
  title: "Dashboard/ImageField",
  component: ImageField,
  // In the form side panel it lives in (CLOUD-UI-001), 400 wide.
  decorators: [
    (Story) => (
      <Card style={{ maxInlineSize: "25rem" }}>
        <CardContent>
          <Story />
        </CardContent>
      </Card>
    ),
  ],
  args: {
    label: "Images",
    max: 7,
    maxSize: 2 * 1024 * 1024,
    aspectRatio: 16 / 9,
    defaultValue: images,
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ImageField>;

/**
 * Pointr Cloud's Images: up to seven, JPG or PNG, 2 MB each, framed at
 * 16:9. Each image has its alt text, Preview, Frame and Remove.
 */
export const Default: Story = {};

/** Pointr Cloud's Logo: one image, and none yet. */
export const Logo: Story = {
  args: { label: "Logo", max: 1, aspectRatio: 1, defaultValue: [] },
};

/** Full: the count says so, and the drop zone and the URL row are off. */
export const Full: Story = {
  args: { max: 2 },
};

/** Without a ratio, there is no cropper: each image is drawn whole. */
export const NoRatio: Story = {
  args: { aspectRatio: undefined },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * Right to left: the field mirrors, its words in the product's language;
 * an image's own pixels do not.
 */
export const RightToLeft: Story = {
  args: {
    dir: "rtl",
    label: "الصور",
    labels: {
      count: (count, max) => `${count} من ${max}`,
      upload: "تحميل صورة",
      browse: "تصفح",
      drop: "أو اسحب صورة إلى هنا",
      urlLabel: "رابط الصورة",
      addUrl: "إضافة",
      altText: (n) => `النص البديل، الصورة ${n}`,
      preview: (n) => `معاينة الصورة ${n}`,
      frame: (n) => `تأطير الصورة ${n}`,
      remove: (n) => `إزالة الصورة ${n}`,
    },
  },
};
