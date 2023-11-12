const fs = require('fs');
const express = require('express');
const coding = require('./DOE_coding.js');
const experiments = require('./experiments');
const DB = require('./db');


const router = express.Router();

router.get('/', function (req, res) {

    if (! req.session.seq) {
        req.session.seq = randperm(experiments.experiments.length);
        req.session.idx = 0;
        req.session.ans = req.session.seq.reduce(function (total,cur) {
            total[cur] = -1;  //-1 = wait for choice; 1=choose A; 2=choose B; 3=choose none;
            return total;
        }, {});
    }
    return res.render('index.html');
})

router.get('/play', function (req, res) {
    if (! req.cookies.sid) {
        return res.redirect("/");
    }
    // console.log(req.cookies.sid);
    if (! req.session.seq) {
        req.session.seq = randperm(experiments.experiments.length);
        req.session.idx = 0;
        req.session.ans = req.session.seq.reduce(function (total,cur) {
            total[cur] = -1;
            return total;
        }, {});
    }
    if (req.session.idx >= experiments.experiments.length) {
        req.session.idx = 0;
    }
    let idx = req.session.idx;
    let seq = req.session.seq;
    let last_choice_ans = req.session.ans[seq[idx]];
    // console.log("seq: " + seq);
    // console.log("seq-idx: " + seq[idx]);
    // console.log(req.session.seq);
    // console.log(req.session.ans);
    return res.render('play.html', {
        choice_num: idx + 1,
        alt_a: experiments.experiments[seq[idx]].alt_a,
        alt_b: experiments.experiments[seq[idx]].alt_b,
        experiment_id: seq[idx],
        last_choice_ans: last_choice_ans,
        alt_a_spec: experiments.specs[seq[idx]].alt_a,
        alt_b_spec: experiments.specs[seq[idx]].alt_b
    });
})

router.post('/play', function (req, res) {
    // console.dir(req.body.chosen);
    var chosen = -1;
    if (req.body.chosen === 'choose_a') {
        chosen = 1;
    } else if (req.body.chosen === 'choose_b') {
        chosen = 2;
    } else if (req.body.chosen === 'choose_none') {
        chosen = 3;
    }
    var experiment_id = parseInt(req.body.experiment_id);
    var sid = req.cookies.sid;
    req.session.ans[experiment_id] = chosen;
    req.session.idx = req.session.idx + 1;
    DB.addAns(sid, experiment_id, chosen, function (error, success) {
        if (error) {
            return res.send('database error: ' + error);
        }
        return res.send('answer accepted');
    })

})

router.get('/last', function (req, res) {
    if (req.session.idx > 0) {
        req.session.idx  = req.session.idx - 1;
    }
    return res.redirect('/play');
})

router.get('/estimate', function (req, res) {
    DB.getUserID(req.cookies.sid, function (error, user_id) {
        if (error) {
            return res.send('Server Error\n' + error);
        }
        res.cookie("user_id", user_id);
        let timestamp_hash = (+new Date).toString(36);
        res.cookie("task_hash", timestamp_hash);
        // send a task to mysql
        DB.sendEgoTask(user_id, timestamp_hash, function (error, results) {
            if (error) {
                return res.send('Server Error for sending task\n' + error)
            }
            console.log('Task sent');
            return res.redirect('/model_type');
        })
    })
})

router.get('/model_type', function (req, res) {
    return res.render('model_type.html');
})

router.get('/chart-ego', function (req, res) {
    let task_hash = req.cookies.task_hash || 'no_hash';
    let promise_get_user_id = new Promise(resolve => {
        if (req.cookies.user_id) {
            resolve(req.cookies.user_id);
            // console.log("user_id is already in cookie");
        } else {
            // console.log("user_id is not in cookie");
            DB.getUserID(req.cookies.sid, function (error, user_id) {
                if (error) {
                    return res.send('Server Error\n' + error);
                }
                resolve(user_id);
            })
        }
    })
    let get_logit_model = function (user_id) {
        return new Promise(resolve => {
            DB.getLogitModel(user_id, task_hash,1,function (error, logit_results) {
                if (error) {
                    return res.send('Server Error\n' + error);
                }
                resolve(logit_results);
            })
        })
    }

    promise_get_user_id
        .then(user_id => get_logit_model(user_id))
        .then(logit_results => {
            res.cookie('latest_ego_estimation', JSON.stringify(logit_results))
            var notes = [];
            if (logit_results['Move'] < 0) {
                notes.push('当其他属性保持不变时，你不愿意搬家。');
                if (logit_results['Rent'] < 0) {
                    const tmp = Math.round((logit_results['Move'] / logit_results['Rent']));
                    notes.push('当其他属性保持不变时，你愿意为了月租金减少' + tmp + '元而搬家。');
                }
                if (logit_results['Commute Distance'] < 0) {
                    const tmp = Math.round((logit_results['Move'] / logit_results['Commute Distance'])*10) / 10;
                    notes.push('当其他属性保持不变时，你愿意为通勤距离距离减少' + tmp + 'km而搬家。');
                }
            } else {
                notes.push('即使其他属性保持不变，你也乐于搬家。');
            }
            if (logit_results['Rent'] * logit_results['Commute Distance'] > 0) {
                const tmp = Math.round((logit_results['Commute Distance'] / logit_results['Rent']));
                notes.push('当比较两个新的住宅时, 你愿意为通勤距离减少1km而多支付' + tmp + '元的月租金。');
            }
            if (logit_results['Rent'] * logit_results['Large Size'] < 0) {
                const tmp = -Math.round((logit_results['Large Size'] / logit_results['Rent']));
                notes.push('当比较一大一小两个新住宅时，你愿意为大房间多支付' + tmp + '元的月租金。');
            }
            return res.render('chart.html',
                {
                    data: logit_results,
                    model_type: '你的个人偏好',
                    alt_model_type_1: '集体的平均偏好',
                    alt_model_type_2: '偏好多样性',
                    notes: notes
                });
        })
})

router.get('/chart-population', function (req, res) {
    let get_overall_logit_model = function () {
        return new Promise(resolve => {
            DB.getLogitModel(0, 'no_hash',1,function (error, logit_results) {
                if (error) {
                    return res.send('Server Error\n' + error);
                }
                resolve(logit_results);
            })
        })
    }

    get_overall_logit_model()
        .then(logit_results => {
            res.cookie('latest_population_estimation', JSON.stringify(logit_results));
            var notes = [];
            if (logit_results['Move'] < 0) {
                notes.push('当其他属性保持不变时，你不愿意搬家。');
                if (logit_results['Rent'] < 0) {
                    const tmp = Math.round((logit_results['Move'] / logit_results['Rent']));
                    notes.push('当其他属性保持不变时，你愿意为了月租金减少' + tmp + '元而搬家。');
                }
                if (logit_results['Commute Distance'] < 0) {
                    const tmp = Math.round((logit_results['Move'] / logit_results['Commute Distance'])*10) / 10;
                    notes.push('当其他属性保持不变时，你愿意为通勤距离距离减少' + tmp + 'km而搬家。');
                }
            } else {
                notes.push('即使其他属性保持不变，你也乐于搬家。');
            }
            if (logit_results['Rent'] * logit_results['Commute Distance'] > 0) {
                const tmp = Math.round((logit_results['Commute Distance'] / logit_results['Rent']));
                notes.push('当比较两个新的住宅时, 你愿意为通勤距离减少1km而多支付' + tmp + '元的月租金。');
            }
            if (logit_results['Rent'] * logit_results['Large Size'] < 0) {
                const tmp = -Math.round((logit_results['Large Size'] / logit_results['Rent']));
                notes.push('当比较一大一小两个新住宅时，你愿意为大房间多支付' + tmp + '元的月租金。');
            }
            return res.render('chart.html',
                {
                    data: logit_results,
                    model_type: '集体的平均偏好',
                    alt_model_type_1: '你的个人偏好',
                    alt_model_type_2: '偏好多样性',
                    notes: notes
                });
        })
})

router.get('/mxlogit', function (req, res) {
    let task_hash = req.cookies.task_hash || 'no_hash';
    let promise_get_user_id = new Promise(resolve => {
        if (req.cookies.user_id) {
            resolve(req.cookies.user_id);
        } else {
            DB.getUserID(req.cookies.sid, function (error, user_id) {
                if (error) {
                    return res.send('Server Error\n' + error);
                }
                resolve(user_id);
            })
        }
    })

    let get_individual_params = function (user_id) {
        return new Promise(resolve => {
            DB.getLogitModel(user_id, task_hash, 2, function (error, individual_params) {
                if (error) {
                    return res.send('Server Error\n' + error);
                }
                resolve(individual_params)
            })
        })
    }

    let get_mxlogit_model = function (individual_params) {
        return new Promise(resolve => {
            DB.getLogitModel(0,'no_hash', 2,function (error, mxlogit_results) {
                if (error) {
                    return res.send('Server Error\n' + error);
                }
                resolve({
                        mxlogit_results: mxlogit_results,
                        individual_params: individual_params
                });
            })
        })
    }

    promise_get_user_id
        .then(user_id => get_individual_params(user_id))
        .then(individual_params => get_mxlogit_model(individual_params))
        .then(results => {
            // res.cookie('latest_mxl_estimation', JSON.stringify(mxlogit_results));
            // res.cookie('latest_individual_params', JSON.stringify(individual_params));
            // return res.send(JSON.stringify(results.mxlogit_results) + '\n' + JSON.stringify(results.individual_params));
            return res.render("chart_mxl.html",
                {
                    mixed_logit: results.mxlogit_results,
                    ind_params: results.individual_params,
                })
        })
})


function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
            break;
        case 2:
            return parseInt(Math.random() * ( maxNum - minNum + 1 ) + minNum, 10);
            //或者 Math.floor(Math.random()*( maxNum - minNum + 1 ) + minNum );
            break;
        default:
            return 0;
            break;
    }
}


function randperm(N) {
    var x = Array.from(Array(N).keys());
    for (let i=N-1; i>0; i--) {
        let j = Math.floor(Math.random()*(i+1));
        [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
}

module.exports = router;