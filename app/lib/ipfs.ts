import { create } from '@web3-storage/w3up-client';

let client: Awaited<ReturnType<typeof create>> | null = null;

export async function getIPFSClient() {
  if (client) return client;

  try {
    client = await create();
    await client.login(
      process.env.NEXT_PUBLIC_W3UP_PRINCIPAL! as `${string}@${string}`
    );
    await client.setCurrentSpace(
      process.env.NEXT_PUBLIC_W3UP_PROOF! as `did:${string}:${string}`
    );
    return client;
  } catch (error) {
    console.error('Error initializing IPFS client:', error);
    throw error;
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
