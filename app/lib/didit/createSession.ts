import { fetchClientToken } from "./fetchClientToken";

export const createSession = async (
  features: string,
  callback: string,
  vendor_data: string
) => {
  const url = `${process.env.NEXT_PUBLIC_DIDIT_SESSION_URL}/v1/session/`;
  const tokenData = await fetchClientToken();

  console.log({ tokenData });

  if (!tokenData) {
    throw new Error("Failed to get authentication token");
  }

  const body = {
    vendor_data: vendor_data,
    callback: callback,
    features: features,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (response.status === 201 && data) {
      return data;
    } else {
      throw new Error(data.message || "Failed to create session");
    }
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};
