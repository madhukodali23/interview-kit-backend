export const validateCompanyUrl = (value: string): URL => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid company URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();

  const blockedHosts = [
    "localhost",
    "127.0.0.1",
    "::1",
  ];

  if (blockedHosts.includes(hostname)) {
    throw new Error("Private or loopback URLs are not allowed");
  }

  return url;
};