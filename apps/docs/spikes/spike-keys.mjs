// The Pointr identifiers for the spike, read at run time and never written
// down. POINTR_BASE_URL, POINTR_CLIENT_ID and POINTR_LICENSE_KEY win; else
// POINTR_KEYS_FROM names a page whose HTML carries a PointrWebSDK.Options
// literal (a QA page) and the three are read out of it.
// redact() takes the values back out of anything the spike writes to disk.
export async function loadPointrKeys() {
  let baseUrl = process.env.POINTR_BASE_URL;
  let clientIdentifier = process.env.POINTR_CLIENT_ID;
  let licenseKey = process.env.POINTR_LICENSE_KEY;
  const from = process.env.POINTR_KEYS_FROM;
  if ((!clientIdentifier || !licenseKey) && from) {
    const html = await (await fetch(from)).text();
    const pick = (key) =>
      html.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`))?.[1];
    baseUrl ??= pick("baseUrl");
    clientIdentifier ??= pick("clientIdentifier");
    licenseKey ??= pick("licenseKey");
  }
  if (!baseUrl || !clientIdentifier || !licenseKey)
    throw new Error(
      "Set POINTR_BASE_URL, POINTR_CLIENT_ID and POINTR_LICENSE_KEY, or POINTR_KEYS_FROM",
    );
  const secrets = [clientIdentifier, licenseKey];
  const redact = (text) =>
    secrets.reduce(
      (out, secret, index) =>
        out
          .split(secret)
          .join(index === 0 ? "<clientIdentifier>" : "<licenseKey>"),
      String(text),
    );
  return { baseUrl, clientIdentifier, licenseKey, redact };
}
