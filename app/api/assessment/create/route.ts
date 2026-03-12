import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "assessments");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    if (!data.id) {
      data.id = crypto.randomUUID();
    }

    const filePath = path.join(DATA_DIR, `assessment_${data.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Failed to create assessment:", error);
    return NextResponse.json({ success: false, error: "Failed to create assessment" }, { status: 500 });
  }
}
