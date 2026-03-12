import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "submissions");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    const submissionId = crypto.randomUUID();
    data.id = submissionId; // Attach a unique ID to the submission

    const filePath = path.join(DATA_DIR, `submission_${submissionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, id: submissionId });
  } catch (error) {
    console.error("Failed to save submission:", error);
    return NextResponse.json({ success: false, error: "Failed to save submission" }, { status: 500 });
  }
}
