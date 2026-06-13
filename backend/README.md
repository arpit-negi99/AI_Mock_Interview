# Voice-Based AI Mock Interview Backend

Express, MongoDB/Mongoose, JWT, Socket.IO, BullMQ-ready backend for a voice-first mock interview flow.

## Run

```bash
npm install
npm run dev
```

The API starts on `http://localhost:5000`. MongoDB and Redis are optional in development. Without them, the app uses in-memory stores and inline queue execution so the interview flow still works.

## Main Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-registration`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/interviews/start`
- `POST /api/v1/voice/session/:sessionId/answer`
- `GET /api/v1/voice/session/:sessionId/next-question`
- `POST /api/v1/voice/session/:sessionId/transcribe`
- `POST /api/v1/voice/session/:sessionId/speak`

## Authentication

Registration stores a bcrypt-hashed password and sends an OTP before the account can log in. Login returns a short-lived JWT access token in the response body and stores a rotated refresh token in an HTTP-only cookie. The frontend must send credentials with requests to `/auth/refresh-token` and `/auth/logout`, and include the `x-csrf-token` value returned by login or verification.

Useful environment variables:

- `JWT_SECRET` and `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN` for remember-me sessions
- `REFRESH_TOKEN_SESSION_EXPIRES_IN` for browser-session logins
- `CLIENT_ORIGIN` for credentialed CORS

## Socket Events

Client emits: `interview:start`, `candidate:audio-answer`, `candidate:text-answer`, `interview:next-question`, `interview:end`.

Server emits: `ai:speaking`, `ai:question`, `ai:follow-up`, `ai:clarification`, `transcription:completed`, `interview:processing`, `interview:error`, `interview:ended`.
