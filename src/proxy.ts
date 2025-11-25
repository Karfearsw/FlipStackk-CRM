import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { FEATURE_WHATSAPP, FEATURE_DISCORD, FEATURE_MARKETING_AUTOMATION, FEATURE_VIDEO, FEATURE_MAP, FEATURE_REALTIME } from '@/lib/features';

export default withAuth(
  function proxy(req) {
    try {
      const { pathname } = req.nextUrl;
      const gates: Array<{ enabled: boolean; paths: string[] }> = [
        { enabled: FEATURE_WHATSAPP, paths: ['/api/whatsapp', '/whatsapp'] },
        { enabled: FEATURE_DISCORD, paths: ['/api/discord'] },
        { enabled: FEATURE_MARKETING_AUTOMATION, paths: ['/api/marketing-automation', '/marketing-automation'] },
        { enabled: FEATURE_VIDEO, paths: ['/communication/video'] },
        { enabled: FEATURE_MAP, paths: ['/map'] },
        { enabled: FEATURE_REALTIME, paths: ['/api/channels', '/api/messages'] },
      ];
      for (const gate of gates) {
        if (!gate.enabled && gate.paths.some(p => pathname.startsWith(p))) {
          if (pathname.startsWith('/api/')) {
            return new NextResponse(JSON.stringify({ message: 'Feature disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }
          return NextResponse.rewrite(new URL('/_not-found', req.url));
        }
      }
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        if (pathname.startsWith('/auth')) {
          return true;
        }
        
        return !!token;
      },
    },
    pages: {
      signIn: '/auth',
    },
  }
);

export const config = {
  matcher: [
    // Exclude health endpoint from auth & processing to allow diagnostics without session
    '/((?!api/auth|api/register|api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};
