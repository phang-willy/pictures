import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_PATHNAME_HEADER } from "@/lib/admin-metadata";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ADMIN_PATHNAME_HEADER, request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
