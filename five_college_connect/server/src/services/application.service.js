import { ApplicationRepository } from "../repositories/application.repository.js";
import { createHttpError } from "../utils/http-error.js";

export class ApplicationService {
  constructor() {
    this.applicationRepository = new ApplicationRepository();
  }

  async createApplication(payload) {
    return this.applicationRepository.createApplication(payload);
  }

  async listApplications(filters) {
    return this.applicationRepository.listApplications(filters);
  }

  async getApplicationById(applicationId) {
    const application = await this.applicationRepository.findById(applicationId);

    if (!application) {
      throw createHttpError(404, "Application not found");
    }

    return application;
  }

  async updateApplication(applicationId, payload) {
    const application = await this.applicationRepository.updateApplication(applicationId, payload);

    if (!application) {
      throw createHttpError(404, "Application not found");
    }

    return application;
  }

  async deleteApplication(applicationId) {
    const deleted = await this.applicationRepository.deleteApplication(applicationId);

    if (!deleted) {
      throw createHttpError(404, "Application not found");
    }
  }
}
