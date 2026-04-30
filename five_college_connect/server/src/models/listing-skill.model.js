export class ListingSkill {
  constructor({
    listing_skill_id = null,
    listing_id,
    skill_id,
    requirement_type = ""
  }) {
    this.listingSkillId = listing_skill_id;
    this.listingId = listing_id;
    this.skillId = skill_id;
    this.requirementType = requirement_type;

    this.id = this.listingSkillId;
  }
}
