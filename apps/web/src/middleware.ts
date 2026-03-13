import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "vi";
  
  const response = NextResponse.next();
  
  if (!request.cookies.has("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000 });
  }
  
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
