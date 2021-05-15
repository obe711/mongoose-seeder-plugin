const { getRandomInt } = require("../utils");
const { firstName } = require("./names");

function email() {
  return `${firstName()}${getRandomInt(100, 999)}@sigconsultingservices.com`;
}

module.exports = email;
