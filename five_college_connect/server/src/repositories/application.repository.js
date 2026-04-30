import { query } from "../config/db.js";
import { Application } from "../models/application.model.js";

export class ApplicationRepository {
  async createApplication({ listingId, applicantUserId, message, status }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO applications (listing_id, applicant_user_id, message, status)
        VALUES ($1, $2, $3, $4)
        RETURNING application_id, listing_id, applicant_user_id, message, status, submitted_at
      `,
      [listingId, applicantUserId, message, status]
    );

    return new Application(result.rows[0]);
  }

  async findById(applicationId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT application_id, listing_id, applicant_user_id, message, status, submitted_at
        FROM applications
        WHERE application_id = $1
      `,
      [applicationId]
    );

    return result.rows[0] ? new Application(result.rows[0]) : null;
  }

  async listApplications(filters = {}, executor = { query }) {
    const listingId = filters.listingId?.trim() || "";
    const applicantUserId = filters.applicantUserId?.trim() || "";
    const status = filters.status?.trim() || "";
    const limitValue = Number(filters.limit);
    const limit = Number.isNaN(limitValue) || limitValue <= 0 ? 20 : Math.min(limitValue, 50);

    const result = await executor.query(
      `
        SELECT application_id, listing_id, applicant_user_id, message, status, submitted_at
        FROM applications
        WHERE ($1 = '' OR listing_id = $1::uuid)
          AND ($2 = '' OR applicant_user_id = $2::uuid)
          AND ($3 = '' OR status = $3)
        ORDER BY submitted_at DESC
        LIMIT $4
      `,
      [listingId, applicantUserId, status, limit]
    );

    return result.rows.map((row) => new Application(row));
  }

  async updateApplication(applicationId, { message, status }, executor = { query }) {
    const result = await executor.query(
      `
        UPDATE applications
        SET message = $2,
            status = $3
        WHERE application_id = $1
        RETURNING application_id, listing_id, applicant_user_id, message, status, submitted_at
      `,
      [applicationId, message, status]
    );

    return result.rows[0] ? new Application(result.rows[0]) : null;
  }

  async updateApplicationStatus(applicationId, status, executor = { query }) {
    const result = await executor.query(
      `
        UPDATE applications
        SET status = $2
        WHERE application_id = $1
        RETURNING application_id, listing_id, applicant_user_id, message, status, submitted_at
      `,
      [applicationId, status]
    );

    return result.rows[0] ? new Application(result.rows[0]) : null;
  }

  async deleteApplication(applicationId, executor = { query }) {
    const result = await executor.query(
      `
        DELETE FROM applications
        WHERE application_id = $1
        RETURNING application_id
      `,
      [applicationId]
    );

    return result.rowCount > 0;
  }
}
