import { create } from '@web3-storage/w3up-client';
import { StoreIndexedDB } from '@web3-storage/w3up-client/stores/indexeddb';

let client: Awaited<ReturnType<typeof create>> | null = null;
let isInitializing = false;

export async function getIPFSClient() {
  if (client) return client;

  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (client) return client;
  }

  try {
    isInitializing = true;

    const store = new StoreIndexedDB('w3up');
    client = await create({ store });

    const principal = process.env.NEXT_PUBLIC_W3UP_PRINCIPAL;
    const proof = process.env.NEXT_PUBLIC_W3UP_PROOF;

    if (!principal || !proof) {
      throw new Error(
        'Missing Web3.Storage credentials. Please check your environment variables.'
      );
    }

    // Check if the client already has the space associated with the proof
    const spaces = client.spaces();
    const hasSpace = spaces.some((space) => space.did() === proof);

    if (!hasSpace) {
      // If the space is not present, perform login to obtain delegation
      await client.login(principal as `${string}@${string}`);
    }

    await client.setCurrentSpace(proof as `did:${string}:${string}`);
    return client;
  } catch (error) {
    console.error('Error initializing IPFS client:', error);
    throw new Error(
      `Failed to initialize IPFS client: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  } finally {
    isInitializing = false;
  }
}

export async function uploadToIPFS(data: any) {
  const client = await getIPFSClient();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });
  const cid = await client.uploadFile(file);
  return cid.toString();
}

export async function uploadFileToIPFS(file: File) {
  const client = await getIPFSClient();
  const cid = await client.uploadFile(file);
  return cid.toString();
}

export async function getFromIPFS(cid: string) {
  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  if (!response.ok) throw new Error('Failed to fetch from IPFS');
  return response.json();
}
