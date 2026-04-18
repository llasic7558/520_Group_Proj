import { query } from "../config/db.js";
import { Listing } from "../models/listing.model.js";

export class ListingRepository {
  async createListing(
    {
      createdByUserId,
      title,
      description,
      category,
      contactMethod,
      contactDetails,
      bannerImageUrl,
      customColor,
      status,
      expirationDate
    },
    executor = { query }
  ) {
    const result = await executor.query(
      `
        INSERT INTO listings (
          created_by_user_id,
          title,
          description,
          category,
          contact_method,
          contact_details,
          banner_image_url,
          custom_color,
          status,
          expiration_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          listing_id,
          created_by_user_id,
          title,
          description,
          category,
          contact_method,
          contact_details,
          banner_image_url,
          custom_color,
          status,
          expiration_date,
          created_at,
          updated_at
      `,
      [
        createdByUserId,
        title,
        description,
        category,
        contactMethod,
        contactDetails,
        bannerImageUrl,
        customColor,
        status,
        expirationDate
      ]
    );

    return new Listing(result.rows[0]);
  }

  async findById(listingId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          listing_id,
          created_by_user_id,
          title,
          description,
          category,
          contact_method,
          contact_details,
          banner_image_url,
          custom_color,
          status,
          expiration_date,
          created_at,
          updated_at
        FROM listings
        WHERE listing_id = $1
      `,
      [listingId]
    );

    return result.rows[0] ? new Listing(result.rows[0]) : null;
  }

  async listListings(filters = {}, executor = { query }) {
    const category = filters.category?.trim() || "";
    const searchQuery = filters.query?.trim() || "";
    const isListingIdSearch = Boolean(filters.isListingIdSearch) && searchQuery !== "";
    const status = filters.status?.trim() || "";
    const createdByUserId = filters.createdByUserId?.trim() || "";
    const limitValue = Number(filters.limit);
    const limit = Number.isNaN(limitValue) || limitValue <= 0 ? 20 : Math.min(limitValue, 50);

    const result = await executor.query(
      `
        SELECT
          listing_id,
          created_by_user_id,
          title,
          description,
          category,
          contact_method,
          contact_details,
          banner_image_url,
          custom_color,
          status,
          expiration_date,
          created_at,
          updated_at
        FROM listings
        WHERE ($1 = '' OR category = $1)
          AND ($2 = '' OR (
            $3 = TRUE AND listing_id = $2::uuid
          ) OR (
            $3 = FALSE AND title ILIKE '%' || $2 || '%'
          ))
          AND ($4 = '' OR status = $4)
          AND ($5 = '' OR created_by_user_id = $5::uuid)
        ORDER BY created_at DESC
        LIMIT $6
      `,
      [category, searchQuery, isListingIdSearch, status, createdByUserId, limit]
    );

    return result.rows.map((row) => new Listing(row));
  }

  async updateListing(
    listingId,
    {
      title,
      description,
      category,
      contactMethod,
      contactDetails,
      bannerImageUrl,
      customColor,
      status,
      expirationDate
    },
    executor = { query }
  ) {
    const result = await executor.query(
      `
        UPDATE listings
        SET
          title = $2,
          description = $3,
          category = $4,
          contact_method = $5,
          contact_details = $6,
          banner_image_url = $7,
          custom_color = $8,
          status = $9,
          expiration_date = $10,
          updated_at = NOW()
        WHERE listing_id = $1
        RETURNING
          listing_id,
          created_by_user_id,
          title,
          description,
          category,
          contact_method,
          contact_details,
          banner_image_url,
          custom_color,
          status,
          expiration_date,
          created_at,
          updated_at
      `,
      [
        listingId,
        title,
        description,
        category,
        contactMethod,
        contactDetails,
        bannerImageUrl,
        customColor,
        status,
        expirationDate
      ]
    );

    return result.rows[0] ? new Listing(result.rows[0]) : null;
  }

  async deleteListing(listingId, executor = { query }) {
    const result = await executor.query(
      `
        DELETE FROM listings
        WHERE listing_id = $1
        RETURNING listing_id
      `,
      [listingId]
    );

    return result.rowCount > 0;
  }
}
