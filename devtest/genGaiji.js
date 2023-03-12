// generate gaiji json map from txt

const fs = require("fs");

function parseGaiji(filename, options = {}) {
  let data = fs.readFileSync(filename, "utf8");
  let lines = data.split(/\r?\n/);
  // console.log(lines);
  var mapper = {};
  lines.forEach((line) => {
    let commentIndex = line.indexOf("#");
    if (commentIndex != -1) {
      line = line.slice(0, commentIndex);
    }
    line = line.trim();
    if (!line) return;
    let fields = line.split(/\s+/);
    if (fields.length < 2) return;
    let key = fields[0].slice(1).toLowerCase(); // hXXXX, zXXXX
    if (mapper[key]) {
      console.log("warning, key already exists", line);
    }
    if (fields[1].match(/^(u\+?[0-9a-f]{2,})(,u\+?[0-9a-f]{2,})*$/i)) {
      // console.log(fields[1])
      mapper[key] = fields[1]
        .split(",")
        .map((ustr) => {
          ustr = ustr.slice(1);
          return String.fromCodePoint(ustr[0] == "+" ? ustr : `0x${ustr}`);
        })
        .join("");
    } else {
      if (fields[1] != "-" && fields[1] != "null") {
        console.log("warning, wrong-unicode format", line);
        if (fields[1]) {
          mapper[key] = fields[1];
        }
      }
      if (fields.length >= 3) {
        mapper[key] = fields[2];
      }
    }
  });
  return mapper;
}

if (!process.argv[2]) {
  console.log("Usage: node genGaiji.js <id>");
  process.exit(1);
}

let map = parseGaiji(`../GAIJI/${process.argv[2]}.map`);
// console.log(map);
fs.writeFileSync(
  `../GAIJI/${process.argv[2]}.json`,
  JSON.stringify(map, null, 2)
);
