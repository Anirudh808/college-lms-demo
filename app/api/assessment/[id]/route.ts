import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing assessment id" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "data", "assessments", `assessment_${id}.json`);
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(fileContent));
  } catch (error) {
    console.error(`Failed to read assessment ${id}:`, error);
    return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
  }
}
