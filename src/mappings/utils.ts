// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BigNumber } from '@ethersproject/bignumber';
import { EthereumLog } from '@subql/types-ethereum';
import bs58 from 'bs58';
import { AirdropAmount } from '../types';
import { BigNumberish } from 'ethers';

export function bytesToIpfsCid(raw: string): string {
  // Add our default ipfs values for first 2 bytes:
  // function:0x12=sha2, size:0x20=256 bits
  // and cut off leading "0x"
  const hashHex = '1220' + raw.slice(2);
  const hashBytes = Buffer.from(hashHex, 'hex');
  return bs58.encode(hashBytes);
}

export function cidToBytes32(cid: string): string {
  return '0x' + Buffer.from(bs58.decode(cid)).slice(2).toString('hex');
}

export function bnToDate(bn: BigNumber): Date {
  return new Date(bn.toNumber() * 1000);
}

export function biToDate(bi: bigint): Date {
  return new Date(Number(bi) * 1000);
}

export const operations: Record<string, (a: bigint, b: bigint) => bigint> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  replace: (a, b) => b,
};

export function min(a: BigNumber, b: BigNumber): BigNumber {
  return a.lte(b) ? a : b;
}

export function getDelegationId(delegator: string, indexer: string): string {
  return `${delegator}:${indexer}`;
}

export function getWithdrawlId(delegator: string, index: BigNumber): string {
  return `${delegator}:${index.toHexString()}`;
}

export function bigNumberFrom(value: unknown): BigNumber {
  try {
    return BigNumber.from(value);
  } catch (e) {
    return BigNumber.from(0);
  }
}

export const toBigNumber = (amount: BigNumberish): BigNumber =>
  BigNumber.from(amount.toString());

// airdropper
export const upsertAirdropper = async (
  address: string,
  airdropAmount: BigNumberish,
  claimedAmount: BigNumberish,
  event: EthereumLog
): Promise<void> => {
  const HANDLER = 'upsertUser';
  const user = await AirdropAmount.get(address);

  if (user) {
    user.totalAirdropAmount = toBigNumber(user.totalAirdropAmount)
      .add(toBigNumber(airdropAmount))
      .toBigInt();
    user.claimedAmount = toBigNumber(user.claimedAmount)
      .add(toBigNumber(claimedAmount))
      .toBigInt();
    user.updateAt = `${HANDLER}:${event.blockNumber}`;

    await user.save();
  } else {
    logger.info(
      `${HANDLER} - create: ${address} - ${event.transactionHash ?? ''}`
    );
    const newAidropAmount = new AirdropAmount(
      address,
      toBigNumber(airdropAmount).toBigInt(),
      toBigNumber(claimedAmount).toBigInt()
    );

    newAidropAmount.createAt = `${HANDLER}:${event.blockNumber}`;
    await newAidropAmount.save();
  }
};
