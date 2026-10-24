import { NextResponse } from "next/server";
import { mlClient } from "@/lib/ml-client";
import { create } from "@bufbuild/protobuf";
import { ScanRequestSchema } from "@/gen/es/goatmaster/ml/v1/ml_service_pb";

export async function POST(req: Request) {
  const body = await req.json();
  const request = create(ScanRequestSchema, {
    imageB64: body.image_b64 ?? body.imageB64 ?? "",
    userId: BigInt(body.user_id ?? body.userId ?? 0),
  });
  const res = await mlClient.scan(request);
  return NextResponse.json({
    goat: res.goat
      ? {
          id: Number(res.goat.id),
          name: res.goat.name,
          breed: res.goat.breed,
          sex: res.goat.sex,
          image_url: res.goat.imageUrl,
        }
      : null,
    confidence: res.confidence,
    method: res.method,
    detected: res.detected,
  });
}
