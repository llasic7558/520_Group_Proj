import { withTransaction } from "../config/db.js";
import { createHttpError } from "../utils/http-error.js";
import { ensureOwnerOrAdmin } from "../utils/authorization.js";
import { ListingAttachmentRepository } from "../repositories/listing-attachment.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { ListingSkillRepository } from "../repositories/listing-skill.repository.js";
import { ProfileRepository } from "../repositories/profile.repository.js";
import { SkillRepository } from "../repositories/skill.repository.js";
import { UserRepository } from "../repositories/user.repository.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ListingService {
  constructor() {
    this.listingRepository = new ListingRepository();
    this.listingSkillRepository = new ListingSkillRepository();
    this.listingAttachmentRepository = new ListingAttachmentRepository();
    this.skillRepository = new SkillRepository();
    this.userRepository = new UserRepository();
    this.profileRepository = new ProfileRepository();
  }

  async createListing(payload, currentUser) {
    const safePayload = {
      ...payload,
      createdByUserId: currentUser.userId
    };

    return withTransaction(async (client) => {
      const listing = await this.listingRepository.createListing(safePayload, client);
      return this.buildListingDetails(listing, safePayload, client);
    });
  }

  async listListings(filters = {}) {
    const normalizedCategory = filters.category?.trim() || "";
    const normalizedQuery = filters.query?.trim() || "";
    const listings = await this.listingRepository.listListings({
      ...filters,
      category: normalizedCategory.toLowerCase() === "all" ? "" : normalizedCategory,
      query: normalizedQuery,
      isListingIdSearch: UUID_PATTERN.test(normalizedQuery)
    });

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

  async updateListing(listingId, payload, currentUser) {
    return withTransaction(async (client) => {
      const existingListing = await this.listingRepository.findById(listingId, client);

      if (!existingListing) {
        throw createHttpError(404, "Listing not found");
      }

      ensureOwnerOrAdmin(currentUser, existingListing.createdByUserId, "listing");

      const updatedListing = await this.listingRepository.updateListing(listingId, payload, client);
      return this.buildListingDetails(updatedListing, payload, client, true);
    });
  }

  async deleteListing(listingId, currentUser) {
    const existingListing = await this.listingRepository.findById(listingId);

    if (!existingListing) {
      throw createHttpError(404, "Listing not found");
    }

    ensureOwnerOrAdmin(currentUser, existingListing.createdByUserId, "listing");

    const closedListing = await this.listingRepository.deleteListing(listingId);

    if (!closedListing) {
      throw createHttpError(404, "Listing not found");
    }

    return this.buildListingDetails(closedListing);
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

    const [skills, attachments, creator, creatorProfile] = await Promise.all([
      this.listingSkillRepository.findByListingId(listing.listingId, executor),
      this.listingAttachmentRepository.findByListingId(listing.listingId, executor),
      this.userRepository.findById(listing.createdByUserId, executor),
      this.profileRepository.findByUserId(listing.createdByUserId, executor)
    ]);

    return {
      ...listing,
      skills,
      attachments,
      creator: creator
        ? {
            ...creator,
            profile: creatorProfile
          }
        : null
    };
  }
}
