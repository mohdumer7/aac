import { NextResponse } from 'next/server';
import withAuth from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'http://localhost:3000',
  'http://10.20.80.71:3000'
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers
    });
  }

  return response;
}

export default withAuth(
  async function authorized(req) {
    const token = await getToken({ req });
    const url = req.nextUrl.clone();

    // Redirect to home page if the user is not logged in
    if (!token) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }


    if (url.pathname.startsWith('/globalAdmin')) {
      if (token.role !== 'globalAdmin') {
        url.pathname = '/error';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }
);

export const config = { matcher: '/:path*' };