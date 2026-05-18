const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);

const WEBP_BYTES = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

export function createPngTestFile(name: string): File {
  return new File([PNG_BYTES], name, { type: "image/png" });
}

export function createJpegTestFile(name: string, mimeType = "image/jpeg"): File {
  return new File([JPEG_BYTES], name, { type: mimeType });
}

export function createWebpTestFile(name: string): File {
  return new File([WEBP_BYTES], name, { type: "image/webp" });
}

export function createCorruptPngTestFile(name: string): File {
  return new File([Uint8Array.from([0x6e, 0x6f, 0x74, 0x2d, 0x70, 0x6e, 0x67])], name, {
    type: "image/png",
  });
}
