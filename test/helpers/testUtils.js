function toJsonDateString(utcNumber) {
  return JSON.stringify(new Date(utcNumber)).replace(/"/g, '');
}

function sortByCreatedAt(arr) {
  const compare = (objectA, objectB) => {
    const dateA = new Date(objectA.createdAt);
    const dataB = new Date(objectB.createdAt);
    if (dateA > dataB) {
      return 1;
    } else if (dataB > dateA) {
      return -1;
    }
  };
  arr.sort(compare);
}

module.exports = {
  toJsonDateString,
  sortByCreatedAt,
};
