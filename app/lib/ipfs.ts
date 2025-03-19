import { create } from '@web3-storage/w3up-client';

let client: Awaited<ReturnType<typeof create>> | null = null;
let isInitializing = false;

export async function getIPFSClient() {
  if (client) {
    return client;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (client) {
      return client;
    }
  }

  try {
    isInitializing = true;
    client = await create();

    const principal = process.env.NEXT_PUBLIC_W3UP_PRINCIPAL;
    const proof = process.env.NEXT_PUBLIC_W3UP_PROOF;

    if (!principal || !proof) {
      throw new Error(
        'Missing Web3.Storage credentials. Please check your environment variables.'
      );
    }

    await client.login(principal as `${string}@${string}`);

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
  const cid = await client.uploadFile(blob);
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
