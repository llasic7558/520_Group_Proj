export class GroupMember {
  constructor({
    group_member_id = null,
    group_id,
    user_id,
    member_role = "",
    joined_at = null
  }) {
    this.groupMemberId = group_member_id;
    this.groupId = group_id;
    this.userId = user_id;
    this.memberRole = member_role;
    this.joinedAt = joined_at;

    this.id = this.groupMemberId;
  }
}
