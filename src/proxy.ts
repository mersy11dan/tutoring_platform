import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authorize, type Actor } from "@/domain/access";
import { isHiringStatus } from "@/domain/hiring";
import { adminEmails } from "@/lib/env";
import { openSession, sessionSecret } from "@/lib/session-token";
import { isSupabaseConfigured } from "@/lib/supabase/service";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  let actor: Actor | null = null;

  if (isSupabaseConfigured()) {
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    const email = data?.claims?.email?.toLowerCase();
    const sub = data?.claims?.sub;
    if (email && sub) {
      const meta = (data?.claims?.app_metadata ?? {}) as { account_type?: Actor["accountType"]; hiring_status?: string | null };
      actor = {
        id: sub,
        email,
        fullName: "",
        accountType: meta.account_type === "teacher" || meta.account_type === "admin" ? meta.account_type : "student",
        hiringStatus: meta.hiring_status && isHiringStatus(meta.hiring_status) ? meta.hiring_status : null,
        isAdmin: adminEmails().includes(email),
      };
    }
  } else {
    const token = request.cookies.get("studio_session")?.value;
    if (token) {
      const claims = await openSession(token, sessionSecret());
      if (claims && (claims.accountType === "student" || claims.accountType === "teacher" || claims.accountType === "admin")) {
        actor = {
          id: claims.sub,
          email: claims.email.toLowerCase(),
          fullName: claims.fullName,
          accountType: claims.accountType,
          hiringStatus: claims.hiringStatus && isHiringStatus(claims.hiringStatus) ? claims.hiringStatus : null,
          isAdmin: adminEmails().includes(claims.email.toLowerCase()),
        };
      }
    }
  }

  const decision = authorize(request.nextUrl.pathname, actor);
  if (!decision.ok) {
    const redirectResponse = NextResponse.redirect(new URL(decision.redirectTo, request.url));
    for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(header);
      if (value) redirectResponse.headers.set(header, value);
    }
    return redirectResponse;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
