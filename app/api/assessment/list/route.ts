import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Assessment } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data", "assessments");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    // Ensure directory exists
    try {
      await fs.access(DATA_DIR);
    } catch {
      return NextResponse.json([]); // return empty array if dir doesn't exist
    }

    const files = await fs.readdir(DATA_DIR);
    const assessments: Assessment[] = [];

    for (const file of files) {
      if (file.startsWith("assessment_") && file.endsWith(".json")) {
        const filePath = path.join(DATA_DIR, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const assessment: Assessment = JSON.parse(fileContent);
        
        if (!courseId || assessment.courseId === courseId) {
          assessments.push(assessment);
        }
      }
    }

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("Failed to list assessments:", error);
    return NextResponse.json({ success: false, error: "Failed to list assessments" }, { status: 500 });
  }
}
