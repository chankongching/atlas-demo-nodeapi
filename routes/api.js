var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');

const url = 'mongodb://root:password@18.162.71.8:27017/';

/* GET API listing. */
router.get('/', function(req, res, next) {
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    console.log('connect MongoDB success!')
    const dbo = db.db('frontend');
    // const whereStr = { name: '' }; // 查询条件
    const whereStr = {};
    dbo.collection('data').find(whereStr).toArray((error, data) => {
      console.log('collection data tabel!');
      if (error) throw err;
      dbo.collection('score').find(whereStr).toArray((error, score) => {
        console.log('collection score tabel!');
        if (error) throw err;
        dbo.collection('name').find(whereStr).toArray((error, name) => {
          console.log('collection name tabel!');
          if (error) throw err;
          mergeData({ data, score, name }, res);
          db.close();
        });
      });
    });
  });
});

function mergeData({ data, score, name }, res) {
  let newData = {
    address: data[0].address,
    address_score_month: data[0].address_score_month,
    address_score_series: data[0].address_score_series,
    addresses: data[0].addresses,
    balance: data[0].balance,
    deposits: data[0].deposits,
    description: data[0].description,
    input: data[0].input,
    no_of_wallets: data[0].no_of_wallets,
    // output: data[0].output,
    received: data[0].received,
    risk_score_in: data[0].risk_score_in,
    risk_score_out: data[0].risk_score_out,
    sent: data[0].sent,
    totalfees: data[0].totalfees,
    transfers: data[0].transfers,
    withdraws: data[0].withdraws,
    pie_data: { in: [], out: data[0].output, }
  };
  newData.pie_data.in = JSON.parse(JSON.stringify(data[0].input[data[0].input.length - 1]));
  newData.pie_data.in.splice(0, 4); 
  newData.pie_data.out.splice(0, 4); 
  newData.pie_data.in = newData.pie_data.in.map((item, index, arr) => {
    return { value: item, name: name[0].entities[index], score: score[0].score[index] }
  });
  newData.pie_data.out = newData.pie_data.out.map((item, index, arr) => {
    return { value: item, name: name[0].entities[index], score: score[0].score[index] }
  });
  console.log(newData);
  res.send(newData);
}

module.exports = router;
