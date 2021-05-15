const { getRandomInt } = require("../utils");

function phone() {
  const preDigit = getRandomInt(3, 9);
  const pre = `${preDigit}${preDigit}${preDigit}`;
  const suf = `${getRandomInt(2000000, 9999999)}`;
  return `${pre}${suf}`;
}

module.exports = phone;
