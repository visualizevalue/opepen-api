export function getRandomBigInt(bits: number = 256): bigint {
  let randomBigInt = BigInt(0);

  for (let i = 0; i < bits; i++) {
    const randomNumber = Math.floor(Math.random() * 2);
    randomBigInt += BigInt(randomNumber) << BigInt(i);
  }

  return randomBigInt;
}

export function getRandomSafeBigInt(): bigint {
  return getRandomBigInt () % BigInt(Number.MAX_SAFE_INTEGER)
}

export function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
