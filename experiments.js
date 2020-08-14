var fs = require('fs');
var coding = require('./DOE_coding.js');

var experiments_raw = JSON.parse(fs.readFileSync('./DOE.json', 'utf8'));
var experiments = [];
var specs = [];
for (let i=0; i<experiments_raw.length; i++){
    specs.push({
        "alt_a": experiments_raw[i]["alt_a"],
        "alt_b": experiments_raw[i]["alt_b"]
    });
    experiments.push({
        "alt_a": coding(experiments_raw[i]["alt_a"]),
        "alt_b": coding(experiments_raw[i]["alt_b"])
    })
}


// module.exports = experiments;
exports.experiments = experiments;
exports.specs = specs;