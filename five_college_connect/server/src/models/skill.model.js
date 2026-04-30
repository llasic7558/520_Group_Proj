export class Skill {
  constructor({
    skill_id = null,
    name = "",
    category = ""
  }) {
    this.skillId = skill_id;
    this.name = name;
    this.category = category;

    this.id = this.skillId;
  }
}
