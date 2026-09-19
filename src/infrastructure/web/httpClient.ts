import { limits } from "../../config/limits.js";
import { assertPublicUrl } from "../../layers/security/urlValidator.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../../errors/errorMessages.js";

const isAllowedContentType = (
  contentType: string,
): boolean => {
  if (!contentType) {
    // Some servers omit the header; don't block on absence alone.
    return true;
  }

  const normalized = contentType.toLowerCase();

  return limits.allowedContentTypePrefixes.some(
    (prefix) => normalized.startsWith(prefix),
  );
};

/**
 * Reads the body while enforcing the size cap against actual bytes received,
 * not just the (spoofable/absent) Content-Length header.
 */
const readBodyWithLimit = async (
  response: Response,
  maxBytes: number,
): Promise<string> => {
  const reader = response.body?.getReader();

  if (!reader) {
    return response.text();
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (value) {
      received += value.byteLength;

      if (received > maxBytes) {
        await reader.cancel();

        throw new AppError(
          ERROR_CODES.COMPANY_UNREACHABLE,
          "Page exceeds maximum allowed size",
          413,
        );
      }

      chunks.push(value);
    }
  }

  return Buffer.concat(chunks).toString("utf-8");
};

/**
 * Fetches a page, re-validating the target (including every redirect hop)
 * against the SSRF/private-network guard before each request. Redirects are
 * followed manually rather than automatically, since an attacker-controlled
 * server could otherwise redirect a validated public URL to an internal one.
 */
export const fetchPage = async (
  targetUrl: string,
): Promise<string> => {
  let currentUrl = new URL(targetUrl);

  for (
    let redirectCount = 0;
    redirectCount <= limits.maxRedirects;
    redirectCount++
  ) {
    await assertPublicUrl(currentUrl);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, limits.requestTimeoutMs);

    let response: Response;

    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
      });
    } catch {
      throw new AppError(
        ERROR_CODES.COMPANY_UNREACHABLE,
        ERROR_MESSAGES.COMPANY_UNREACHABLE,
        502,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        throw new AppError(
          ERROR_CODES.COMPANY_UNREACHABLE,
          "Redirect response is missing a Location header",
          502,
        );
      }

      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) {
      throw new AppError(
        ERROR_CODES.COMPANY_UNREACHABLE,
        `${ERROR_MESSAGES.COMPANY_UNREACHABLE}: HTTP ${response.status}`,
        502,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!isAllowedContentType(contentType)) {
      throw new AppError(
        ERROR_CODES.COMPANY_UNREACHABLE,
        `Unsupported content type: ${contentType}`,
        415,
      );
    }

    const contentLength = response.headers.get("content-length");

    if (
      contentLength &&
      Number(contentLength) > limits.maxPageSizeBytes
    ) {
      throw new AppError(
        ERROR_CODES.COMPANY_UNREACHABLE,
        "Page exceeds maximum allowed size",
        413,
      );
    }

    return readBodyWithLimit(response, limits.maxPageSizeBytes);
  }

  throw new AppError(
    ERROR_CODES.COMPANY_UNREACHABLE,
    "Too many redirects",
    502,
  );
};
