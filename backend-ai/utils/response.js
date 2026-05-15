const success = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, message, statusCode = 400, data = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

module.exports = { success, fail };
