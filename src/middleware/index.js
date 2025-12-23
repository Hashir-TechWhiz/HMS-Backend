/**
 * Middleware barrel export
 * Provides a single import point for all middleware
 */
import authenticate from "./authenticate.js";
import authorize from "./authorize.js";
import errorHandler from "./errorHandler.js";

export { authenticate, authorize, errorHandler };

