import { NextRequest, NextResponse } from 'next/server';
import * as Client from '@web3-storage/w3up-client';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import * as Proof from '@web3-storage/w3up-client/proof';
import { Signer } from '@web3-storage/w3up-client/principal/ed25519';
import * as DID from '@ipld/dag-ucan/did';

// This route handles POST requests for delegation without a DID in the URL path
export async function POST(request: NextRequest) {
  try {
    const { did } = await request.json();

    if (!did || !did.startsWith('did:')) {
      return NextResponse.json(
        { error: 'Valid DID is required' },
        { status: 400 }
      );
    }

    const delegation = await createDelegation(did as `did:${string}:${string}`);

    return NextResponse.json({
      delegation: delegation ? Buffer.from(delegation).toString('base64') : '',
    });
  } catch (error) {
    console.error('Delegation error:', error);
    return NextResponse.json(
      { error: 'Failed to create delegation' },
      { status: 500 }
    );
  }
}

async function createDelegation(did: `did:${string}:${string}`) {
  // Load client with specific private key
  const principal = Signer.parse(process.env.W3UP_PRINCIPAL!);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  // Add proof that this agent has been delegated capabilities on the space
  const proof = await Proof.parse(process.env.W3UP_PROOF!);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  // Create a delegation for a specific DID
  const audience = DID.parse(did);
  const abilities = [
    'space/blob/add',
    'space/index/add',
    'filecoin/offer',
    'upload/add',
  ];
  const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours from now
  const delegation = await client.createDelegation(audience, abilities, {
    expiration,
  });

  // Serialize the delegation and send it to the client
  const archive = await delegation.archive();
  return archive.ok;
}
