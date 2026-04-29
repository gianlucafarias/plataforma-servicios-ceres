export type SocialPlatform = "instagram" | "facebook" | "linkedin";

function parseHandleFromUrl(rawValue: string, platform: SocialPlatform): string {
  const normalizedInput = rawValue.startsWith("http://") || rawValue.startsWith("https://")
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(normalizedInput);
    const host = url.hostname.toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (platform === "instagram" && host.includes("instagram.com")) {
      return pathParts[0] || "";
    }

    if (platform === "facebook" && host.includes("facebook.com")) {
      if (pathParts[0] === "profile.php") {
        return url.searchParams.get("id") || "";
      }
      return pathParts[0] || "";
    }

    if (platform === "linkedin" && host.includes("linkedin.com")) {
      if (pathParts[0] === "in" || pathParts[0] === "company") {
        return pathParts[1] || "";
      }
      return pathParts[0] || "";
    }
  } catch {
    return "";
  }

  return "";
}

export function normalizeSocialHandle(value: string, platform: SocialPlatform): string {
  if (!value) return "";

  const compact = value.trim().replace(/\s+/g, "");
  if (!compact) return "";

  let handle = compact;

  const extracted = parseHandleFromUrl(compact, platform);
  if (extracted) {
    handle = extracted;
  }

  handle = handle.replace(/^@+/, "").replace(/[/?#].*$/, "").replace(/^\/+|\/+$/g, "");

  return handle;
}

export function validateSocialHandle(value: string): string | null {
  if (!value) return null;

  if (/\s/.test(value)) {
    return "El usuario no puede contener espacios.";
  }

  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    return "Usa solo letras, números, punto, guión o guión bajo.";
  }

  return null;
}
