import { ListingService } from "../services/listing.service.js";
import {
  validateCreateListingPayload,
  validateUpdateListingPayload
} from "../validators/listing.validator.js";

const listingService = new ListingService();

export async function createListing(req, res, next) {
  try {
    // Expected frontend payload:
    // {
    //   createdByUserId,
    //   title,
    //   description,
    //   category,
    //   contactMethod,
    //   contactDetails,
    //   bannerImageUrl,
    //   customColor,
    //   status,
    //   expirationDate,
    //   skills: [{ name, category, requirementType }],
    //   attachments: [{ fileUrl, fileType }]
    // }
    const payload = validateCreateListingPayload({
      ...req.body,
      createdByUserId: req.user.userId
    });
    const listing = await listingService.createListing(payload, req.user);

    res.status(201).json({
      message: "Listing created successfully",
      listing
    });
  } catch (error) {
    next(error);
  }
}

export async function listListings(req, res, next) {
  try {
    const listings = await listingService.listListings({
      category: req.query.category,
      query: req.query.query,
      status: req.query.status,
      createdByUserId: req.query.createdByUserId,
      limit: req.query.limit
    });

    res.status(200).json({
      items: listings
    });
  } catch (error) {
    next(error);
  }
}

export async function getListing(req, res, next) {
  try {
    const listing = await listingService.getListingById(req.params.listingId);

    res.status(200).json({
      listing
    });
  } catch (error) {
    next(error);
  }
}

export async function updateListing(req, res, next) {
  try {
    const payload = validateUpdateListingPayload(req.body);
    const listing = await listingService.updateListing(req.params.listingId, payload, req.user);

    res.status(200).json({
      message: "Listing updated successfully",
      listing
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteListing(req, res, next) {
  try {
    const listing = await listingService.deleteListing(req.params.listingId, req.user);

    res.status(200).json({
      message: "Listing closed successfully",
      listing
    });
  } catch (error) {
    next(error);
  }
}

export async function reopenListing(req, res, next) {
  try {
    const listing = await listingService.reopenListing(req.params.listingId, req.user);

    res.status(200).json({
      message: "Listing reopened successfully",
      listing
    });
  } catch (error) {
    next(error);
  }
}

export async function permanentlyDeleteListing(req, res, next) {
  try {
    await listingService.permanentlyDeleteListing(req.params.listingId, req.user);

    res.status(200).json({
      message: "Listing permanently deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}
