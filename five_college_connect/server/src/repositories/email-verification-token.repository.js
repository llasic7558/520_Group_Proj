import { query } from "../config/db.js";
import { EmailVerificationToken } from "../models/email-verification-token.model.js";

export class EmailVerificationTokenRepository {
  async createToken({ userId, token, expiresAt }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING token_id, user_id, token, expires_at, used_at
      `,
      [userId, token, expiresAt]
    );

    return new EmailVerificationToken(result.rows[0]);
  }

  async findByToken(token, executor = { query }) {
    const result = await executor.query(
      `
        SELECT token_id, user_id, token, expires_at, used_at
        FROM email_verification_tokens
        WHERE token = $1
      `,
      [token]
    );

    return result.rows[0] ? new EmailVerificationToken(result.rows[0]) : null;
  }

  async markUsed(tokenId, executor = { query }) {
    const result = await executor.query(
      `
        UPDATE email_verification_tokens
        SET used_at = NOW()
        WHERE token_id = $1
        RETURNING token_id, user_id, token, expires_at, used_at
      `,
      [tokenId]
    );

    return result.rows[0] ? new EmailVerificationToken(result.rows[0]) : null;
  }

  async invalidateActiveTokensForUser(userId, executor = { query }) {
    await executor.query(
      `
        UPDATE email_verification_tokens
        SET used_at = NOW()
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [userId]
    );
  }
}
