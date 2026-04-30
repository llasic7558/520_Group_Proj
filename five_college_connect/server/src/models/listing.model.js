export class Listing {
  constructor({
    listing_id = null,
    created_by_user_id,
    title,
    description,
    category,
    contact_method = "",
    contact_details = "",
    banner_image_url = "",
    custom_color = "",
    status = "open",
    expiration_date = null,
    created_at = null,
    updated_at = null
  }) {
    this.listingId = listing_id;
    this.createdByUserId = created_by_user_id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.contactMethod = contact_method;
    this.contactDetails = contact_details;
    this.bannerImageUrl = banner_image_url;
    this.customColor = custom_color;
    this.status = status;
    this.expirationDate = expiration_date;
    this.createdAt = created_at;
    this.updatedAt = updated_at;

    // Backward-compatible aliases for older week 2 code.
    this.id = this.listingId;
    this.ownerId = this.createdByUserId;
    this.expiresAt = this.expirationDate;
  }
}
