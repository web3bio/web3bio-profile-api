import { NextResponse } from 'next/server';

export const config = {
  matcher: '/profile/:path*',
}

const Middleware = (req: any) => {
  if (req.nextUrl.pathname !== req.nextUrl.pathname.toLowerCase()) {
    const url = req.nextUrl.clone()
    url.pathname = url.pathname.toLowerCase()
    return NextResponse.redirect(url)
  }
  return NextResponse.next();
};

export default Middleware;