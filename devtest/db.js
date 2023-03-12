(async () => {
  var now = moment();
  var db = window.__DB__;
  var record = {
    dict: "広辞苑",
    keyword: "恋",
    offset: null,
    page: null,
    q: "恋",
    status: 0,
    time: 1589248944935,
    type: 0
  };
  let existing = await db.history
    .where("time")
    .between(+now.clone().subtract(3, "days"), +now)
    .and((r) =>
      ["dict", "q", "page", "offset", "type"].every(
        (param) => r[param] === record[param]
      )
    )
    .limit(1)
    .toArray();
  console.log("check", existing);
})();

// 1589248933883, 1589248944935
// 1588990541032, 1588990541032

(async () => {
  console.log(1);
  let notes = (await __DB__.deletedNote.limit(1000).toArray()).map(
    (note) => note.id
  );
  console.log(2, notes);
})();

(async () => {
  var db = window.__DB__;
  let notes = await db.notebook
    .where("time")
    .belowOrEqual(1592627498255)
    .reverse()
    .limit(10)
    .toArray();
  console.log("--", notes);
})();

(async () => {
  var db = window.__DB__;
  let notes = await db.notebook
    .orderBy("time")
    .reverse()
    .limit(20)
    .toArray();
  console.log("--", notes);
})();
