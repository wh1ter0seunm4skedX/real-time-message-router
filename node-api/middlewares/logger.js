// logger.js is a middleware that logs the HTTP method and URL of each request to the console.

function logger(req, res, next) {
    console.log(`${req.method} ${req.url}`);
    next();
}

module.exports = logger;
