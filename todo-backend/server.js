var http = require('http');
var mysql = require('mysql');
var fs = require('fs');
const url = require('url');

function logResponse(err, res)
{
   if (err)
   {
       console.log ('error', err.message, err.stack);
       console.log("Callbacks learned");
         console.log ('status-code', res.statusCode);
         res.statusCode = 404;
         console.log ('status-code', res.statusCode);
         res.setHeader('Content-Type', 'text/plain');
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.end("post done");
   }
   else
   {
      console.log("1 record inserted");
          res.statusCode = 200;
         res.setHeader('Content-Type', 'text/plain');
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.end("post done");
   }
}

function sendSqlQuery(sql, callback, res)
{
    con.query(sql, function (err, result) {
      if (err)
      {
          callback(err, res);  
      }
      else
      {
          callback(null, res);
      }
    });
}

function sendSqlQueryPromise(sql, res)
{
    return new Promise(function (resolve, reject) {
        con.query(sql, function (err) {
         if (err)
         {   
            reject(err);
         }
         else
        {   
           resolve();
         }
    });
    });
}

function tableQuery(tableName, filter)
{
   return new Promise (function(resolve, reject) {
    var sql;
    if (filter == "all"){
    sql = "SELECT name, status FROM " + tableName;
    } else if (filter == "completed") {
    sql = "SELECT name, status FROM " + tableName + " WHERE status='Done'"
    }
    else {
    sql = "SELECT name, status FROM " + tableName + " WHERE status='Undone'"
    }
       console.log (sql);
       con.query(sql, function (err, result) {
          if (err)
          {
            reject (err);
            //console.log ('error', err.message, err.stack);
           }
          else
          {
             var taskArray = [];
             for (i=0; i < result.length; ++i)
             {
                var name = result[i].name.toString();
                var status = result[i].status.toString();
                var obj = {"name": name, "status": status};
                taskArray.push(obj);
             }
            resolve([tableName, taskArray]);
         }
});
});
};

var server = http.createServer(function (req, res) {
  console.log("one Connected!");
//res.statusCode = 200; 
  var q = url.parse(req.url, true);
  console.log("Url is" + req.url)
  var qdata = q.query;
  console.log(qdata.name)
  console.log(q.host)
  console.log(q.pathname)
  console.log(qdata.delete)
  console.log(qdata.reset)
  if (req.method === 'POST') {
  if (!qdata.delete)
  {
      var status;
      if (qdata.status)
      {  
         status = qdata.status;
      }
      else
      { 
        status = 'Undone';
      }
      var sql;
      if (!qdata.name)
      {
          if (!qdata.reset)
          {
              sql = "CREATE TABLE " + qdata.table + "( name VARCHAR(500) NOT NULL, status VARCHAR(50) NOT NULL, PRIMARY KEY (name))";
          } else
          {
              sql = "UPDATE "+qdata.table+" SET status = 'Undone'"; 
          }
      }
      else {
          if (!qdata.edit)
          {
              //sql = "INSERT INTO "+qdata.table+" (name, status) VALUES ('"+qdata.name+"', '"+status+"') ON DUPLICATE KEY UPDATE status='"+status+"'";
                sql = "INSERT INTO "+qdata.table+" (name, status) VALUES ('"+qdata.name+"', '"+status+"')"
          }
          else
          {
              sql = "UPDATE "+qdata.table+" SET status = '"+status+"' WHERE name = '"+qdata.name+"'";
              console.log(sql);
          }
      }
      let body = 'post reception'
      //sendSqlQuery(sql, logResponse, res);
      console.log(sql);
      sendSqlQueryPromise(sql, res).then(function (error) {
           console.log("1 record inserted promise");
          res.statusCode = 200;
         res.setHeader('Content-Type', 'text/plain');
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.end("post done");

         }).catch (function (error)
         {
              console.log ('error', error.message, error.stack);
       console.log("Promises learned");
         console.log ('status-code', res.statusCode);
         res.statusCode = 404;
         console.log ('status-code', res.statusCode);
         res.setHeader('Content-Type', 'text/plain'); 
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.end("post done");
          });


      /*con.query(sql, function (err, result) {
      if (err)
      {
         console.log ('error', err.message, err.stack);
         console.log ('status-code', res.statusCode);
         res.statusCode = 404;
         res.setHeader('Content-Type', 'text/plain');
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.end("post done");
      }
      else
      {
          console.log("1 record inserted");
          res.statusCode = 200;function()
         res.setHeader('Content-Type', 'text/plain');
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.end("post done");
      }
    });*/
 } else {
      var sql;
      if (!qdata.name)
      {
          sql = `DROP TABLE ${qdata.table}` 
      } else {
          sql = `DELETE FROM ${qdata.table} WHERE name='${qdata.name}'`
      }
      console.log(sql);
      let body = ''
      con.query(sql, function (err, result) {
      if (err)
      {
         res.statusCode = 404;
         console.log ('error', err.message, err.stack);
      }
      else
      {
          console.log("1 record deleted");
      }
 });
    console.log("post done");
  }
  }
  else if (req.method === 'GET') {
     console.log("Url is" + req.url)
     res.writeHead(200, {'Content-Type': 'text/plain'});
     res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

     var sql2 = "SHOW TABLES;"
     let body = ''
     var totalArray = [];
     var promiseArray = [];
     con.query(sql2, function (err, result) {
     if (err)
     {
        console.log ('error', err.message, err.stack);
      }
      else
      {
        console.log("records retrieved");
        console.log(result.length);
        for (i = 0; i < result.length; i++) {
           var tableName = result[i].Tables_in_dbfinal.toString();
           promiseArray.push(tableQuery(tableName, qdata.name));
        }
       Promise.all(promiseArray).then(function(tableArray) {
                      for (i = 0; i < tableArray.length; i++) {
                      var tableObj = {"tableName": tableArray[i][0], "tasks": tableArray[i][1]};
                       console.log (tableObj);
                       totalArray.push(tableObj);
                      }
           console.log(totalArray);
           body = JSON.stringify(totalArray);
           res.end(body);
         });
      };
   });
  }
});
server.listen(8081);
server.timeout = 0;

var con = mysql.createConnection({
  host: "mysql",
  user: "root",
  password: "secret_password",
  database: "dbfinal"
});

con.connect(function(err) {
  if (err){
     console.log ('error', err.message, err.stack);
  }
  else
  {
     console.log("Connected!");
  }
  });
 

function readFileCall(err, data, req)
{
    console.log(data);
};

//var content = fs.readFileSync('index.html');
var content = fs.readFile('index.html', readFileCall);
console.log(content);

console.log("Read file");
