const bcrypt = require("bcryptjs");
const store = require("../../utils/store");
const generateToken = require("../../utils/generateToken");

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

const register = async ({ name, phone, password, role = "agent" }) => {
  const exists = store.users.find((user) => user.phone === phone);

  if (exists) {
    const error = new Error("Phone number already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = {
    id: `usr_${Date.now()}`,
    name,
    phone,
    role,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);

  return {
    user: publicUser(user),
    token: generateToken({ id: user.id, role: user.role }),
  };
};

const login = async ({ phone, password }) => {
  const user = store.users.find((item) => item.phone === phone);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error("Invalid phone number or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: publicUser(user),
    token: generateToken({ id: user.id, role: user.role }),
  };
};

module.exports = { register, login };
