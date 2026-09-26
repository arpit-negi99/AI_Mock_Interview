import { AppError } from '../utils/AppError.js';

// One bounded request: blindly retrying an ambiguous send can deliver duplicate OTPs.
export async function sendBrevoEmail(email, config, fetchImpl = fetch) {
  if (!config.brevoApiKey || !config.emailFrom) {
    throw new AppError('Email delivery is not configured. Contact the site owner.', 503);
  }
  try {
    const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      signal: AbortSignal.timeout(config.emailTimeoutMs || 10000),
      headers: { 'api-key': config.brevoApiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: config.emailFrom, name: config.emailFromName || 'InterviewAI' },
        to: [{ email: email.to }],
        subject: email.subject,
        textContent: email.text,
        htmlContent: email.html,
      }),
    });
    // Never expose the provider response: it may contain addresses or credentials.
    await response.body?.cancel();
    if (!response.ok) {
      throw new AppError(response.status === 429
        ? 'Email sending limit reached. Please try again later.'
        : 'Unable to send OTP email. Please try again later.', response.status === 429 ? 503 : 502);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Email delivery could not be confirmed. Check your inbox before requesting another code.', 502);
  }
}
