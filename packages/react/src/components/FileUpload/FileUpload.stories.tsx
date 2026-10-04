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
