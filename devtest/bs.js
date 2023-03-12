/**
 * @param array sorted array with compare func
 * @param item search item
 * @param start (optional) start index
 * @param end (optional) exclusive end index
 */
function binarySearchLt(array, item, start, end, field) {
  function compare(o1, o2) {
    if (o1[field] <= o2[field]) {
      return -1;
    }
    return 1;
  }
  let from = start == null ? 0 : start;
  let to = (end == null ? array.length : end) - 1;
  while (from <= to) {
    console.log("iteration", array[from], array[to]);
    if (compare(array[from], item) > 0) {
      return from;
    }
    const middle = (from + to) >>> 1;
    const compareResult = compare(array[middle], item);
    if (compareResult < 0) {
      from = middle + 1;
    } else {
      to = middle - 1;
      if (to >= 0 && compare(array[to], item) < 0) {
        return middle;
      }
    }
  }
  return -1;
}

let arr = [
  { id: 0 },
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 6 },
  { id: 9 }
];
let index = binarySearchLt(arr, { id: 11 }, null, null, "id");
console.log(index, arr[index]);
