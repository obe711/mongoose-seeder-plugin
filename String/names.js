const { getRandomInt } = require("../utils");
const menList = require("./data/First_Names_Men.json");
const womenList = require("./data/First_Names_Women.json");
const lastList = require("./data/Last_Names.json");

function firstMen() {
  return menList[getRandomInt(0, 99)];
}

function firstWomen() {
  return womenList[getRandomInt(0, 99)];
}

function first() {
  return getRandomInt(0, 1) === 0 ? `${firstWomen()}` : `${firstMen()}`;
}

function last() {
  return lastList[getRandomInt(0, 999)];
}

function full() {
  return `${first()} ${last()}`;
}

function husbandAndWife() {
  const lastName = last();
  return [firstMen(), firstWomen(), lastName]
}

exports.firstMen = firstMen;
exports.firstWomen = firstWomen;
exports.firstName = first;
exports.lastName = last;
exports.fullName = full;
exports.husbandAndWife = husbandAndWife;
