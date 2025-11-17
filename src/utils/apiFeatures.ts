// utils/apiFeatures.ts
import { Query, Document, FilterQuery } from "mongoose";
import { ParsedQs } from "qs";

/**
 * API Features class to handle common query operations for Mongoose.
 * This class is designed to be chained.
 */
class APIFeatures<T extends Document> {
  public query: Query<T[], T>;
  private queryString: ParsedQs;
  // Store the filter conditions separately for counting
  public filterConditions: FilterQuery<T> = {};
  // Store the initial filter from the query (e.g., { isActive: true })
  private initialFilter: FilterQuery<T> = {};

  constructor(query: Query<T[], T>, queryString: ParsedQs) {
    this.query = query;
    this.queryString = queryString;

    // Extract the initial filter from the query (e.g., { isActive: true })
    // This is a bit hacky but works for our use case
    const queryFilter = query.getFilter();
    this.initialFilter = { ...queryFilter };
  }

  /**
   * Filters the query based on the query string.
   * Handles advanced filtering with MongoDB operators (gte, gt, lte, lt).
   * Excludes special keywords used for other features (page, sort, limit, fields).
   */
  public filter(): this {
    const queryObj = { ...this.queryString };

    // Remove special feature keywords from the filter object
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Convert to string and replace operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|in)\b/g,
      (match) => `$${match}`
    );

    // Parse and merge with initial filter (e.g., { isActive: true })
    const parsedFilter = JSON.parse(queryStr);
    this.filterConditions = { ...this.initialFilter, ...parsedFilter };

    // Apply the filter to the Mongoose query
    this.query = this.query.find(this.filterConditions);

    return this;
  }

  /**
   * Sorts the query results.
   */
  public sort(): this {
    if (this.queryString.sort && typeof this.queryString.sort === "string") {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  /**
   * Limits the fields returned in the results (projection).
   */
  public limitFields(): this {
    if (
      this.queryString.fields &&
      typeof this.queryString.fields === "string"
    ) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  /**
   * Paginates the query results.
   */
  public paginate(): this {
    const page = parseInt(String(this.queryString.page), 10) || 1;
    const limit = parseInt(String(this.queryString.limit), 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  /**
   * Gets the total count of documents that match the filter criteria.
   * This includes the initial filter (e.g., { isActive: true })
   */
  public async getTotalCount(): Promise<number> {
    return this.query.model.countDocuments(this.filterConditions);
  }
}

export default APIFeatures;
