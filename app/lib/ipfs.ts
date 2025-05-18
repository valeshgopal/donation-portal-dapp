import { create } from "@web3-storage/w3up-client";
import { StoreIndexedDB } from "@web3-storage/w3up-client/stores/indexeddb";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as Proof from "@web3-storage/w3up-client/proof";

import * as Delegation from "@web3-storage/w3up-client/delegation";
import * as Client from "@web3-storage/w3up-client";

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

    // Create a new client
    client = await create();

    // Fetch the delegation from the backend
    const did = client.agent.did();
    const apiUrl = `/api/w3up-delegation/${encodeURIComponent(did)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch delegation: ${response.statusText}`);
    }
    const data = await response.arrayBuffer();

    // Deserialize the delegation
    const delegation = await Delegation.extract(new Uint8Array(data));
    if (!delegation.ok) {
      throw new Error("Failed to extract delegation", {
        cause: delegation.error,
      });
    }

    // Add proof that this agent has been delegated capabilities on the space
    const space = await client.addSpace(delegation.ok);
    await client.setCurrentSpace(space.did());

    return client;
  } catch (error) {
    console.error("Error initializing IPFS client:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

export async function uploadToIPFS(data: any) {
  const client = await getIPFSClient();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const file = new File([blob], "metadata.json", { type: "application/json" });
  const cid = await client.uploadFile(file);
  return cid.toString();
}
