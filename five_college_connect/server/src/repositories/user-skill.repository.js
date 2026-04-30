import { query } from "../config/db.js";

export class UserSkillRepository {
  async createUserSkill(
    { userId, profileId, skillId, proficiencyLevel, isOfferingHelp, isSeekingHelp },
    executor = { query }
  ) {
    const result = await executor.query(
      `
        INSERT INTO user_skills (
          user_id,
          profile_id,
          skill_id,
          proficiency_level,
          is_offering_help,
          is_seeking_help
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          user_skill_id,
          user_id,
          profile_id,
          skill_id,
          proficiency_level,
          is_offering_help,
          is_seeking_help
      `,
      [userId, profileId, skillId, proficiencyLevel, isOfferingHelp, isSeekingHelp]
    );

    return result.rows[0];
  }

  async findSkillsByProfileId(profileId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          us.user_skill_id,
          us.user_id,
          us.profile_id,
          us.skill_id,
          us.proficiency_level,
          us.is_offering_help,
          us.is_seeking_help,
          s.name,
          s.category
        FROM user_skills us
        JOIN skills s ON s.skill_id = us.skill_id
        WHERE us.profile_id = $1
        ORDER BY s.name ASC
      `,
      [profileId]
    );

    return result.rows.map((row) => ({
      userSkillId: row.user_skill_id,
      userId: row.user_id,
      profileId: row.profile_id,
      skillId: row.skill_id,
      name: row.name,
      category: row.category,
      proficiencyLevel: row.proficiency_level,
      isOfferingHelp: row.is_offering_help,
      isSeekingHelp: row.is_seeking_help
    }));
  }

  async deleteByProfileId(profileId, executor = { query }) {
    await executor.query("DELETE FROM user_skills WHERE profile_id = $1", [profileId]);
  }
}
