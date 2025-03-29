interface TokenData {
  iss: string;
  iat: number;
  sub: string;
  client_id: string;
  organization_id: string;
  expires_in: number;
  exp: number;
  access_token: string;
}

let cachedToken: TokenData | null = null;

export const fetchClientToken = async () => {
  // Check if we have a valid cached token using exp timestamp
  if (cachedToken && Date.now() / 1000 < cachedToken.exp) {
    return cachedToken;
  }

  const url = process.env.NEXT_PUBLIC_DIDIT_TOKEN_URL + "/auth/v2/token/";
  const clientID = process.env.NEXT_PUBLIC_DIDIT_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_DIDIT_CLIENT_SECRET;

  const encodedCredentials = Buffer.from(
    `${clientID}:${clientSecret}`
  ).toString("base64");
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();

    if (response.ok) {
      // Cache the complete token response
      cachedToken = {
        iss: data.iss,
        iat: data.iat,
        sub: data.sub,
        client_id: data.client_id,
        organization_id: data.organization_id,
        expires_in: data.expires_in,
        exp: data.exp,
        access_token: data.access_token,
      };
      return cachedToken;
    } else {
      console.error("Error fetching client token:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Network error:", error);
    return null;
  }
};
