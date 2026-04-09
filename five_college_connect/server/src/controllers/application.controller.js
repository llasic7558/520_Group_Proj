import { ApplicationService } from "../services/application.service.js";
import {
  validateCreateApplicationPayload,
  validateUpdateApplicationPayload
} from "../validators/application.validator.js";

const applicationService = new ApplicationService();

export async function createApplication(req, res, next) {
  try {
    const payload = validateCreateApplicationPayload(req.body);
    const application = await applicationService.createApplication(payload);

    res.status(201).json({
      message: "Application created successfully",
      application
    });
  } catch (error) {
    next(error);
  }
}

export async function listApplications(req, res, next) {
  try {
    const items = await applicationService.listApplications({
      listingId: req.query.listingId,
      applicantUserId: req.query.applicantUserId,
      status: req.query.status,
      limit: req.query.limit
    });

    res.status(200).json({
      items
    });
  } catch (error) {
    next(error);
  }
}

export async function getApplication(req, res, next) {
  try {
    const application = await applicationService.getApplicationById(req.params.applicationId);

    res.status(200).json({
      application
    });
  } catch (error) {
    next(error);
  }
}

export async function updateApplication(req, res, next) {
  try {
    const payload = validateUpdateApplicationPayload(req.body);
    const application = await applicationService.updateApplication(req.params.applicationId, payload);

    res.status(200).json({
      message: "Application updated successfully",
      application
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteApplication(req, res, next) {
  try {
    await applicationService.deleteApplication(req.params.applicationId);

    res.status(200).json({
      message: "Application deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}
