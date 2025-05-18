import { create } from '@web3-storage/w3up-client';
import { StoreIndexedDB } from '@web3-storage/w3up-client/stores/indexeddb';
import { Signer } from '@web3-storage/w3up-client/principal/ed25519';
import * as Proof from '@web3-storage/w3up-client/proof';

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

    const principalStr = process.env.NEXT_PUBLIC_W3UP_PRINCIPAL!;
    const proofStr = process.env.NEXT_PUBLIC_W3UP_PROOF!;

    if (!principalStr || !proofStr) {
      throw new Error('Missing principal or proof in environment variables');
    }

    const principal = Signer.parse(principalStr);
    const proof = await Proof.parse(proofStr); // Convert string to Delegation object
    let spaceDid = proof.capabilities[0].with;

    if (!spaceDid.startsWith('did:')) {
      spaceDid = `did:key:${spaceDid}`;
    }

    const store = new StoreIndexedDB('w3up'); // persists space config across sessions
    client = await create({ principal, store });

    await client.addSpace(proof); // Grant access to the space
    await client.setCurrentSpace(spaceDid as `did:${string}:${string}`); // Set current space context

    return client;
  } catch (error) {
    console.error('Error initializing IPFS client:', error);
    throw error;
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

export async function getFromIPFS(cid: string) {
  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  if (!response.ok) throw new Error('Failed to fetch from IPFS');
  return response.json();
}
