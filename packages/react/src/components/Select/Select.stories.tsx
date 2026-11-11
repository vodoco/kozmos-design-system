import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectSeparator,
} from "./Select";

const meta = {
  id: "components-select",
  title: "Core/Inputs/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-44" aria-label="Fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithScroll: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-72" aria-label="Timezone">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectScrollUpButton />
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
          <SelectItem value="akst">Alaska Standard Time (AKST)</SelectItem>
          <SelectItem value="hst">
            Hawaii-Aleutian Standard Time (HST)
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eest">
            Eastern European Standard Time (EEST)
          </SelectItem>
          <SelectItem value="west">
            Western European Summer Time (WEST)
          </SelectItem>
          <SelectItem value="cat">Central Africa Time (CAT)</SelectItem>
          <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="msk">Moscow Time (MSK)</SelectItem>
          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          <SelectItem value="cst_china">China Standard Time (CST)</SelectItem>
          <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
          <SelectItem value="kst">Korea Standard Time (KST)</SelectItem>
          <SelectItem value="ist_indonesia">
            Indonesia Central Standard Time (WITA)
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Australia</SelectLabel>
          <SelectItem value="awst">
            Australian Western Standard Time (AWST)
          </SelectItem>
          <SelectItem value="acst">
            Australian Central Standard Time (ACST)
          </SelectItem>
          <SelectItem value="aest">
            Australian Eastern Standard Time (AEST)
          </SelectItem>
          <SelectItem value="nzst">New Zealand Standard Time (NZST)</SelectItem>
          <SelectItem value="fjt">Fiji Time (FJT)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>South America</SelectLabel>
          <SelectItem value="art">Argentina Time (ART)</SelectItem>
          <SelectItem value="bot">Bolivia Time (BOT)</SelectItem>
          <SelectItem value="brt">Brasilia Time (BRT)</SelectItem>
          <SelectItem value="clt">Chile Standard Time (CLT)</SelectItem>
        </SelectGroup>
        <SelectScrollDownButton />
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-44" aria-label="Fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithError: Story = {
  render: () => (
    <Select>
      <SelectTrigger
        className="w-44"
        aria-label="Fruit"
        error="Please select a fruit."
      >
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// GAP-164: a count in each option, at its end before the check. It is read
// with the option's words, and the closed select shows the words alone.
export const OptionCounts: Story = {
  name: "Option counts",
  render: () => (
    <Select defaultValue="everything">
      <SelectTrigger className="w-56" aria-label="Content">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="everything" count={128}>
          All Content
        </SelectItem>
        <SelectItem value="poi" count={96}>
          POI
        </SelectItem>
        <SelectItem value="featured" count={12}>
          Featured POIs
        </SelectItem>
        <SelectItem value="interior" count={32}>
          Interior asset
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

// The same list open, so the visual review draws the counts' column and
// the check's 16px place every row keeps (decision 1). Not on the docs
// page: an open Select holds the page's focus.
export const OptionCountsOpen: Story = {
  name: "Option counts, open",
  render: () => (
    <div style={{ height: 280 }}>
      <Select defaultOpen defaultValue="poi">
        <SelectTrigger className="w-56" aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="everything" count={1284}>
            All Content
          </SelectItem>
          <SelectItem value="poi" count={96}>
            POI
          </SelectItem>
          <SelectItem value="featured" count={12}>
            Featured POIs
          </SelectItem>
          <SelectItem value="interior" count={32}>
            Interior asset
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
