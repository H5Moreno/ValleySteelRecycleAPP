import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
    try {

        // here we just kept it simple
        // in a real-world application put the userId or ipAddress in the key
        const{success} = await ratelimit.limit("my-rate-limit")

        if (!success) {
            return res.status(429).json({ 
                message: "Too many requests, please try again later." 
            });
        }

        next();
    } catch (error) {
        console.error("Rate limiter error:", error);
        next(error);
    }
};

export default rateLimiter;

