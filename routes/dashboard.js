let express = require('express');

var router = express.Router();

router.get('/', function(req,res){
    //Return the dashboard view
    res.render('time_dashboard');
})

let refresh = function() {
    //Run periodic commands to refresh dashboard data
};

module.exports = {router, refresh};