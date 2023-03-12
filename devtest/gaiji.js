
const map = require('../GAIJI/KOJIEN.json');

let str = `
わが‐まま【我儘】
<b536>自分の思うままにすること。自分の思い通りになること。類聚名義抄「自在、ワガマムマナリ」。宇治拾遺物語9「物云べきあるじもなくて、―にもやどりいるかな」
<b537>相手や周囲の事情をかえりみず、自分勝手にすること。きまま。ほしいまま。みがって。狂言、右近左近おこさこ「こなたも内ぢやとおぼしめすと、例の―が出まするほどに」。「―を言う」「―に育つ」
<b538>思うままにぜいたくを尽くすこと。また、そのありさま。西鶴織留4「金ごしらへの大脇差、―に見ゆる所、長崎でないか」
`;

function convertGaiji(str, map) {
	if( !map )
		return str;
	return str.replace(/<([a-f0-9]{4,})>/ig, (match, key) => {
		// console.log('found', key);
		return map[key] || match;
	});
}

console.log(convertGaiji(str, map));