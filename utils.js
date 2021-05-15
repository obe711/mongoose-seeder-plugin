
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  if (min < max) return Math.floor(Math.random() * (max - min + 1) + min);

  return Math.floor(Math.random() * (min - max + 1) + max);
}

exports.getRandomInt = getRandomInt;
