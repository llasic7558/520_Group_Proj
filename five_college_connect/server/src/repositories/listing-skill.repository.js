import { query } from "../config/db.js";
import { ListingSkill } from "../models/listing-skill.model.js";

export class ListingSkillRepository {
  async createListingSkill({ listingId, skillId, requirementType }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO listing_skills (listing_id, skill_id, requirement_type)
        VALUES ($1, $2, $3)
        RETURNING listing_skill_id, listing_id, skill_id, requirement_type
      `,
      [listingId, skillId, requirementType]
    );

    return new ListingSkill(result.rows[0]);
  }

  async findByListingId(listingId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          ls.listing_skill_id,
          ls.listing_id,
          ls.skill_id,
          ls.requirement_type,
          s.name,
          s.category
        FROM listing_skills ls
        JOIN skills s ON s.skill_id = ls.skill_id
        WHERE ls.listing_id = $1
        ORDER BY s.name ASC
      `,
      [listingId]
    );

    return result.rows.map((row) => ({
      listingSkillId: row.listing_skill_id,
      listingId: row.listing_id,
      skillId: row.skill_id,
      name: row.name,
      category: row.category,
      requirementType: row.requirement_type
    }));
  }

  async deleteByListingId(listingId, executor = { query }) {
    await executor.query("DELETE FROM listing_skills WHERE listing_id = $1", [listingId]);
  }
}
