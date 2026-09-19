import dns from "node:dns/promises";
import net from "node:net";

import { env } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../../errors/errorMessages.js";

const ALLOWED_PROTOCOLS = ["http:", "https:"];

const BLOCKED_HOSTNAMES = ["localhost", "127.0.0.1", "::1"];

/**
 * Cheap, synchronous, format-only check. Used for early input validation
 * before any network call is made. The real SSRF defense is `assertPublicUrl`.
 */
export const validateCompanyUrl = (value: string): URL => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid company URL");
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (
    env.NODE_ENV === "production" &&
    BLOCKED_HOSTNAMES.includes(url.hostname.toLowerCase())
  ) {
    throw new Error("Private or loopback URLs are not allowed");
  }

  return url;
};

const isPrivateIPv4 = (ip: string): boolean => {
  const octets = ip.split(".").map(Number);

  if (
    octets.length !== 4 ||
    octets.some((value) => Number.isNaN(value))
  ) {
    return false;
  }

  const [a, b] = octets;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
};

const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();

  if (normalized === "::1" || normalized === "::") {
    return true;
  }

  if (
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIPv4(normalized.replace("::ffff:", ""));
  }

  return false;
};

export const isPrivateAddress = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    return isPrivateIPv4(ip);
  }

  if (net.isIPv6(ip)) {
    return isPrivateIPv6(ip);
  }

  // Unknown/unparsable address shape: fail closed.
  return true;
};

const blockedUrlError = () =>
  new AppError(
    ERROR_CODES.COMPANY_UNREACHABLE,
    "Private or loopback URLs are not allowed",
    403,
  );

/**
 * Resolves the URL's hostname and rejects it if any resolved address is
 * private, loopback, link-local, or otherwise non-public. Called before
 * every outbound fetch (including redirect hops).
 *
 * Only enforced when NODE_ENV=production, so local development can still
 * crawl local fixtures/servers.
 *
 * This is a DNS-time check, not a connect-time IP pin, so it does not fully
 * defend against DNS-rebinding races (hostname resolving to a public IP at
 * check time and a private IP at connect time). That would require pinning
 * the resolved address for the actual socket, which is out of scope here.
 */
export const assertPublicUrl = async (
  url: URL,
): Promise<void> => {
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new AppError(
      ERROR_CODES.INVALID_REQUEST,
      "Only HTTP and HTTPS URLs are allowed",
      400,
    );
  }

  if (env.NODE_ENV !== "production") {
    return;
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw blockedUrlError();
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw blockedUrlError();
    }

    return;
  }

  let addresses: { address: string }[];

  try {
    addresses = await dns.lookup(hostname, {
      all: true,
    });
  } catch {
    throw new AppError(
      ERROR_CODES.COMPANY_UNREACHABLE,
      ERROR_MESSAGES.COMPANY_UNREACHABLE,
      502,
    );
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw blockedUrlError();
  }
};
