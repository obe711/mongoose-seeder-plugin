const { getRandomInt } = require("../utils");

function anyone(fromArray = []) {
  return fromArray[getRandomInt(0, fromArray.length)];
}

module.exports = anyone;
