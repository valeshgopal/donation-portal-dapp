import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../lib/mongodb";
import { KYCVerification } from "../../lib/models/KYCVerification";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const kycStatus = await KYCVerification.findOne({
      walletAddress: walletAddress,
    });

    // Return status information
    return NextResponse.json(
      {
        exists: !!kycStatus,
        status: kycStatus?.status ?? "Not Started",
        data: kycStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in KYC GET route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, status } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const kycStatus = await KYCVerification.findOneAndUpdate(
      { walletAddress: walletAddress },
      { status },
      { new: true, upsert: true }
    );

    return NextResponse.json(
      {
        exists: true,
        status: kycStatus.status,
        data: kycStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in KYC POST route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
