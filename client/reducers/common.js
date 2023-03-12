function updateArrElement(array, element, newValues) {
  let index;
  if (typeof element == "object") {
    index = array.indexOf(element);
  } else {
    index = element;
    element = array[index];
  }
  if (index != -1) {
    let newElement = Array.isArray(newValues)
      ? newValues
      : Object.assign({}, element, newValues);
    array = array.slice();
    array.splice(index, 1, newElement);
  }
  return array;
}

module.exports = {
  updateArrElement
};