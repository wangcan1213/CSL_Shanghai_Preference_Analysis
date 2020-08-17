import time

import pymysql
import sys
from os import path,chdir
from scipy import optimize   
from scipy.stats import norm
import pandas as pd
import numpy as np
import json
from estimate_utils import *


print('\nProcess for individual level estimation following mixed logit is running...')
try:
    experiments = json.load(open('DOE_logit_long_form.json', 'r'))
except:
    from get_doe_long_form import get_doe_logit_long_form, profile_to_logit_row
    print('Generate experiments in logit long form')
    get_doe_logit_long_form()
    experiments = json.load(open('DOE_logit_long_form.json', 'r'))

conn = pymysql.connect(
    host = '127.0.0.1',
    port = 3306,
    user = 'workshop',
    password = 'workshop123',
    db = 'workshop',
    charset = 'utf8'
)


with conn.cursor() as cur:
    get_task_sql = 'select task_id, user_id, task_hash from task_tbl where model_type=2 order by task_id'

    while True:
        try:
            cur.execute(get_task_sql)
            conn.commit()
            tasks = cur.fetchall()
            if len(tasks) == 0:
                time.sleep(1)
                continue
            else:
                task_id, user_id, task_hash = tasks[0]
                print('\n\n[ok][Individual estimation] Task is received, user_id={}, task_hash={}\n'.format(user_id, task_hash) +  '-'*40)
                t0 = time.time()
        except Exception as e:
            print('[error][Individual estimation] unable to load tasks from task_tbl')
            print(e)
            conn.rollback()

        # implemete task and send estimation results
        # get data
        fetch_ans_sql = 'select ans_id, user_id, experiment_id, answer from ans_tbl where user_id="{}" order by ans_id'.format(user_id)
        try:
            # print('\n', fetch_ans_sql, '\n')
            cur.execute(fetch_ans_sql)
            data = cur.fetchall()
        except Exception as e:
            print('[error][Individual estimation] unable to fetch choice data from mysql')
            print(e)
            conn.rollback()
        individual_df = prepare_logit_data_df(data)

        # get mxlogit model
        fetch_mxl_sql = 'select results from logit_tbl where user_id=0 and model_type=2'
        while True:
            try:
                cur.execute(fetch_mxl_sql)
                mxl = cur.fetchall()
                if len(mxl) > 0:
                    mxlogit_rst_json = json.loads(mxl[0][0])
                    break
            except Exception as e:
                print('[error][Individual Estimation] unable to fetch mixed logit model')
                print(e)
                conn.rollback()
        
        rhs_columns = ['mask_1', 'mask_2', 'social_dist', 'commute_dist', 'working_day', 'working_hour',
            'home_time', 'refresh_1', 'refresh_2', 'restaurant_1', 'restaurant_2']
        individual_rst = individual_estimate(individual_df, mxlogit_rst_json, rhs_columns, num_draws=800)
        individual_rst = json.dumps(individual_rst)



        # send results
        # send_results_sql = 'insert into logit_tbl (user_id, task_hash, results) values (%s, %s, %s)'
        send_results_sql = 'insert into logit_tbl (user_id, model_type, task_hash, results) values ({}, 2, "{}", \'{}\')'.format(
            user_id, task_hash, individual_rst)
        try:
            cur.execute(send_results_sql)
            print('[ok][Individual estimation] Individual results for mixed Logit are sent to logit_tbl')
        except Exception as e:
            print('[error][Individual estimation] unable to send individual results for mixed logit to logit_tbl')
            print(e)
            conn.rollback()
        
        # remove task from task_tbl
        # this task might be modified by js, in this case should throw no error, just do not delete
        remove_task_sql = 'delete from task_tbl where task_hash="{}" and model_type=2'.format(task_hash)
        try:
            cur.execute(remove_task_sql)
            conn.commit()
            print('[ok][Individual estimation] The solved task is removed')
        except Exception as e:
            print('[error][Individual estimation] unable to remove the solved task from task_tbl')
            print(e)   
            conn.rollback()
        t1 = time.time()
        print(individual_rst, '\n', 'Task solving time: {:4.4f} seconds\n\n'.format(t1-t0))





        

# conn.close()

        



