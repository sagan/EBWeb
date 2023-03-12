
const {guessWordOriginal} = require('../client/language_functions');

let testcases = [
"食べます",
"お手洗い",
];


testcases.forEach(ts => {
	console.log(ts, guessWordOriginal(ts));
})
