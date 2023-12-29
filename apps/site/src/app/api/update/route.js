import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('secret');

  // Check for secret to confirm this is a valid request
  if (token !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  try {
    revalidatePath('/');
    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    return NextResponse.json({ message: `Error revalidating ${err.message}` }, { status: 500 });
  }
}
