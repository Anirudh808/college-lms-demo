import { NextResponse } from 'next/server';
import { getClassroomByCourseId } from '@/lib/data';

export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  const classroom = getClassroomByCourseId(params.courseId);
  return NextResponse.json(classroom?.materials || []);
}
