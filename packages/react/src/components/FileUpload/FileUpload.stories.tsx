import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "./FileUpload";

const meta = {
  id: "components-fileupload",
  title: "Core/Inputs/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <FileUpload
        accept=".jpg,.png,.pdf"
        helperText="Images and PDFs up to 8 MB."
        label="Attachment"
        maxSize={8 * 1024 * 1024}
        {...args}
      />
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="w-96">
      <FileUpload
        multiple
        maxFiles={3}
        label="Documents"
        emptyDescription="Drop up to three files."
      />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="w-96">
      <FileUpload label="Evidence" error="Upload at least one document." />
    </div>
  ),
};

// A client's logo, as New Client picks it (GAP-270): a square picture file,
// made here so the story needs no network.
const acmeLogo = new File(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1F2A44"/><circle cx="32" cy="32" r="16" fill="#F2B544"/></svg>',
  ],
  "acme-logo.svg",
  { type: "image/svg+xml" },
);

export const ImagePreview: Story = {
  render: () => (
    <div className="w-96">
      <FileUpload
        preview="image"
        label="Logo"
        previewAlt="Acme logo"
        helperText="PNG, JPG or SVG, up to 2 MB."
        maxSize={2 * 1024 * 1024}
        defaultFiles={[acmeLogo]}
      />
    </div>
  ),
};

export const ImagePreviewEmpty: Story = {
  render: () => (
    <div className="w-96">
      <FileUpload
        preview="image"
        label="Logo"
        helperText="PNG, JPG or SVG, up to 2 MB."
        maxSize={2 * 1024 * 1024}
      />
    </div>
  ),
};
