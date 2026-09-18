import { limits } from "../../config/limits.js";

export const fetchPage = async (url: string): Promise<string> => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, limits.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentLength = response.headers.get("content-length");

    if (
      contentLength &&
      Number(contentLength) > limits.maxPageSizeBytes
    ) {
      throw new Error("Page is too large");
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};