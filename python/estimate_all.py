import time
from datetime import datetime
import pymysql
import sys
from os import path,chdir
from scipy import optimize   
from scipy.stats import norm
import pandas as pd
import numpy as np
import json
from estimate_utils import *




conn = pymysql.connect(
    host = '127.0.0.1',
    port = 3306,
    user = 'workshop',
    password = 'workshop123',
    db = 'workshop',
    charset = 'utf8'
)


with conn.cursor() as cur:
    while True:
        print('\n\nOverall Mode Estimation at {}'.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        # get data
        fetch_ans_sql = 'select ans_id, user_id, experiment_id, answer from ans_tbl order by ans_id'
        try:
            # print('\n', fetch_ans_sql, '\n')
            cur.execute(fetch_ans_sql)
            data = cur.fetchall()
        except Exception as e:
            print('[error] unable to fetch choice data from mysql')
            print(e)
            conn.rollback()
        df = prepare_logit_data_df(data)
        df.to_csv('data.csv', index=False)

        # estimate model
        alts = ['A', 'B']
        rhs_columns = ['mask_1', 'mask_2', 'social_dist', 'commute_dist', 'working_day', 'working_hour',
            'home_time', 'refresh_1', 'refresh_2', 'restaurant_1', 'restaurant_2']
        logit_rst = clogit(df, alts, choice_column='choice', rhs_columns=rhs_columns, point_only=False)
        print('Logit estimation')
        print_result(logit_rst)
        print('')
        logit_rst_json = {var:param for var, param in zip(logit_rst['var'], logit_rst['para'])}
        logit_rst_json['r2'] = logit_rst['r2']
        logit_rst_json = json.dumps(logit_rst_json)

        # send results
        # send_results_sql = 'insert into logit_tbl (user_id, task_hash, results) values (%s, %s, %s)'
        send_results_sql = 'insert into logit_tbl (user_id, task_hash, results) values ({}, "{}", \'{}\') on duplicate key update results=\'{}\''.format(
            0, 'no_hash', logit_rst_json, logit_rst_json)
        try:
            cur.execute(send_results_sql)
            conn.commit()
            print('[ok] Overall logit results are sent to logit_tbl')
        except Exception as e:
            print('[error] unable to send overall logit estimate results to logit_tbl')
            print(e)
            conn.rollback()

        time.sleep(10)
        



        

# conn.close()

        



