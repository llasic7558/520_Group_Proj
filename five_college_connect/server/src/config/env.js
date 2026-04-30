export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  emailVerificationBaseUrl:
    process.env.EMAIL_VERIFICATION_BASE_URL || "http://localhost:3000/verify-email",
  mailjetApiKey: process.env.MAILJET_API_KEY || "",
  mailjetApiSecret: process.env.MAILJET_API_SECRET || "",
  emailFrom: process.env.EMAIL_FROM || "",
  emailReplyTo: process.env.EMAIL_REPLY_TO || "",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/five_college_connector",
  dbSsl: process.env.DB_SSL === "true",
  authTokenSecret: process.env.AUTH_TOKEN_SECRET || "replace_with_the_secret_key",
  authTokenExpiresInHours: Number(process.env.AUTH_TOKEN_EXPIRES_IN_HOURS || 24),
  emailVerificationExpiresInHours: Number(
    process.env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS || 24
  ),
  allowedEmailDomains: (
    process.env.ALLOWED_EMAIL_DOMAINS ||
    "umass.edu,amherst.edu,smith.edu,hampshire.edu,mtholyoke.edu"
  )
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
};
