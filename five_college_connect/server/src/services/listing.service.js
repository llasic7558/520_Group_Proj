import { withTransaction } from "../config/db.js";
import { createHttpError } from "../utils/http-error.js";
import { ListingAttachmentRepository } from "../repositories/listing-attachment.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { ListingSkillRepository } from "../repositories/listing-skill.repository.js";
import { SkillRepository } from "../repositories/skill.repository.js";

export class ListingService {
  constructor() {
    this.listingRepository = new ListingRepository();
    this.listingSkillRepository = new ListingSkillRepository();
    this.listingAttachmentRepository = new ListingAttachmentRepository();
    this.skillRepository = new SkillRepository();
  }

  async createListing(payload) {
    return withTransaction(async (client) => {
      const listing = await this.listingRepository.createListing(payload, client);
      return this.buildListingDetails(listing, payload, client);
    });
  }

  async listListings(filters = {}) {
    const listings = await this.listingRepository.listListings(filters);

    return Promise.all(
      listings.map((listing) => this.buildListingDetails(listing))
    );
  }

  async getListingById(listingId) {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw createHttpError(404, "Listing not found");
    }

    return this.buildListingDetails(listing);
  }

  async updateListing(listingId, payload) {
    return withTransaction(async (client) => {
      const existingListing = await this.listingRepository.findById(listingId, client);

      if (!existingListing) {
        throw createHttpError(404, "Listing not found");
      }

      const updatedListing = await this.listingRepository.updateListing(listingId, payload, client);
      return this.buildListingDetails(updatedListing, payload, client, true);
    });
  }

  async deleteListing(listingId) {
    const deleted = await this.listingRepository.deleteListing(listingId);

    if (!deleted) {
      throw createHttpError(404, "Listing not found");
    }
  }

  async buildListingDetails(
    listing,
    payload = null,
    executor = undefined,
    replaceRelations = false
  ) {
    if (payload?.skills) {
      if (replaceRelations) {
        await this.listingSkillRepository.deleteByListingId(listing.listingId, executor);
      }

      for (const skill of payload.skills) {
        const savedSkill = await this.skillRepository.findOrCreateSkill(
          {
            name: skill.name,
            category: skill.category
          },
          executor
        );

        await this.listingSkillRepository.createListingSkill(
          {
            listingId: listing.listingId,
            skillId: savedSkill.skillId,
            requirementType: skill.requirementType
          },
          executor
        );
      }
    }

    if (payload?.attachments) {
      if (replaceRelations) {
        await this.listingAttachmentRepository.deleteByListingId(listing.listingId, executor);
      }

      for (const attachment of payload.attachments) {
        await this.listingAttachmentRepository.createAttachment(
          {
            listingId: listing.listingId,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType
          },
          executor
        );
      }
    }

    const [skills, attachments] = await Promise.all([
      this.listingSkillRepository.findByListingId(listing.listingId, executor),
      this.listingAttachmentRepository.findByListingId(listing.listingId, executor)
    ]);

    return {
      ...listing,
      skills,
      attachments
    };
  }
}
