export class Application {
  constructor({
    application_id = null,
    listing_id,
    applicant_user_id,
    status = "submitted",
    message = "",
    submitted_at = null
  }) {
    this.applicationId = application_id;
    this.listingId = listing_id;
    this.applicantUserId = applicant_user_id;
    this.message = message;
    this.status = status;
    this.submittedAt = submitted_at;

    // Backward-compatible aliases for older week 2 code.
    this.id = this.applicationId;
    this.applicantId = this.applicantUserId;
  }
}
