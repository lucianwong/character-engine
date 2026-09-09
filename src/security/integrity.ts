export async function sha256Hex(
  bytes: Uint8Array,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      "SHA-256 verification requires Web Crypto support",
    );
  }

  const input = new Uint8Array(bytes);
  const digest = await subtle.digest("SHA-256", input);

  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySha256(
  bytes: Uint8Array,
  expectedHex: string,
): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/i.test(expectedHex)) {
    throw new Error(
      "Expected SHA-256 must be a 64-character hexadecimal digest",
    );
  }

  const actual = await sha256Hex(bytes);
  return actual === expectedHex.toLowerCase();
}
