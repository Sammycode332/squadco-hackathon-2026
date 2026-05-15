const store = require("../../utils/store");

const listUsers = () => {
  return store.users.map((user) => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  }));
};

module.exports = { listUsers };
