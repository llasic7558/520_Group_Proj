export class EmailVerificationToken {
  constructor({
    token_id = null,
    user_id,
    token,
    expires_at,
    used_at = null
  }) {
    this.tokenId = token_id;
    this.userId = user_id;
    this.token = token;
    this.expiresAt = expires_at;
    this.usedAt = used_at;
  }
}
