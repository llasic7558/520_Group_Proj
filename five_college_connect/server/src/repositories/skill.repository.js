import { query } from "../config/db.js";
import { Skill } from "../models/skill.model.js";

export class SkillRepository {
  async findByNameAndCategory(name, category, executor = { query }) {
    const result = await executor.query(
      `
        SELECT skill_id, name, category
        FROM skills
        WHERE name = $1 AND category = $2
      `,
      [name, category]
    );

    return result.rows[0] ? new Skill(result.rows[0]) : null;
  }

  async createSkill({ name, category }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO skills (name, category)
        VALUES ($1, $2)
        RETURNING skill_id, name, category
      `,
      [name, category]
    );

    return new Skill(result.rows[0]);
  }

  async findOrCreateSkill(skillPayload, executor = { query }) {
    const existingSkill = await this.findByNameAndCategory(
      skillPayload.name,
      skillPayload.category,
      executor
    );

    if (existingSkill) {
      return existingSkill;
    }

    return this.createSkill(skillPayload, executor);
  }
}
