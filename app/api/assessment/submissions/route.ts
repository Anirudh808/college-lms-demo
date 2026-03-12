import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { AssessmentSubmission } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data", "submissions");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId");

    try {
      await fs.access(DATA_DIR);
    } catch {
      return NextResponse.json([]); // return empty array if dir doesn't exist yet
    }

    const files = await fs.readdir(DATA_DIR);
    const submissions: AssessmentSubmission[] = [];

    for (const file of files) {
      if (file.startsWith("submission_") && file.endsWith(".json")) {
        const filePath = path.join(DATA_DIR, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const submission: AssessmentSubmission = JSON.parse(fileContent);
        
        if (!assessmentId || submission.assessmentId === assessmentId) {
          submissions.push(submission);
        }
      }
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Failed to list submissions:", error);
    return NextResponse.json({ success: false, error: "Failed to list submissions" }, { status: 500 });
  }
}
