import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    try {
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
    '/((?!api/auth|api/register|_next/static|_next/image|favicon.ico).*)',
  ],
};
