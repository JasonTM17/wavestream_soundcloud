const crypto = require("node:crypto");

const byteToHex = Array.from({ length: 256 }, (_, index) =>
  (index + 0x100).toString(16).slice(1),
);
const validUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NIL = "00000000-0000-0000-0000-000000000000";
const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

function assertBufferRange(buffer, offset = 0) {
  if (!buffer || typeof buffer.length !== "number") {
    throw new TypeError("UUID output buffer must be an array-like byte buffer");
  }

  if (offset < 0 || offset + 16 > buffer.length) {
    throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
  }
}

function normalizeRandomBytes(options = {}) {
  const randomBytes =
    options.random ?? (typeof options.rng === "function" ? options.rng() : crypto.randomBytes(16));

  if (!randomBytes || randomBytes.length < 16) {
    throw new TypeError("UUID random data must contain at least 16 bytes");
  }

  return Array.from(randomBytes.slice ? randomBytes.slice(0, 16) : randomBytes).slice(0, 16);
}

function unsafeStringify(bytes, offset = 0) {
  return (
    byteToHex[bytes[offset]] +
    byteToHex[bytes[offset + 1]] +
    byteToHex[bytes[offset + 2]] +
    byteToHex[bytes[offset + 3]] +
    "-" +
    byteToHex[bytes[offset + 4]] +
    byteToHex[bytes[offset + 5]] +
    "-" +
    byteToHex[bytes[offset + 6]] +
    byteToHex[bytes[offset + 7]] +
    "-" +
    byteToHex[bytes[offset + 8]] +
    byteToHex[bytes[offset + 9]] +
    "-" +
    byteToHex[bytes[offset + 10]] +
    byteToHex[bytes[offset + 11]] +
    byteToHex[bytes[offset + 12]] +
    byteToHex[bytes[offset + 13]] +
    byteToHex[bytes[offset + 14]] +
    byteToHex[bytes[offset + 15]]
  ).toLowerCase();
}

function v4(options = {}, buffer, offset = 0) {
  const bytes = normalizeRandomBytes(options);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  if (buffer) {
    assertBufferRange(buffer, offset);

    for (let index = 0; index < 16; index += 1) {
      buffer[offset + index] = bytes[index];
    }

    return buffer;
  }

  return unsafeStringify(bytes);
}

function validate(value) {
  return typeof value === "string" && (value === NIL || value === MAX || validUuid.test(value));
}

function parse(value) {
  if (!validate(value)) {
    throw new TypeError("Invalid UUID");
  }

  const normalized = value.replace(/-/g, "");
  const bytes = new Uint8Array(16);

  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

function stringify(bytes, offset = 0) {
  assertBufferRange(bytes, offset);

  const value = unsafeStringify(bytes, offset);

  if (!validate(value)) {
    throw new TypeError("Stringified UUID is invalid");
  }

  return value;
}

function version(value) {
  if (!validate(value)) {
    throw new TypeError("Invalid UUID");
  }

  if (value === NIL) {
    return 0;
  }

  if (value === MAX) {
    return 15;
  }

  return Number.parseInt(value[14], 16);
}

function unsupported(name) {
  return () => {
    throw new Error(
      `${name} is not implemented by WaveStream's TypeORM UUID compatibility shim. Use v4(), parse(), stringify(), validate(), or version().`,
    );
  };
}

module.exports = {
  MAX,
  NIL,
  nil: NIL,
  parse,
  stringify,
  validate,
  v1: unsupported("v1"),
  v1ToV6: unsupported("v1ToV6"),
  v3: unsupported("v3"),
  v4,
  v5: unsupported("v5"),
  v6: unsupported("v6"),
  v6ToV1: unsupported("v6ToV1"),
  v7: unsupported("v7"),
  version,
};
