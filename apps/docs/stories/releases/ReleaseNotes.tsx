import { Markdown } from "@storybook/blocks";
import {
  DesignConfigProvider,
  FieldWrapper,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kozmos-ds/react";
import { useId, useMemo, useState } from "react";
import {
  forPage,
  PACKAGES,
  REPOSITORY,
  sections,
  type ReleasePackage,
} from "./changelog";

// The notes name parts as `<Kbd>` and the like in prose: they are words, never
// elements, so raw HTML is never parsed.
const TEXT_ONLY = { disableParsingRawHTML: true } as const;

function PackageNotes({ pkg }: { pkg: ReleasePackage }) {
  const all = useMemo(() => sections(pkg.text), [pkg.text]);
  const [chosen, setChosen] = useState(all[0]?.title ?? "");
  const section = all.find((s) => s.title === chosen) ?? all[0];
  const fieldId = useId();
  const changelog = `${REPOSITORY}/blob/main/${pkg.path}/CHANGELOG.md`;
  const where = pkg.npm
    ? `[\`${pkg.npm}\`](https://www.npmjs.com/package/${pkg.npm}) on ${pkg.channel}`
    : `${pkg.channel}`;

  return (
    <>
      <Markdown
        options={TEXT_ONLY}
      >{`${where}. The full history is [${pkg.path}/CHANGELOG.md](${changelog}).`}</Markdown>
      {all.length > 1 ? (
        <FieldWrapper label="Release" inputId={fieldId} className="my-4">
          <Select value={section?.title} onValueChange={setChosen}>
            <SelectTrigger id={fieldId} className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {all.map((s) => (
                <SelectItem key={s.title} value={s.title}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      ) : null}
      {section ? (
        <>
          <h3>{section.title}</h3>
          <Markdown options={TEXT_ONLY}>
            {forPage(section.body, pkg.path)}
          </Markdown>
        </>
      ) : (
        <p>No release yet.</p>
      )}
    </>
  );
}

/** Every package's changelog, one release at a time, read from the repository's own files. */
export function ReleaseNotes() {
  return (
    <DesignConfigProvider theme="light">
      <Tabs defaultValue={PACKAGES[0].id}>
        <TabsList aria-label="Package">
          {PACKAGES.map((pkg) => (
            <TabsTrigger key={pkg.id} value={pkg.id}>
              {pkg.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PACKAGES.map((pkg) => (
          <TabsContent key={pkg.id} value={pkg.id}>
            <PackageNotes pkg={pkg} />
          </TabsContent>
        ))}
      </Tabs>
    </DesignConfigProvider>
  );
}
