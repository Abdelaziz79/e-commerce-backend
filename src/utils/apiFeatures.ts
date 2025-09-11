import { Query, Document } from "mongoose";
import { ParsedQs } from "qs";
import { Request } from "express";

// Define a more flexible QueryString type that handles Express request query objects
type QueryValue = string | string[] | ParsedQs | ParsedQs[] | undefined;

interface QueryString {
  [key: string]: QueryValue;
}

/**
 * API Features class to handle common query operations
 * - Filtering
 * - Sorting
 * - Field limiting
 * - Pagination
 */
class APIFeatures<T extends Document> {
  public query: Query<T[], T>;
  public queryString: QueryString;

  constructor(
    query: Query<T[], T>,
    queryString: Request["query"] | QueryString
  ) {
    this.query = query;
    this.queryString = queryString as QueryString;
  }

  /**
   * Filtering
   * Example: ?price[gte]=100&category=Electronics
   * Excludes special keywords like page, sort, limit, fields
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "keyword"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering for operators like gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    // Handle keyword search if present
    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword.toString();
      const keywordFilter = {
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      };
      this.query = this.query.find(keywordFilter);
    }

    return this;
  }

  /**
   * Sorting
   * Example: ?sort=price,-createdAt (ascending price, descending createdAt)
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.toString().split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by createdAt descending
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  /**
   * Field limiting
   * Example: ?fields=name,price,rating (select only these fields)
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.toString().split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // By default, exclude the MongoDB __v field
      this.query = this.query.select("-__v");
    }

    return this;
  }

  /**
   * Pagination
   * Example: ?page=2&limit=10
   */
  paginate() {
    const page = this.queryString.page
      ? Number(this.queryString.page.toString())
      : 1;
    const limit = this.queryString.limit
      ? Number(this.queryString.limit.toString())
      : 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  /**
   * Get total count for pagination metadata
   */
  async getTotalCount(): Promise<number> {
    // Create a copy of the query to count total documents
    // This removes pagination but keeps filters
    const countQuery = this.query.model.find(this.query.getFilter());
    return await countQuery.countDocuments();
  }
}

export default APIFeatures;
