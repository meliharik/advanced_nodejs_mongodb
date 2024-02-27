var express = require('express');
var router = express.Router();

const fs = require("fs");

let routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.includes(".js") && route != "index.js") {
    let routeName = route.replace(".js", "");
    let routePath = `./${routeName}`;
    console.log(routeName, routePath);
    router.use(`/${routeName}`, require(routePath));
  }
}

module.exports = router;