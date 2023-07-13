import { NextResponse } from "next/server";
export var config = {
    matcher: "/profile/:path*",
};
var Middleware = function (req) {
    if (req.nextUrl.pathname !== req.nextUrl.pathname.toLowerCase()) {
        var url = req.nextUrl.clone();
        url.pathname = url.pathname.toLowerCase();
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
};
export default Middleware;