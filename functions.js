const hash = require("object-hash");

function updateHash(obj) {
  obj.$$hash = hash(obj, {
    excludeKeys: function (key) {
      return key.startsWith("$");
    },
  });
  return obj;
}

module.exports = { updateHash };
