var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');
var categoryMapData = require('./data');
let categoryMap = new Map(categoryMapData.categoryMap);
const url = 'mongodb://root:password@18.162.71.8:27017/';

/* GET API listing. */
router.get('/aml', function (req, res, next) {
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
  console.log('mergeData----------------');
  console.log(data);
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
  newInput.splice(0, 4);
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
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    const dbo = db.db('frontend');
    dbo.collection('data').find().toArray((error, data) => {
      if (error) throw err;
      let list = []
      data.forEach((record) => {
        list.push({
          name: record.description,
          id: record._id,
          no_of_wallets: record.no_of_wallets
        })
      })
      res.json(list)
    });
  });
})
router.post('/record' , (req , res , next) => {
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    const dbo = db.db('frontend');
    dbo.collection('data').find({ description:req.body.name }).toArray((error, data) => {
      if (error) throw err;
      if (data.length <= 0) {
        return res.send({status: 'Waning', message: '搜索结果为空'});
      }
      dbo.collection('score').find().toArray((error, score) => {
        if (error) throw err;
        dbo.collection('name').find().toArray((error, name) => {
          if (error) throw err;
          mergeData({ data, score, name }, res);
          db.close();
        });
      });
    });
  });
})
router.get('/category-list' , (req , res , next) => {
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    const dbo = db.db('frontend');
    dbo.collection('data').find().toArray((error, data) => {
      if (error) throw err;
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
            if (entity === item.description) {
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
    });
  });
})

router.post('/search' , (req , res , next) => {
  
  if (req.body.address) {
    console.log('接受到参数:', req.body);
  } else {
    return res.send({status: 'error', message: '缺少参数'});
  }
  MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
    if (err) return res.send(err);
    const dbo = db.db('frontend');
    dbo.collection('data').find({ address:req.body.address }).toArray((error, data) => {
      if (error) throw err;
      if (data.length <= 0) {
        return res.send({status: 'Waning', message: '搜索结果为空'});
      }
      dbo.collection('score').find().toArray((error, score) => {
        if (error) throw err;
        dbo.collection('name').find().toArray((error, name) => {
          if (error) throw err;
          mergeData({ data, score, name }, res);
          db.close();
        });
      });
    });
  });
})
module.exports = router;
