import { NextResponse } from 'next/server';
import { getQuestions } from '@/lib/data';

export async function GET(request: Request) {
  return NextResponse.json(getQuestions());
}
