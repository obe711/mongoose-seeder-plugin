const { getRandomInt } = require("../utils");
const wordsList = require("./data/wordsList.json");

function words(wordCount = 1) {
  let wordArray = [];
  for (let x = 0; x < wordCount; x++) {
    wordArray.push(wordsList[getRandomInt(0, 498)]);
  }
  if (wordCount < 3) return wordArray.join("4").replace(" ", "").trim();

  else return wordArray.join(" ");
}

function password() {
  let wordArray = [];
  for (let x = 0; x < 4; x++) {
    wordArray.push(wordsList[getRandomInt(0, 498)]);
  }

  let password = wordArray.join('');

  return password.substring(0, 8)
}

function fileName() {
  const arr = ["jpg", "pdf", "png"];
  let fileString = words(2).replace(/[^a-zA-Z ]/g, "").toLowerCase();

  const fileType = arr[Math.floor(Math.random() * arr.length)]
  return fileString + "." + fileType;
}

module.exports = {
  words,
  password,
  fileName
}
