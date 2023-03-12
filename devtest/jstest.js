

async function test() {
	console.log(1);
	// console.log(await Promise.resolve(2));
	return 3;
}

test().then(x => console.log(x));
console.log(4);