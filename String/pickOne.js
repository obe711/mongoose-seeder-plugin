
function pickOne(arr) {
    if (arr && arr.length > 0)
        return arr[Math.floor(Math.random() * arr.length)];
}
module.exports = pickOne;