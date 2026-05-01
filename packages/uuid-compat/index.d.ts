export const NIL: string;
export const nil: string;
export const MAX: string;

export function v4<TBuffer extends ArrayLike<number> & { [index: number]: number }>(
  options: { random?: ArrayLike<number>; rng?: () => ArrayLike<number> },
  buffer: TBuffer,
  offset?: number,
): TBuffer;
export function v4(options?: { random?: ArrayLike<number>; rng?: () => ArrayLike<number> }): string;

export function parse(value: string): Uint8Array;
export function stringify(bytes: ArrayLike<number>, offset?: number): string;
export function validate(value: unknown): value is string;
export function version(value: string): number;

export function v1(): never;
export function v1ToV6(): never;
export function v3(): never;
export function v5(): never;
export function v6(): never;
export function v6ToV1(): never;
export function v7(): never;
