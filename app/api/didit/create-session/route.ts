import { NextResponse } from 'next/server';
import { fetchClientToken } from '../../../lib/didit/fetchClientToken';

export async function POST(request: Request) {
  try {
    const { features, callback, vendor_data } = await request.json();

    if (!features || !callback || !vendor_data) {
      return NextResponse.json(
        { error: 'features, callback, and vendor_data are required' },
        { status: 400 }
      );
    }

    const url = `${process.env.DIDIT_SESSION_URL}/v1/session/`;
    const tokenData = await fetchClientToken();

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Failed to get authentication token' },
        { status: 500 }
      );
    }

    const body = {
      vendor_data,
      callback,
      features,
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify(body),
    };

    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (response.status === 201 && data) {
      return NextResponse.json(data);
    } else {
      console.error('Error creating session:', data.message);
      return NextResponse.json(
        { error: data.message || 'Failed to create session' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Network error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
