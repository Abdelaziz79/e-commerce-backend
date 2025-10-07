// utils/apiFeatures.ts
import { Query, Document, FilterQuery } from "mongoose";
import { ParsedQs } from "qs";

/**
 * API Features class to handle common query operations for Mongoose.
 * This class is designed to be chained.
 *
 * @example
 * // In your controller:
 * const features = new APIFeatures(Product.find(), req.query)
 *   .filter()
 *   .sort()
 *   .limitFields()
 *   .paginate();
 *
 * const products = await features.query;
 * const total = await features.getTotalCount(); // Get total count for pagination
 */
class APIFeatures<T extends Document> {
  // The Mongoose query object we will manipulate
  public query: Query<T[], T>;
  // The Express query string object (e.g., req.query)
  private queryString: ParsedQs;
  // Store the filter conditions separately for counting
  private filterConditions: FilterQuery<T> = {};

  constructor(query: Query<T[], T>, queryString: ParsedQs) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filters the query based on the query string.
   * Handles advanced filtering with MongoDB operators (gte, gt, lte, lt).
   * Excludes special keywords used for other features (page, sort, limit, fields).
   */
  public filter(): this {
    // 1. Create a shallow copy of the query string to modify
    const queryObj = { ...this.queryString };

    // 2. Remove special feature keywords from the filter object
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 3. Convert to string and replace operators (gte, gt, lte, lt) with MongoDB syntax ($gte, $gt, etc.)
    // This is a clever way to handle range queries like ?price[gte]=100
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|in)\b/g,
      (match) => `$${match}`
    );

    // 4. Parse the string back to an object and store it
    this.filterConditions = JSON.parse(queryStr);

    // 5. Apply the filter to the Mongoose query
    this.query = this.query.find(this.filterConditions);

    return this;
  }

  /**
   * Sorts the query results.
   * Allows multiple sort fields, separated by commas (e.g., ?sort=price,-createdAt).
   * Defaults to sorting by creation date descending if no sort is specified.
   */
  public sort(): this {
    if (this.queryString.sort && typeof this.queryString.sort === "string") {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Sensible default sort order
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  /**
   * Limits the fields returned in the results (projection).
   * Allows multiple fields, separated by commas (e.g., ?fields=name,price).
   * Defaults to excluding the '__v' field.
   */
  public limitFields(): this {
    if (
      this.queryString.fields &&
      typeof this.queryString.fields === "string"
    ) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // Exclude the __v field by default for cleaner output
      this.query = this.query.select("-__v");
    }

    return this;
  }

  /**
   * Paginates the query results.
   * Uses 'page' and 'limit' from the query string.
   * Provides sensible defaults if not specified.
   */
  public paginate(): this {
    // Provide robust defaults
    const page = parseInt(String(this.queryString.page), 10) || 1;
    const limit = parseInt(String(this.queryString.limit), 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  /**
   * Efficiently gets the total count of documents that match the filter criteria,
   * before pagination is applied.
   * @returns {Promise<number>} The total number of documents.
   */
  public async getTotalCount(): Promise<number> {
    // This uses the stored filterConditions to count all matching documents
    // without being affected by pagination (.skip/.limit).
    return this.query.model.countDocuments(this.filterConditions);
  }
}

export default APIFeatures;
