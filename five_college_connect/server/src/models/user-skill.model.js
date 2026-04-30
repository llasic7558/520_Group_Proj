export class UserSkill {
  constructor({
    user_skill_id = null,
    user_id,
    profile_id,
    skill_id,
    proficiency_level = "",
    is_offering_help = false,
    is_seeking_help = false
  }) {
    this.userSkillId = user_skill_id;
    this.userId = user_id;
    this.profileId = profile_id;
    this.skillId = skill_id;
    this.proficiencyLevel = proficiency_level;
    this.isOfferingHelp = is_offering_help;
    this.isSeekingHelp = is_seeking_help;

    this.id = this.userSkillId;
  }
}
