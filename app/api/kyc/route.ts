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
      walletAddress: walletAddress.toLowerCase(),
    });

    // Return more detailed status information
    return NextResponse.json(
      {
        exists: !!kycStatus,
        isVerified: kycStatus?.isVerified ?? false,
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
    const { walletAddress, isVerified } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const kycStatus = await KYCVerification.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { isVerified },
      { new: true, upsert: true }
    );

    return NextResponse.json(
      {
        exists: true,
        isVerified: kycStatus.isVerified,
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
