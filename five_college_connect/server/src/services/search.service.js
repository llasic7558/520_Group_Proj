import { ListingService } from "./listing.service.js";

export class SearchService {
  constructor() {
    this.listingService = new ListingService();
  }

  async searchListings(filters = {}, executor = undefined) {
    return this.listingService.listListings(filters, executor);
  }
}
