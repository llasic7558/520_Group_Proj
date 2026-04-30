import { query } from "../config/db.js";
import { ListingAttachment } from "../models/listing-attachment.model.js";

export class ListingAttachmentRepository {
  async createAttachment({ listingId, fileUrl, fileType }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO listing_attachments (listing_id, file_url, file_type)
        VALUES ($1, $2, $3)
        RETURNING attachment_id, listing_id, file_url, file_type, uploaded_at
      `,
      [listingId, fileUrl, fileType]
    );

    return new ListingAttachment(result.rows[0]);
  }

  async findByListingId(listingId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT attachment_id, listing_id, file_url, file_type, uploaded_at
        FROM listing_attachments
        WHERE listing_id = $1
        ORDER BY uploaded_at ASC
      `,
      [listingId]
    );

    return result.rows.map((row) => new ListingAttachment(row));
  }

  async findByListingIds(listingIds, executor = { query }) {
    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return new Map();
    }

    const result = await executor.query(
      `
        SELECT attachment_id, listing_id, file_url, file_type, uploaded_at
        FROM listing_attachments
        WHERE listing_id = ANY($1::uuid[])
        ORDER BY listing_id ASC, uploaded_at ASC
      `,
      [listingIds]
    );

    const attachmentsByListingId = new Map();

    for (const row of result.rows) {
      const attachments = attachmentsByListingId.get(row.listing_id) || [];
      attachments.push(new ListingAttachment(row));
      attachmentsByListingId.set(row.listing_id, attachments);
    }

    return attachmentsByListingId;
  }

  async deleteByListingId(listingId, executor = { query }) {
    await executor.query("DELETE FROM listing_attachments WHERE listing_id = $1", [listingId]);
  }
}
