import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Path to the courses.json file
    const filePath = path.join(process.cwd(), 'data', 'courses.json');
    
    // Read the current file
    const fileContents = await fs.readFile(filePath, 'utf8');
    const courses = JSON.parse(fileContents);
    
    // Generate a new ID for the course
    const newId = `p${courses.length + 1}_${Date.now()}`;
    
    // Create the new course object
    const newCourse = {
      id: newId,
      ...data,
      // Default empty enrollment or override if provided
      enrollment: data.enrollment || [],
      // Optional: mock a syllabus or assign as generated
      syllabus: data.syllabus || `./${newId}_course.json`,
    };
    
    // Append the new course
    courses.push(newCourse);
    
    // Write the updated array back to the file
    await fs.writeFile(filePath, JSON.stringify(courses, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, course: newCourse });
  } catch (error) {
    console.error('Error saving new course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
