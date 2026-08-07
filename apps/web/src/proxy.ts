import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes=["/track","/resident","/reviewer","/department","/admin","/lite","/sms"];

export function proxy(request: NextRequest) {
  const protectedRoute=protectedPrefixes.some((prefix)=>request.nextUrl.pathname===prefix||request.nextUrl.pathname.startsWith(`${prefix}/`));
  if (protectedRoute&&!request.cookies.has("nivaran_access")) {
    const login=new URL("/login",request.url);
    login.searchParams.set("next",request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config={matcher:["/track/:path*","/resident/:path*","/reviewer/:path*","/department/:path*","/admin/:path*","/lite/:path*","/sms/:path*"]};
