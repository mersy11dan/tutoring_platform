export const GOOGLE_NOT_CONNECTED = "Google not connected yet";

export type GoogleEnv = {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  refreshToken?: string;
};

export function readGoogleEnv(env: NodeJS.ProcessEnv = process.env): GoogleEnv {
  const clean = (value: string | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };
  return {
    clientId: clean(env.GOOGLE_CLIENT_ID),
    clientSecret: clean(env.GOOGLE_CLIENT_SECRET),
    redirectUri: clean(env.GOOGLE_REDIRECT_URI),
    refreshToken: clean(env.GOOGLE_REFRESH_TOKEN),
  };
}

export function googleCredentialsPresent(env: GoogleEnv): boolean {
  return Boolean(env.clientId && env.clientSecret && env.redirectUri);
}

export function googleConnection(env: GoogleEnv): { connected: boolean; message: string } {
  if (!googleCredentialsPresent(env) || !env.refreshToken) {
    return { connected: false, message: GOOGLE_NOT_CONNECTED };
  }
  return { connected: true, message: "Google is connected." };
}

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.coursework.students",
];

export const GOOGLE_SCOPES = [CALENDAR_SCOPE, ...CLASSROOM_SCOPES];

export function buildGoogleAuthUrl(env: GoogleEnv, state: string): string | null {
  if (!googleCredentialsPresent(env)) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.clientId!);
  url.searchParams.set("redirect_uri", env.redirectUri!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

type FetchLike = typeof fetch;

async function accessToken(env: GoogleEnv, fetchImpl: FetchLike): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const connection = googleConnection(env);
  if (!connection.connected) return { ok: false, message: GOOGLE_NOT_CONNECTED };
  const body = new URLSearchParams({
    client_id: env.clientId!,
    client_secret: env.clientSecret!,
    refresh_token: env.refreshToken!,
    grant_type: "refresh_token",
  });
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return { ok: false, message: GOOGLE_NOT_CONNECTED };
  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) return { ok: false, message: GOOGLE_NOT_CONNECTED };
  return { ok: true, token: json.access_token };
}

export type MeetResult = { ok: true; link: string } | { ok: false; message: string };

export function createMeetAdapter(env: GoogleEnv, fetchImpl: FetchLike = fetch) {
  return {
    async createMeetLink(input: { title: string; startsAt: string; endsAt: string }): Promise<MeetResult> {
      const token = await accessToken(env, fetchImpl);
      if (!token.ok) return token;
      const response = await fetchImpl(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            summary: input.title,
            start: { dateTime: input.startsAt },
            end: { dateTime: input.endsAt },
            conferenceData: {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          }),
        },
      );
      if (!response.ok) {
        return { ok: false, message: "Google Calendar did not create a Meet link. Paste a link instead." };
      }
      const json = (await response.json()) as {
        hangoutLink?: string;
        conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
      };
      const link =
        json.hangoutLink ??
        json.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri;
      if (!link) return { ok: false, message: "Google Calendar did not return a Meet link. Paste a link instead." };
      return { ok: true, link };
    },
  };
}

export type ClassroomResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function createClassroomAdapter(env: GoogleEnv, fetchImpl: FetchLike = fetch) {
  return {
    async createCourse(name: string): Promise<ClassroomResult<{ courseId: string }>> {
      const token = await accessToken(env, fetchImpl);
      if (!token.ok) return token;
      const response = await fetchImpl("https://classroom.googleapis.com/v1/courses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ name, ownerId: "me", courseState: "ACTIVE" }),
      });
      if (!response.ok) return { ok: false, message: "Google Classroom did not create a course." };
      const json = (await response.json()) as { id?: string };
      if (!json.id) return { ok: false, message: "Google Classroom did not return a course id." };
      return { ok: true, value: { courseId: json.id } };
    },
    async createCourseWork(input: {
      courseId: string;
      title: string;
      description: string;
      dueAt: string | null;
    }): Promise<ClassroomResult<{ courseworkId: string }>> {
      const token = await accessToken(env, fetchImpl);
      if (!token.ok) return token;
      const due = input.dueAt ? new Date(input.dueAt) : null;
      const response = await fetchImpl(
        `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(input.courseId)}/courseWork`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            workType: "ASSIGNMENT",
            state: "PUBLISHED",
            ...(due
              ? {
                  dueDate: { year: due.getUTCFullYear(), month: due.getUTCMonth() + 1, day: due.getUTCDate() },
                  dueTime: { hours: due.getUTCHours(), minutes: due.getUTCMinutes() },
                }
              : {}),
          }),
        },
      );
      if (!response.ok) return { ok: false, message: "Google Classroom did not create the coursework." };
      const json = (await response.json()) as { id?: string };
      if (!json.id) return { ok: false, message: "Google Classroom did not return a coursework id." };
      return { ok: true, value: { courseworkId: json.id } };
    },
  };
}

export async function exchangeGoogleCode(
  env: GoogleEnv,
  code: string,
  fetchImpl: FetchLike = fetch,
): Promise<{ ok: true; refreshToken: string } | { ok: false; message: string }> {
  if (!googleCredentialsPresent(env)) return { ok: false, message: GOOGLE_NOT_CONNECTED };
  const body = new URLSearchParams({
    code,
    client_id: env.clientId!,
    client_secret: env.clientSecret!,
    redirect_uri: env.redirectUri!,
    grant_type: "authorization_code",
  });
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return { ok: false, message: "Google did not accept the authorization code." };
  const json = (await response.json()) as { refresh_token?: string };
  if (!json.refresh_token) {
    return {
      ok: false,
      message: "Google did not return a refresh token. Revoke the app’s access and try the consent screen again.",
    };
  }
  return { ok: true, refreshToken: json.refresh_token };
}
