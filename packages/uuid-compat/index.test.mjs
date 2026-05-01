import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { parse, stringify, v4, validate, version } from "./index.mjs";

const require = createRequire(import.meta.url);
const commonjsUuid = require("./index.cjs");

test("generates valid v4 UUID strings from ESM and CommonJS", () => {
  const esmValue = v4();
  const cjsValue = commonjsUuid.v4();

  assert.equal(validate(esmValue), true);
  assert.equal(validate(cjsValue), true);
  assert.equal(version(esmValue), 4);
  assert.equal(version(cjsValue), 4);
});

test("supports parse and stringify round-trips", () => {
  const value = v4();
  const bytes = parse(value);

  assert.equal(stringify(bytes), value);
});

test("throws before writing outside caller-provided buffers", () => {
  const buffer = new Uint8Array(8);

  assert.throws(() => v4({}, buffer, 4), RangeError);
  assert.deepEqual([...buffer], [0, 0, 0, 0, 0, 0, 0, 0]);
});

test("writes into caller-provided buffers when range is valid", () => {
  const buffer = new Uint8Array(20);
  const result = v4({}, buffer, 2);

  assert.equal(result, buffer);
  assert.equal(validate(stringify(buffer, 2)), true);
});
