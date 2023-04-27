import { NextResponse } from 'next/server';

const Middleware = (req) => {
  if (req.nextUrl.pathname !== req.nextUrl.pathname.toLowerCase()) {
    const url = req.nextUrl.clone()
    url.pathname = url.pathname.toLowerCase()
    return NextResponse.redirect(url)
  }
  return NextResponse.next();
};

export default Middleware;