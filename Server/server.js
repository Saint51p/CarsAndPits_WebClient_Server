String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var http = require('http');
var url = require('url');
var fs = require("fs");

var port = 3000;

var clientPage = "";

function updateHtml(){
    fs.readFile('../Client/index.html', function (err, html) {
        if (err) 
            throw err;             
        clientPage = html;
    });
}

setInterval(updateHtml,300);

var server = http.createServer(function (req, res) {
    var urlParsed = url.parse(req.url, true);    
    var query = urlParsed.query;

    console.log(req.socket.remoteAddress + ': ' + urlParsed.pathname);

    switch (urlParsed.pathname) {
        case '/postData': {
            var postData = "";

            if (req.method=="POST"){
                req.addListener("data", function(postDataChunk){
                    postData += postDataChunk;
                    //console.log("New chunk! " + postDataChunk);
                });

                req.addListener("end", function(){                                                            
                    var ip = req.socket.remoteAddress;
                    var date = new Date();

                    //postData.replaceAll(',','.');

                    console.log('Path received from',ip,'at',date);
                    saveRoute(ip, date, postData);                    
                });                
            }

            res.statusCode = 202;
            res.end('Got it');
            break;
        }
        case '/getTrack': {
            var trackName = query.trackName;
            fs.readFile('./Tracks/' + trackName, (err,track) => {
                if (err) res.end(err);
                else res.end(track);
            });          
            break;
        }
        case '/getTracksList': {
            fs.readdir('./Tracks/', (err, files) => {
                var str = "";
                for (var f in files)
                    str += files[f] + '|' + (fs.statSync('./Tracks/' + files[f]).size / 1000000).toFixed(1) + 'MB ';
                res.end(str) 
            })
            break;
        }
        default: {            
            res.writeHeader(200, {"Content-Type": "text/html"});  
            res.write(clientPage);  
            res.end();  
            break;
        }               
    }
    //res.end("I'am on");
}).listen(port, "192.168.3.6");

function saveRoute(ip, date, route){
    var arr = [];
    var parts = route.split('|');
    parts.pop();
    
    
    for (var l in parts){
        var oneLine = parts[l].split(';');
        var obj = {
            position: {
                lat: oneLine[0],
                lng: oneLine[1]
            },
            time: oneLine[2],
            accelerations: {
                X: [],
                Y: [],
                Z: []
            }
        };
        oneLine.shift();
        oneLine.shift();
        oneLine.shift();
        var cc = 0;
        var map = {
            0: 'X',
            1: 'Y',
            2: 'Z'
        };
        
        for (var o in oneLine){            
            if (oneLine[o] != "")
                obj.accelerations[map[cc]].push(oneLine[o]);
            cc++;
            if (cc > 2) cc = 0;
        }
        arr.push(obj);
    }

    date = new Date();    

    var year = date.getUTCFullYear();
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();
    var hours = date.getUTCHours();
    var minutes = date.getUTCMinutes();
    var seconds = date.getUTCSeconds();
    var milliseconds = date.getUTCMilliseconds();
    
    if (month < 10) month = '0' + month;    
    if (day < 10) day = '0' + day;    
    if (hours < 10) hours = '0' + hours;    
    if (minutes < 10) minutes = '0' + minutes;    
    if (seconds < 10) seconds = '0' + seconds;    
    if (milliseconds < 100) milliseconds = '00' + milliseconds;
    else if (milliseconds < 10) milliseconds = '0' + milliseconds;

    console.log(year,month,day,hours,minutes,seconds,milliseconds)    
    var id = ip + '_' + date.getTime()//+'_'+ip;

    fs.writeFile('./Tracks/'+id+'.json', JSON.stringify(arr), function(err){        
        if (err) console.log('ОШИБКА: ' + err);
    });
}   