var formsAngular = require("../../src/server/data_form.js");
var express = require("express");
var async = require("async");
var path = require("path");
var fs = require("fs");
var _ = require("lodash");
var exec = require("child_process").exec;

module.exports = {
  setUpDB: function(mongoose, callback) {
    app = express();

    fng = new (formsAngular)(mongoose, app, { urlPrefix: "/api/" });
    mongoose.set('useCreateIndex', true);
    mongoose.connect("mongodb://localhost:27017/forms-ng_test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      keepAlive: 1,
      connectTimeoutMS: 30000,
    });

    mongoose.connection.on("error", function() {
      console.error("connection error", arguments);
    });

    mongoose.connection.on("open", function() {
      // Import test data
      var dataPath = path.join(__dirname, "../api/data");
      fs.readdir(dataPath, function(err, files) {
        async.each(files, function(file, cb2) {
          var fname = dataPath + "/" + file;
          if (fs.statSync(fname).isFile()) {
            var command = "mongoimport --db forms-ng_test --drop --collection " + file.slice(0, 1) + "s --jsonArray < " + fname;                  exec(command, function(error, stdout, stderr) {
              if (error !== null) {
                cb2(new Error("Error executing " + command + " : " + error + " (Code = " + error.code + "    " + error.signal + ") : " + stderr + " : " + stdout));
              } else {
                cb2();
              }
            });
          }
        }, function(err) {
          if (err) {
            throw new Error(err);
          } else {
            // Bootstrap models
            var modelsPath = path.join(__dirname, "../api/models");
            fs.readdir(modelsPath, function(err, files) {
              async.each(files, function(file, cb2) {
                var fname = modelsPath + "/" + file;
                if (fs.statSync(fname).isFile()) {
                  fng.addResource(file.slice(0, -3), require(fname), { suppressDeprecatedMessage: true });
                }
                cb2();
              }, function(err) {
                if (err) {
                  throw new Error(err);
                } else {
                  callback(fng)
                }
              });
            });
          }
        });
      });
    });
  },

  dropDb : function(mongoose, callback) {
    mongoose.connection.db.dropDatabase(function () {
      mongoose.disconnect(function() {
        callback();
      });
    });
  }
};
