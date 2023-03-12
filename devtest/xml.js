var parseString = require('xml2js').parseString;
var xml = "<root>Hello xml2js!</root>"

xml = require('fs').readFileSync('yahoo_1.xml', 'utf8');

parseString(xml, function (err, result) {
    console.dir(JSON.stringify(result));
});