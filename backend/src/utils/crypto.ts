
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

export function generateReference(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSessionToken(): string {
  return generateToken();
}

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {

    if (!message || !signature || !publicKey) {
      console.error('verifySignature: Missing required parameters');
      return false;
    }

    let publicKeyBytes: Uint8Array;
    try {
      publicKeyBytes = bs58.decode(publicKey);
      if (publicKeyBytes.length !== 32) {
        console.error('verifySignature: Public key must be 32 bytes, got', publicKeyBytes.length);
        return false;
      }
    } catch (e) {
      console.error('verifySignature: Failed to decode public key', e);
      return false;
    }

    let signatureBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(signature);
      if (signatureBytes.length !== 64) {
        console.error('verifySignature: Signature must be 64 bytes, got', signatureBytes.length);
        return false;
      }
    } catch (e) {
      console.error('verifySignature: Failed to decode signature', e);
      return false;
    }

    const messageBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    console.log('verifySignature result:', isValid);
    return isValid;
  } catch (error) {
    console.error('verifySignature error:', error);
    return false;
  }
}
