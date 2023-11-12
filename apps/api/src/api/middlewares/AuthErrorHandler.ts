import { InvalidTokenError, UnauthorizedError } from "express-oauth2-jwt-bearer";
import debug from "debug"
export default (error, request, response, next) => {
    if (error instanceof InvalidTokenError) {
        const message = "Bad credentials";

        response.status(error.status).json({ message });

        return;
    }

    if (error instanceof UnauthorizedError) {
        const message = "Requires authentication";

        response.status(error.status).json({ message });

        return;
    }
    next(error, request, response, next)
};