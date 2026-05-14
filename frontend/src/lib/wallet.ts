import { Connection, PublicKey } from '@solana/web3.js';

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '';

export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

export function getTreasuryWallet(): string {
  return TREASURY_WALLET;
}

export function formatWallet(wallet: string, chars = 4): string {
  if (!wallet) return '';
  return `${wallet.slice(0, chars)}...${wallet.slice(-chars)}`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function signMessageWithWallet(
  message: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<string | null> {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(encodedMessage);

    const bs58 = await import('bs58');
    return bs58.default.encode(signatureBytes);
  } catch (error) {
    console.error('Sign message error:', error);
    return null;
  }
}
