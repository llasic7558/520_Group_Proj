import { SearchService } from "../services/search.service.js";

const searchService = new SearchService();

export async function searchListings(req, res, next) {
  try {
    const items = await searchService.searchListings({
      category: req.query.category,
      query: req.query.query,
      status: req.query.status,
      createdByUserId: req.query.createdByUserId,
      limit: req.query.limit
    });

    res.status(200).json({
      items
    });
  } catch (error) {
    next(error);
  }
}
