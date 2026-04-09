import { ApplicationRepository } from "../repositories/application.repository.js";
import { ListingRepository } from "../repositories/listing.repository.js";
import { ensureOwnerOrAdmin, isAdmin } from "../utils/authorization.js";
import { createHttpError } from "../utils/http-error.js";

export class ApplicationService {
  constructor() {
    this.applicationRepository = new ApplicationRepository();
    this.listingRepository = new ListingRepository();
  }

  async createApplication(payload, currentUser) {
    return this.applicationRepository.createApplication({
      ...payload,
      applicantUserId: currentUser.userId
    });
  }

  async listApplications(filters, currentUser) {
    const safeFilters = { ...filters };

    if (isAdmin(currentUser)) {
      return this.applicationRepository.listApplications(safeFilters);
    }

    if (safeFilters.listingId) {
      const listing = await this.listingRepository.findById(safeFilters.listingId);

      if (!listing) {
        throw createHttpError(404, "Listing not found");
      }

      if (listing.createdByUserId !== currentUser.userId) {
        safeFilters.applicantUserId = currentUser.userId;
      }
    } else {
      safeFilters.applicantUserId = currentUser.userId;
    }

    if (
      filters.applicantUserId &&
      filters.applicantUserId !== currentUser.userId &&
      safeFilters.applicantUserId !== filters.applicantUserId
    ) {
      throw createHttpError(403, "You can only view your own applications");
    }

    return this.applicationRepository.listApplications(safeFilters);
  }

  async getApplicationById(applicationId, currentUser) {
    const application = await this.applicationRepository.findById(applicationId);

    if (!application) {
      throw createHttpError(404, "Application not found");
    }

    if (
      !isAdmin(currentUser) &&
      application.applicantUserId !== currentUser.userId
    ) {
      const listing = await this.listingRepository.findById(application.listingId);

      if (!listing || listing.createdByUserId !== currentUser.userId) {
        throw createHttpError(403, "You can only view applications tied to your account or listings");
      }
    }

    return application;
  }

  async updateApplication(applicationId, payload, currentUser) {
    const existingApplication = await this.applicationRepository.findById(applicationId);

    if (!existingApplication) {
      throw createHttpError(404, "Application not found");
    }

    ensureOwnerOrAdmin(currentUser, existingApplication.applicantUserId, "application");

    const application = await this.applicationRepository.updateApplication(applicationId, payload);

    if (!application) {
      throw createHttpError(404, "Application not found");
    }

    return application;
  }

  async deleteApplication(applicationId, currentUser) {
    const existingApplication = await this.applicationRepository.findById(applicationId);

    if (!existingApplication) {
      throw createHttpError(404, "Application not found");
    }

    ensureOwnerOrAdmin(currentUser, existingApplication.applicantUserId, "application");

    const deleted = await this.applicationRepository.deleteApplication(applicationId);

    if (!deleted) {
      throw createHttpError(404, "Application not found");
    }
  }
}
