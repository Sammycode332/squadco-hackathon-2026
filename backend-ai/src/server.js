const app = require("./app");
const env = require("../config/env");

if (process.argv.includes("--check")) {
  console.log("Server files loaded successfully");
  process.exit(0);
}

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
