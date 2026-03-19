import { NextResponse } from 'next/server';
import { getClassroomByCourseId } from '@/lib/data';

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const classroom = getClassroomByCourseId(courseId);
  return NextResponse.json(classroom?.materials || []);
}
