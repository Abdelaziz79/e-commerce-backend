import { DataBaseRepository } from "./database.repository";
import { UserDocument as TDocument } from "../../types/user.types";
import { Model } from "mongoose";
export class UserRepository extends DataBaseRepository<TDocument> {
  constructor(protected override model: Model<TDocument>) {
    super(model);
  }
}
