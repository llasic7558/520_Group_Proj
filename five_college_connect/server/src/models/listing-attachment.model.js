export class ListingAttachment {
  constructor({
    attachment_id = null,
    listing_id,
    file_url = "",
    file_type = "",
    uploaded_at = null
  }) {
    this.attachmentId = attachment_id;
    this.listingId = listing_id;
    this.fileUrl = file_url;
    this.fileType = file_type;
    this.uploadedAt = uploaded_at;

    this.id = this.attachmentId;
  }
}
