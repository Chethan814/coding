import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // We are only protecting specific participant routes
  const protectedPaths = ['/contest', '/lobby', '/summary', '/instructions'];
  if (!protectedPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    // Edge-compatible Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.PLACEHOLDER";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // In a real system you'd fetch the ACTIVE event. For now, fetch first event or assume 'live' if down.
    const { data: event, error } = await supabase
      .from('events')
      .select('status')
      .limit(1)
      .single();

    const status = event?.status || 'live'; // 'not_started' | 'instructions' | 'live' | 'ended'

    if (path.startsWith('/contest') && status !== 'live') {
      if (status === 'not_started') url.pathname = '/lobby';
      else if (status === 'instructions') url.pathname = '/instructions';
      else if (status === 'ended') url.pathname = '/summary';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/lobby') && status !== 'not_started') {
      if (status === 'instructions') url.pathname = '/instructions';
      else if (status === 'live') url.pathname = '/contest';
      else if (status === 'ended') url.pathname = '/summary';
      return NextResponse.redirect(url);
    }
    
    if (path.startsWith('/instructions') && status !== 'instructions') {
      if (status === 'live') url.pathname = '/contest';
      else if (status === 'not_started') url.pathname = '/lobby';
      else if (status === 'ended') url.pathname = '/summary';
      return NextResponse.redirect(url);
    }

  } catch (error) {
    console.error("Middleware DB check failed, allowing pass-through.");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/contest/:path*', '/lobby', '/summary', '/instructions'],
};
