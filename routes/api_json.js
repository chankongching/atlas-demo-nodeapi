var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');
var categoryMapData = require('./data');
let categoryMap = new Map(categoryMapData.categoryMap);
const url = 'mongodb://root:password@18.162.71.8:27017/';

const json1 = require('../data/data1.json');
const json2 = require('../data/data2.json');
const json3 = require('../data/data3.json');
const json4 = require('../data/data4.json');
const json5 = require('../data/data5.json');
const json6 = require('../data/data6.json');
const json7 = require('../data/data7.json');
const json8 = require('../data/data8.json');


const datas_address = {
  "1133biLvFq3b9qSsHpAA9M15vhJYvw3iND": json1,
  "112xfbAbdKfyEnwZEv13JU6ibEHpJqZ3rB": json2,
  "1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF": json3,
  "Huobi.com": json4,
  "OKCoin.com": json5,
  "AbraxasMarket": json6,
  "BTC-e.com" : json7,
  "Kraken.com" : json8
}

const datas_id = {
  "5d41344ce86e60067efdb1d7": json1,
  "5d41344ce86e60067efdb110": json2,
  "5d41344ce86e60067efdb210": json3,
  "5d41344ce8df60067efdb550": json4,
  "5d41344ce8df60067efdb660": json5,
  "5d41344ce8df60067efdb666": json6,
  "5d41344ce8df60067efdb777" : json7,
  "5d41344ce8df60067efdb888" : json8
}

const datas_name = {
  "Independent Wallet": json1,
  "Exchange Wallet": json2,
  "bitfinex-coldwallet": json3,
  "Exchange": json4,
  "Exchange": json5,
  "Darknet Market": json6,
  "Exchange" : json7,
  "Exchange" : json8
}

const datas_array_list = [json1, json2, json3, json4, json5, json6, json7, json8];

/* GET API listing. */
router.get('/aml', function (req, res, next) {
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    const dbo = db.db('frontend');
    // const whereStr = { name: '' }; // 查询条件
    const whereStr = {};
    // dbo.collection('data').find(whereStr).toArray((error, data) => {
    //   // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    //   // console.log(data);
    //   console.log('collection data tabel!');
    //   if (error) throw err;
    let data  = datas_name['Independent Wallet'];
    // console.log('====================================')
    // console.log(data);
    if (!data) {
      return res.send({status: 'Waning', message: '搜索结果为空'});
    }
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
    // });
  });
});

function mergeData({ data, score, name }, res) {
  data = [data];
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
    pie_data: { inList: [], outList: data[0].output, inCategory: {}, outCategory: {} }
  };
  newData.pie_data.inList = JSON.parse(JSON.stringify(data[0].input[data[0].input.length - 1]));
  newData.pie_data.inList.splice(0, 4);
  newData.pie_data.outList.splice(0, 4);
  newData.pie_data.inList = newData.pie_data.inList.map((item, index, arr) => {
    let newItem = { value: item, name: name[0].entities[index], score: score[0].score[index] };

    if (categoryMap.has(newItem.name)) {
      let name = categoryMap.get(newItem.name);
      if (newData.pie_data.inCategory[name]) {
        newData.pie_data.inCategory[name].push(newItem);
      } else {
        newData.pie_data.inCategory[name] = [];
        newData.pie_data.inCategory[name].push(newItem);
      }
    } else {
      if (newData.pie_data.inCategory['other']) {
        newData.pie_data.inCategory['other'].push(newItem);
      } else {
        newData.pie_data.inCategory['other'] = [];
        newData.pie_data.inCategory['other'].push(newItem);
      }
    }

    return newItem
  });
  newData.pie_data.outList = newData.pie_data.outList.map((item, index, arr) => {
    let newItem = { value: item, name: name[0].entities[index], score: score[0].score[index] };

    if (categoryMap.has(newItem.name)) {
      let name = categoryMap.get(newItem.name);
      if (newData.pie_data.outCategory[name]) {
        newData.pie_data.outCategory[name].push(newItem);
      } else {
        newData.pie_data.outCategory[name] = [];
        newData.pie_data.outCategory[name].push(newItem);
      }
    } else {
      if (newData.pie_data.outCategory['other']) {
        newData.pie_data.outCategory['other'].push(newItem);
      } else {
        newData.pie_data.outCategory['other'] = [];
        newData.pie_data.outCategory['other'].push(newItem);
      }
    }
    return newItem
  });

  newData.pie_data.pieInData = [];
  newData.pie_data.pieOutData = [];
  for (let key in newData.pie_data.inCategory) {
    let num = 0;
    newData.pie_data.inCategory[key].forEach(element => {
      element.color = key
      num += element.value;
    });
    newData.pie_data.pieInData.push({
      name: key,
      value: num
    })
  }
  for (let key in newData.pie_data.outCategory) {
    let num = 0;
    newData.pie_data.outCategory[key].forEach(element => {
      element.color = key
      num += element.value;
    });
    newData.pie_data.pieOutData.push({
      name: key,
      value: num
    })
  }

  let historyXAxis = [];
  let historyData = [];
  for (let x = 0; x < data[0].input.length; x++) {
    historyXAxis.push(data[0].input[x][1])
  }
  let newInput = JSON.parse(JSON.stringify(data[0].input));
  // newInput.splice(0, 4);
  for (let i = 0; i < newInput[0].length; i++) {
    let arr = [];
    for (let index = 0; index < newInput.length; index++) {
      arr.push(newInput[index][i]);
    }
    historyData.push({
      name: name[0].entities[i - 4],
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      data: arr
    });
  }
  
  historyData.splice(0, 4)
  // console.log(historyData);
  newData.historyXAxis = historyXAxis;
  newData.historyData = historyData;

  // console.log(newData);
  res.send(newData);
}
router.get('/list' , (req , res , next) => {
  const data = datas_array_list;
  let list = []
  data.forEach((record) => {
    list.push({
      name: record.description,
      id: record._id,
      no_of_wallets: record.no_of_wallets
    })
  })
  res.json(list)
})
router.post('/record' , (req , res , next) => {
  let data  = datas_name[req.body.name];
  if (!data) {
    return res.send({status: 'Waning', message: '搜索结果为空', code: 0});
  }

  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    const dbo = db.db('frontend');
    dbo.collection('score').find().toArray((error, score) => {
      if (error) throw err;
      dbo.collection('name').find().toArray((error, name) => {
        if (error) throw err;
        mergeData({ data, score, name }, res);
        db.close();
      });
    });
  });
})
router.get('/category-list' , (req , res , next) => {
  let data  = datas_array_list;
  if (!data) {
    return res.send({status: 'Waning', message: '搜索结果为空', code: 0});
  }
  // dbo.collection('data').find().toArray((error, data) => {
    // if (error) throw err;
    let list = []
    let categoryList = {};
    for (let item of categoryMap.entries()) {
      if (Object.prototype.toString.call(categoryList[item[1]]) == '[object Array]') {
        categoryList[item[1]].push(item[0]);
      } else {
        categoryList[item[1]] = [];
        categoryList[item[1]].push(item[0]);
      }
    }
    
    let categoryArray = [];
    for (const key in categoryList) {
      categoryArray.push({
        name: key,
        value: categoryList[key]
      })
    }

    categoryArray.forEach(category => {
      category.value = category.value.map(entity => {
        let newVal = {
          entity: entity
        };
        data.forEach(item => {
          if (entity === item.address) {
          // if (entity === 'AbraxasMarket') {
            newVal.id = item._id;
            newVal.no_of_wallets = item.no_of_wallets;
            newVal.address = item.address;
          }
        })

        return newVal;
      })

    })

    res.send(categoryArray);
    // res.json(list)
})

router.post('/search' , (req , res , next) => {
  
  if (req.body.address) {
    console.log('接受到参数:', req.body);
  } else {
    return res.send({status: 'error', message: '缺少参数', code: 0});
  }
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) return res.send(err);
    const dbo = db.db('frontend');
    let data  = datas_address[req.body.address];
    if (!data) {
      return res.send({status: 'Waning', message: '搜索结果为空', code: 0});
    }
    // dbo.collection('data').find({ address:req.body.address }).toArray((error, data) => {
    //   if (error) throw err;
      // if (data.length <= 0) {
      //   return res.send({status: 'Waning', message: '搜索结果为空'});
      // }
      dbo.collection('score').find().toArray((error, score) => {
        if (error) throw err;
        dbo.collection('name').find().toArray((error, name) => {
          if (error) throw err;
          mergeData({ data, score, name }, res);
          db.close();
        });
      });
    // });
  });
})
module.exports = router;
