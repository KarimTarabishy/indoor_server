var express = require('express');
var logger = require("winston");
var fs = require('fs');
var morgan = require('morgan');
var mongoose = require("mongoose");
var parser = require("body-parser");
var ml = require('machine_learning');

var app = express();
app.use(morgan("dev"));
app.use(parser.json());


var data = null, labels = null, knn = null, places = null, waps = null;

//try to read
try{
    data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
    labels = JSON.parse(fs.readFileSync('./labels.json', 'utf8'));
    waps = JSON.parse(fs.readFileSync('./waps.json', 'utf8'));
    places = JSON.parse(fs.readFileSync('./places.json', 'utf8'));
    knn = new ml.KNN({
        data : data,
        result : labels
    });
}
catch(err){
    data = null;
    labels = null;
    knn=null;
}


app.post('/dataset', function(req, res, next){
    data = req.body.features;
    labels = req.body.classes;
    waps = req.body.waps;
    places = req.body.places;

    if(!data || !labels || !waps || !places)
    {
        return next(new Error("failed to receive"));
    }
    res.json({});
    fs.writeFile('./data.json', JSON.stringify(data, null, 2) , 'utf-8');
    fs.writeFile('./labels.json', JSON.stringify(labels, null, 2) , 'utf-8');
    fs.writeFile('./waps.json', JSON.stringify(waps, null, 2) , 'utf-8');
    fs.writeFile('./places.json', JSON.stringify(places, null, 2) , 'utf-8');

    knn = new ml.KNN({
        data : data,
        result : labels
    });
});
app.get("/wap",function (req, res, next) {
    if(!data || !labels || !waps || !places || !knn)
    {
        return next(new Error("No data yet on server."));
    }

    res.json(waps);
});
app.post("/location", function (req,res,next) {
    if(!data || !labels || !waps || !places || !knn)
    {
        return next(new Error("No data yet on server."));
    }
    var feature = req.body.features;
    var y = knn.predict({
        x : feature,
        k : 3,

        weightf : {type : 'gaussian', sigma : 10.0},
        distance : {type : 'euclidean'}
    });
	var location = places[y];
	if(!location)
	{
		location = {x:0,y:0,name:"Uknown"};
	}
    res.json();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    logger.error(err.message);
    res.json({error: err.message});
});


module.exports = app;
