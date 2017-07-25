
var express = require('express');
var app = new express();

app.get('/test', (req, res, next) => {
    res.cookie('id_token', 'sessionid', {expires: new Date()});
    res.redirect(302, 'http://localhost:8080');
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});
