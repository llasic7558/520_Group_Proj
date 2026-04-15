import { query } from "../config/db.js";
import { User } from "../models/user.model.js";

export class UserRepository {
  async createUser({ email, username, passwordHash, role }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO users (email, username, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING
          user_id,
          username,
          email,
          password_hash,
          role,
          email_verified,
          teacher_badge,
          created_at,
          status
      `,
      [email, username, passwordHash, role]
    );

    return new User(result.rows[0]);
  }

  async findByEmail(email, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          user_id,
          username,
          email,
          password_hash,
          role,
          email_verified,
          teacher_badge,
          created_at,
          status
        FROM users
        WHERE email = $1
      `,
      [email]
    );

    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async findById(id, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          user_id,
          username,
          email,
          password_hash,
          role,
          email_verified,
          teacher_badge,
          created_at,
          status
        FROM users
        WHERE user_id = $1
      `,
      [id]
    );

    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async markEmailVerified(id, executor = { query }) {
    const result = await executor.query(
      `
        UPDATE users
        SET email_verified = TRUE
        WHERE user_id = $1
        RETURNING
          user_id,
          username,
          email,
          password_hash,
          role,
          email_verified,
          teacher_badge,
          created_at,
          status
      `,
      [id]
    );

    return result.rows[0] ? new User(result.rows[0]) : null;
  }
}
