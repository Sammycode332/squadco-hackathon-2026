const { fail } = require("../utils/response");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return fail(res, "Validation failed", 422, result.error.flatten());
  }

  req.validated = result.data;
  next();
};

module.exports = validate;
