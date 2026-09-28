import "./AccountSettings.css";
import { useId, useState, type FormEvent } from "react";
import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Container,
  FieldWrapper,
  Heading,
  Input,
  Navbar,
  NavigationItem,
  PasswordInput,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
} from "@kozmos-ds/react";

const languages = [
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" },
  { value: "tr-TR", label: "Türkçe" },
  { value: "ar", label: "العربية" },
];

const timeZones = [
  { value: "Europe/London", label: "London (GMT+1)" },
  { value: "Europe/Istanbul", label: "Istanbul (GMT+3)" },
  { value: "America/New_York", label: "New York (GMT−4)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
];

const BIO_LIMIT = 160;

const initialProfile = {
  name: "Sam Rivera",
  email: "sam.rivera@example.com",
  language: "en-GB",
  timeZone: "Europe/London",
  bio: "",
};

type Profile = typeof initialProfile;

function profileErrors(profile: Profile) {
  return {
    name: profile.name.trim() ? undefined : "Enter your name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
      ? undefined
      : "Enter an email address, like name@example.com.",
  };
}

function ProfileSettings() {
  const ids = {
    title: useId(),
    language: useId(),
    timeZone: useId(),
    count: useId(),
  };
  const [profile, setProfile] = useState(initialProfile);
  const [errors, setErrors] = useState<ReturnType<typeof profileErrors>>({
    name: undefined,
    email: undefined,
  });
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = profileErrors(profile);
    setErrors(next);
    setSaved(!next.name && !next.email);
  }

  function discard() {
    setProfile(initialProfile);
    setErrors({ name: undefined, email: undefined });
    setSaved(false);
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate aria-labelledby={ids.title}>
        <CardHeader>
          <CardTitle id={ids.title}>Profile</CardTitle>
          <CardDescription>How you appear to your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <Box className="ex-settings-fields">
            <Box className="ex-settings-pair">
              <Input
                label="Full name"
                autoComplete="name"
                required
                value={profile.name}
                error={errors.name}
                onChange={(event) => update("name", event.target.value)}
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={profile.email}
                error={errors.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </Box>
            <Box className="ex-settings-pair">
              {/* SelectTrigger has no label of its own (GAP-13), so the
                  field's label comes from a FieldWrapper around it. */}
              <FieldWrapper label="Language" inputId={ids.language}>
                <Select
                  value={profile.language}
                  onValueChange={(value) => update("language", value)}
                >
                  <SelectTrigger id={ids.language}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Time zone" inputId={ids.timeZone}>
                <Select
                  value={profile.timeZone}
                  onValueChange={(value) => update("timeZone", value)}
                >
                  <SelectTrigger id={ids.timeZone}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeZones.map((zone) => (
                      <SelectItem key={zone.value} value={zone.value}>
                        {zone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </Box>
            <Box>
              {/* Textarea has no helperText (GAP-13): the count is a Text,
                  tied to the field with aria-describedby. */}
              <Textarea
                label="About you"
                rows={3}
                maxLength={BIO_LIMIT}
                aria-describedby={ids.count}
                value={profile.bio}
                onChange={(event) => update("bio", event.target.value)}
              />
              <Text id={ids.count} size="sm" color="muted">
                {profile.bio.length} of {BIO_LIMIT} characters
              </Text>
            </Box>
            {/* Always on the page, so a screen reader hears the message put in
                it; the Alert inside keeps its default, no live region of its
                own, so it is only the look. */}
            <Box role="status" className="ex-settings-live">
              {saved ? (
                <Alert variant="success">
                  <AlertDescription>Your profile is saved.</AlertDescription>
                </Alert>
              ) : null}
            </Box>
          </Box>
        </CardContent>
        <CardFooter>
          <Box className="ex-settings-actions">
            <Button type="submit">Save profile</Button>
            <Button type="button" variant="ghost" onClick={discard}>
              Discard changes
            </Button>
          </Box>
        </CardFooter>
      </form>
    </Card>
  );
}

function NotificationSettings() {
  const titleId = useId();
  const [newVenues, setNewVenues] = useState(true);
  const [following, setFollowing] = useState(true);
  const [push, setPush] = useState(false);
  const [digest, setDigest] = useState("daily");
  const [news, setNews] = useState(false);
  const [saved, setSaved] = useState(false);

  function changed<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setSaved(false);
    };
  }

  return (
    <Card>
      <form
        aria-labelledby={titleId}
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <CardHeader>
          <CardTitle id={titleId}>Notifications</CardTitle>
          <CardDescription>What reaches you, and how often.</CardDescription>
        </CardHeader>
        <CardContent>
          <Box className="ex-settings-fields">
            <Switch
              label="New venues in your region"
              checked={newVenues}
              onCheckedChange={changed(setNewVenues)}
            />
            <Switch
              label="Changes to venues you follow"
              checked={following}
              onCheckedChange={changed(setFollowing)}
            />
            <Switch
              label="Push notifications on this device"
              checked={push}
              onCheckedChange={changed(setPush)}
            />
            <Separator />
            <RadioGroup
              label="Email digest"
              value={digest}
              onValueChange={changed(setDigest)}
            >
              <RadioGroupItem value="immediately" label="As it happens" />
              <RadioGroupItem value="daily" label="Once a day" />
              <RadioGroupItem value="weekly" label="Once a week" />
              <RadioGroupItem value="never" label="Never" />
            </RadioGroup>
            <Checkbox
              label="Product news and offers"
              checked={news}
              onCheckedChange={(checked) => changed(setNews)(checked === true)}
            />
            {/* Always on the page, so a screen reader hears the message put in
                it; the Alert inside keeps its default, no live region of its
                own, so it is only the look. */}
            <Box role="status" className="ex-settings-live">
              {saved ? (
                <Alert variant="success">
                  <AlertDescription>
                    Your notification choices are saved.
                  </AlertDescription>
                </Alert>
              ) : null}
            </Box>
          </Box>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save notifications</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

const MIN_PASSWORD = 12;

function SecuritySettings() {
  const ids = { password: useId(), twoStep: useId() };
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});
  const [changed, setChanged] = useState(false);
  const [twoStep, setTwoStep] = useState(true);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = {
      current: current ? undefined : "Enter your current password.",
      next:
        next.length >= MIN_PASSWORD
          ? undefined
          : `Use at least ${MIN_PASSWORD} characters.`,
      confirm:
        confirm === next ? undefined : "The two new passwords do not match.",
    };
    setErrors(found);
    const valid = !found.current && !found.next && !found.confirm;
    setChanged(valid);
    if (valid) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <Box className="ex-settings-fields">
      <Card>
        <form onSubmit={submit} noValidate aria-labelledby={ids.password}>
          <CardHeader>
            <CardTitle id={ids.password}>Password</CardTitle>
            <CardDescription>
              Changing it signs you out everywhere else.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Box className="ex-settings-fields">
              <PasswordInput
                label="Current password"
                autoComplete="current-password"
                value={current}
                error={errors.current}
                onChange={(event) => setCurrent(event.target.value)}
              />
              <PasswordInput
                label="New password"
                autoComplete="new-password"
                helperText={`At least ${MIN_PASSWORD} characters.`}
                value={next}
                error={errors.next}
                onChange={(event) => setNext(event.target.value)}
              />
              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                error={errors.confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              {/* Always on the page, so a screen reader hears the message put in
                  it; the Alert inside keeps its default, no live region of its
                  own, so it is only the look. */}
              <Box role="status" className="ex-settings-live">
                {changed ? (
                  <Alert variant="success">
                    <AlertDescription>
                      Your password is changed.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </Box>
            </Box>
          </CardContent>
          <CardFooter>
            <Button type="submit">Change password</Button>
          </CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle id={ids.twoStep}>Two-step verification</CardTitle>
          <CardDescription>
            A code from your phone, as well as your password, on a new device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Switch
            label="Ask for a code on new devices"
            checked={twoStep}
            onCheckedChange={setTwoStep}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default function AccountSettings() {
  return (
    <Box className="ex-settings">
      <Navbar
        navigationLabel="Venue Manager"
        logo={
          <Text as="span" weight="bold">
            Venue Manager
          </Text>
        }
        navigation={
          <Box className="ex-settings-nav">
            <NavigationItem placement="top">Venues</NavigationItem>
            <NavigationItem placement="top">Reports</NavigationItem>
            <NavigationItem placement="top" selected>
              Settings
            </NavigationItem>
          </Box>
        }
        account={
          <Avatar role="img" aria-label="Sam Rivera">
            <AvatarFallback aria-hidden="true">SR</AvatarFallback>
          </Avatar>
        }
      />
      <Container>
        <Box className="ex-settings-page">
          <Box className="ex-settings-heading">
            <Heading level={2}>Settings</Heading>
            <Text color="muted">
              Your profile, what we send you, and how you sign in.
            </Text>
          </Box>
          <Tabs defaultValue="profile">
            <TabsList aria-label="Settings">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Box className="ex-settings-panel">
                <ProfileSettings />
              </Box>
            </TabsContent>
            <TabsContent value="notifications">
              <Box className="ex-settings-panel">
                <NotificationSettings />
              </Box>
            </TabsContent>
            <TabsContent value="security">
              <Box className="ex-settings-panel">
                <SecuritySettings />
              </Box>
            </TabsContent>
          </Tabs>
        </Box>
      </Container>
    </Box>
  );
}
