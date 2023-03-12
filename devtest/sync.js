
(async (db) => {
  console.log(new Date, 1);
  let metas = await db.meta.toArray();
  console.log(new Date, "metas", metas)
})(window.__DB__);


(async (db) => {
  console.log(new Date, 1);
  let records = await db.history
    .orderBy("time")
    .reverse()
    .limit(10)
    .toArray();
  console.log(new Date, "history", records)
})(window.__DB__);

(async (db) => {
  console.log(new Date, 1);
  let records = await db.history
    .where("status")
    .equals(0)
    .toArray();
  console.log(new Date, "history", records)
})(window.__DB__);