// generate gaiji json map from txt

const fs = require("fs");

function parseAlternate(filename, options = {}) {
  let data = fs.readFileSync(filename, "utf8");
  let lines = data.split(/\r?\n/);
  // console.log(lines);
  var mapper = {};
  lines.forEach(line => {
    let commentIndex = line.indexOf("#");
    if (commentIndex != -1) {
      line = line.slice(0, commentIndex);
    }
    line = line.trim();
    if (!line) return;
    let fields = line.split(/\s+/);
    if (fields.length < 2) return;
    if (fields[0].match(/^(u\+?[0-9a-f]{2,})(,u\+?[0-9a-f]{2,})*$/i)) {
      // console.log(fields[1])
      let key = fields[0]
        .split(",")
        .map(ustr => {
          ustr = ustr.slice(1);
          return String.fromCodePoint(ustr[0] == "+" ? ustr : `0x${ustr}`);
        })
        .join("");
      if (mapper[key]) {
        console.log("warning, key already exists", line);
      }
      mapper[key] = fields[1];
    } else {
      console.log("warning, wrong-unicode format", line);
    }
  });
  return mapper;
}

let map = parseAlternate("../GAIJI/alternate.ini");
// console.log(map);
fs.writeFileSync("../GAIJI/alternate.json", JSON.stringify(map, null, 2));
