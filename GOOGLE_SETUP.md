# Google Meet and Classroom

Meet links and Classroom coursework are real API calls behind adapters. Until the variables below are set, the app keeps working: paste a Meet link by hand, keep assignments in the app, and the interface says **Google not connected yet**.

Nothing in this repository is a live Google integration.

## Cloud project

1. Create or choose a Google Cloud project.
2. Enable **Google Calendar API** and **Google Classroom API**.
3. Configure the OAuth consent screen. Add the test users who will connect the MathPath account.
4. Create an OAuth client of type **Web application**.

## Redirect URI

For local development:

`http://localhost:3000/admin/google/callback`

Set the same value in `GOOGLE_REDIRECT_URI`. Production would use `https://<your-domain>/admin/google/callback` only after you choose to deploy.

## Environment

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/admin/google/callback
GOOGLE_REFRESH_TOKEN=
```

`GOOGLE_REFRESH_TOKEN` stays empty until consent finishes. The client id alone does not mean Google is connected.

## Scopes

- `https://www.googleapis.com/auth/calendar.events` creates a Calendar event with a Meet conference.
- `https://www.googleapis.com/auth/classroom.courses` creates a course.
- `https://www.googleapis.com/auth/classroom.coursework.students` publishes coursework.

## Connect

1. Put the client id, secret, and redirect URI in `.env.local`.
2. Add your address to `ADMIN_EMAILS` and sign in.
3. Open **Settings** and choose **Connect Google**.
4. After consent, copy the refresh token into `GOOGLE_REFRESH_TOKEN` and restart the app.

The token is shown once for you to store on the server. It is not written into the database or this repository.

## What the adapters do

- **Meet:** `events.insert` on the primary calendar with `conferenceDataVersion=1` and a `hangoutsMeet` request.
- **Classroom:** `courses.create`, then `courses.courseWork.create`.

Tests mock those HTTP calls. They do not contact Google.
