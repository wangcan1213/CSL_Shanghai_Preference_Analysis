const mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'workshop',
    password: 'workshop123',
    database: 'workshop_az'
});


connection.connect();

exports.addAns = function (sid, experiment_id, ans, callback) {
    // get user_id by either select from user_tbl or insert a new user to user_tbl;
    let get_user_id = function () {
        return new Promise(resolve => {
            let sql_check_sid = 'SELECT user_id FROM `user_tbl` WHERE sid=?';
            connection.query(sql_check_sid, [sid], function (error, results) {
                if (error) {
                    return callback(error);
                }
                if (results.length > 0) {
                    resolve(results[0]['user_id']);
                } else {
                    let sql_insert_sid = 'INSERT INTO `user_tbl` SET ?';
                    connection.query(sql_insert_sid, {sid:sid}, function (error, results) {
                        if (error) {
                            return callback(error);
                        }
                        resolve(results.insertId);
                    })
                }
            })
        })

    }

    // insert the new record with user_id to ans_tbl
    let insert_ans = function (user_id) {
        return new Promise(resolve => {
            let sql_insert_ans = 'INSERT INTO `ans_tbl` SET ? ON DUPLICATE KEY UPDATE answer=?';
            connection.query(sql_insert_ans,
                [{experiment_id:experiment_id, answer:ans, user_id:user_id}, ans],
                function (error, results) {
                    if (error) {
                        return callback(error);
                    }
                    resolve(results);
                })
        })
    }

    get_user_id()
        .then((user_id) => insert_ans(user_id))
        .then(() => callback(null));
}

exports.getUserID = function(sid, callback) {
    let sql = 'SELECT user_id FROM `user_tbl` WHERE sid=?';
    connection.query(sql, [sid], function (error, results) {
        if (error) {
            return callback(error);
        }
        if (results.length > 1) {
            return callback('user_id is not unique');
        }
        if (results.length === 0){
            return callback('Unable to find a user_id.')
        }
        callback(null, results[0]['user_id']);
    })
}


exports.sendEgoTask = function(user_id, hash, callback) {
    let sql = 'INSERT INTO `task_tbl` SET ? ON DUPLICATE KEY UPDATE task_hash=?';
    p1 = new Promise(resolve => {
        connection.query(sql, [{user_id:user_id, task_hash:hash, model_type:1}, hash], function (error, results) {
            if (error) {
                return callback(error);
            }
            resolve();
        })
    });
    p2 = new Promise(resolve => {
        connection.query(sql, [{user_id:user_id, task_hash:hash, model_type:2}, hash], function (error, results) {
            if (error) {
                return callback(error);
            }
            resolve();
        })
    });
    p1.then(() => {return p2;})
        .then(() => {callback(null);})
}

exports.getLogitModel = function (user_id, task_hash, model_type, callback) {
    let sql = 'SELECT task_hash, results FROM `logit_tbl` WHERE user_id=? AND model_type=? ORDER BY model_id DESC';
    // let sql = 'SELECT results FROM `logit_tbl` WHERE user_id=' + user_id + ' AND model_type=1';
    let promise_query = function (user_id) {
        return new Promise(resolve => {
            connection.query(sql, [user_id, model_type],function (error, results) {
                if (error) {return callback(error);}
                resolve(results);
            })
        })
    };
    (async function  (user_id) {
        let crt_results, final_result;
        while (true) {
            crt_results = await promise_query(user_id);
            if (crt_results.length > 0) {
                if (task_hash === 'no_hash') {
                    final_result = crt_results[0];
                    break;
                } else {
                    let candidate_result = crt_results.find((rst) => rst.task_hash===task_hash);
                    if (candidate_result !== undefined) {
                        final_result = candidate_result;
                        break;
                    }
                }
            }
            console.log('Estimation seems to be still on the road: user_id = ' + user_id + ', task_hash = ' + task_hash + ', model_type = ' + model_type);
        }
        final_result = JSON.parse(final_result.results);
        callback(null, final_result);
    })(user_id);
}
