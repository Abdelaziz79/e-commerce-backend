import jwt from "jsonwebtoken";
import config from "../config/config";

/**
 * Generate JWT token for authentication
 * @param id User ID to include in the token
 * @returns JWT token
 */
const generateToken = (id: string): string => {
  // @ts-ignore - Ignoring type check for this line as we know config.jwtSecret is a valid secret
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export default generateToken;
