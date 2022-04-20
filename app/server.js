//Stringfy now ESM  so converting to type module, using import
//const express     = require("express");
//var xsenv         = require("@sap/xsenv");
//var hdb           = require("@sap/hana-client");
//var stringifyObj  = require("stringify-object"); 


import express     from "express";
import xsenv       from "@sap/xsenv";
import hana         from "@sap/hana-client";
import stringifyObj from 'stringify-object'




const app = express();

app.get("/", function (req, res) {
  res.send("Working");
});


//Hana Client test
app.get("/asyncTest", function (req, res) {


  try {
    var asResponse = asyncCallDB(req, res)
    //console.log( "here" + stringifyObj(asResponse));
    //return res.status(200).send(stringifyObj(asResponse));

  }
  catch(err) {
    console.error(stringifyObj(err));
    return res.status(200).send(stringifyObj(err));
  }

});



const asyncCallDB = async (req, res) => {
  

  var HanaOptions = xsenv.cfServiceCredentials({  name: "hc_default_hdi" });
  var HanaOptionsTenant1 = xsenv.cfServiceCredentials({  name: "hc_tenant1_hdi" });
  var HanaOptionsTenant2 = xsenv.cfServiceCredentials({  name: "hc_tenant2_hdi" });
  var asHanaOptions =
{
    host: HanaOptions.host,
    port: HanaOptions.port,
    uid: HanaOptions.user,        //default tenant user
    pwd: HanaOptions.password,    //default tenant password
    pooling: true,
    maxPoolSize: 10,
    connectionLifetime: 60
}

  
  var startDate   = new Date();
  var connDate    = new Date();
  var sqlC1Date   = new Date();
  var sqlSetDate  = new Date();
  var sqlMainDate = new Date();
  var sqlC2Date   = new Date(); 
  var disconnDate = new Date(); //End Step
  //var totalTime  = null;
  var timeDiff = null;

  var sql = '';

  var outStr = '' ;


  var asConnection = hana.createClient(asHanaOptions);
  //asConnection.setConnectionPoolLimit(10);   ??? Documentation
  asConnection.connect(function(err) {
    //if (err) throw err;      //crash the app
    if (err)  {
      return res.status(200).send( new Date().toISOString() + " connectReponse: " + stringifyObj(err) ) ;
    }
    else {


      connDate  = new Date();
      timeDiff = connDate - startDate ;
      outStr += startDate.toISOString()  + ' ' + connDate.toISOString() + ' ' + timeDiff  + ' ' ; 


      //STEP1: Use CONNECT SQL with different user (e.g. tenant/HDI user) to better reuse connections
      if (req.query.tenant === '2' ) {
        //Customer Tenant 2
        sql =  ' CONNECT ' + HanaOptionsTenant2.user + ' password "' + HanaOptionsTenant2.password + '";';
    
      } else  {
        //Customer Tenant 1
        sql =  ' CONNECT ' + HanaOptionsTenant1.user + ' password "' + HanaOptionsTenant1.password + '";';
      }

      
      asConnection.exec(sql, function (err, results) {
      if (err) throw err;


        sqlC1Date  = new Date();
        timeDiff = sqlC1Date  - connDate;
        outStr += sqlC1Date.toISOString()  + "\t" + timeDiff  + "\t" ; 


        //STEP2: set session variables for user
        sql = "SET SESSION 'APPLICATION' = 'HC-APP';"
        asConnection.exec(sql);

        sqlSetDate = new Date();
        timeDiff = sqlSetDate - sqlC1Date;
        outStr += sqlSetDate.toISOString()  + "\t" + timeDiff  + "\t" ; 


        //STEP3: Excute MAIN SQL
        //sql = "SELECT CURRENT_TIMESTAMP FROM DUMMY;"  //  Very fast
        sql = 'SELECT CURRENT_USER ,CURRENT_TIMESTAMP, CURRENT_SCHEMA, ack(1,0) from DUMMY;' // slow down with recursive a function
        var rs = asConnection.exec(sql);
        var rsUser = ''
        try {
          rsUser = rs[0].CURRENT_USER

        } catch(err) {
          rsUser = 'ERROR'
        }  


        sqlMainDate = new Date();
        timeDiff = sqlMainDate - sqlSetDate;
        outStr += sqlMainDate.toISOString()  + "\t" + timeDiff  + "\t" ; 

        //STEP4: Connect back with original DEFAULT user to restore connection for reuse
        sql =  ' CONNECT ' + asHanaOptions.uid + ' password "' + asHanaOptions.pwd + '";';
        asConnection.exec(sql);

        sqlC2Date = new Date();
        timeDiff = sqlC2Date - sqlMainDate;
        outStr += sqlC2Date.toISOString()  + "\t" + timeDiff  + "\t" ; 


        //FINAL STEP:    Disconnect - return to pool (if applicable)
        asConnection.disconnect();
        disconnDate = new Date();
        timeDiff = disconnDate - sqlC2Date;
        outStr += disconnDate.toISOString()  + "\t" + timeDiff  + "\t" ; 
  
        //Finish including Total time spent
        timeDiff = disconnDate - startDate;
        outStr += timeDiff  + "\t" + rsUser;
        return res.status(200).send(outStr + '\n');
      });
  
    }  


    
  });


}




//Hana Client test Std
app.get("/asyncTestStd", function (req, res) {


  try {
    var asResponse = asyncCallDBstd(req, res)
    //console.log( "here" + stringifyObj(asResponse));
    //return res.status(200).send(stringifyObj(asResponse));

  }
  catch(err) {
    console.error(stringifyObj(err));
    return res.status(200).send(stringifyObj(err));
  }

});




const asyncCallDBstd = async (req, res) => {
  

  var HanaOptions = xsenv.cfServiceCredentials({  name: "hc_default_hdi" });
  var HanaOptionsTenant1 = xsenv.cfServiceCredentials({  name: "hc_tenant1_hdi" });
  var HanaOptionsTenant2 = xsenv.cfServiceCredentials({  name: "hc_tenant2_hdi" });
  var asHanaOptions =
{
    host: HanaOptions.host,
    port: HanaOptions.port,
    uid: HanaOptions.user,        //default tenant user
    pwd: HanaOptions.password,    //default tenant password
    pooling: true,
    maxPoolSize: 5,               //  reduced 10 to 5 to better compare performance  between both solutions
    connectionLifetime: 60
}


if (req.query.tenant === '2' ) {
  //Customer Tenant 2
  asHanaOptions.uid =   HanaOptionsTenant2.user;
  asHanaOptions.pwd =   HanaOptionsTenant2.password;

} else  {
  //Customer Tenant 1
  asHanaOptions.uid =   HanaOptionsTenant1.user;
  asHanaOptions.pwd =   HanaOptionsTenant1.password;
}


  
  var startDate   = new Date();
  var connDate    = new Date();
  var sqlC1Date   = new Date();
  var sqlSetDate  = new Date();
  var sqlMainDate = new Date();
  var sqlC2Date   = new Date(); 
  var disconnDate = new Date(); //End Step
  //var totalTime  = null;
  var timeDiff = null;

  var sql = '';

  var outStr = '' ;

  if (req.query.noPooling === 'x' ) {
    asHanaOptions.pooling = false;
    asHanaOptions.maxPoolSize = 0;
    asHanaOptions.connectionLifetime = 0;
  }  
  
  var asConnection = hana.createClient(asHanaOptions);
  //asConnection.setConnectionPoolLimit(10);   ??? Documentation

  //Create initial connection

  asConnection.connect(function(err) {
    //if (err) throw err;      //crash the app
    if (err)  {
      return res.status(200).send( new Date().toISOString() + " connectReponse: " + stringifyObj(err) ) ;
    }
    else {


      connDate  = new Date();
      timeDiff = connDate - startDate ;
      outStr += startDate.toISOString()  + ' ' + connDate.toISOString() + ' ' + timeDiff  + ' ' ; 


      //STEP1: Set Session variables
      sql = "SET SESSION 'APPLICATION' = 'HC-APP';"
      asConnection.exec(sql, function (err, results) {
      if (err) throw err;

        sqlSetDate = new Date();
        timeDiff = sqlSetDate - connDate;
        outStr += sqlSetDate.toISOString()  + "\t" + timeDiff  + "\t" ; 


        //STEP2: Excute MAIN SQL
        //sql = "SELECT CURRENT_TIMESTAMP FROM DUMMY;"  //  Very fast
        sql = 'SELECT CURRENT_USER ,CURRENT_TIMESTAMP, CURRENT_SCHEMA, ack(1,0) from DUMMY;' // slow down with recursive a function
        var rs = asConnection.exec(sql);
        var rsUser = ''
        try {
          rsUser = rs[0].CURRENT_USER

        } catch(err) {
          rsUser = 'ERROR'
        }  


        sqlMainDate = new Date();
        timeDiff = sqlMainDate - sqlSetDate;
        outStr += sqlMainDate.toISOString()  + "\t" + timeDiff  + "\t" ; 


        //FINAL STEP:    Disconnect - return to pool (if applicable)
        asConnection.disconnect();
        disconnDate = new Date();
        timeDiff = disconnDate - sqlC2Date;
        outStr += disconnDate.toISOString()  + "\t" + timeDiff  + "\t" ; 
  
        //Finish including Total time spent
        timeDiff = disconnDate - startDate;
        outStr += timeDiff  + "\t" + rsUser;
        return res.status(200).send(outStr + '\n');
      });
  
    }  
    
  });


}

const port = process.env.PORT || 3001;
app.listen(port, function () {
  console.log("myapp listening on port " + port);
}); 
