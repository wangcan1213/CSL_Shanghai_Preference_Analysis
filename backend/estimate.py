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
chdir(path.dirname(path.abspath(sys.argv[0])))


print('\nProccess for ego logit estimation is running...')
conn = pymysql.connect(
    host = 'sp-db',
    port = 3306,
    user = 'workshop',
    password = 'workshop123',
    db = 'workshop_az',
    charset = 'utf8'
)


with conn.cursor() as cur:
    get_task_sql = 'select task_id, user_id, task_hash from task_tbl where model_type=1 order by task_id'

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
                print_str = ''
                print_str = print_str + '\n\n[ok][Ego logit] Task is received, user_id={}, task_hash={}\n'.format(user_id, task_hash) +  '-'*40 + '\n'
                t0 = time.time()
        except Exception as e:
            print('[error][Ego logit] unable to load tasks from task_tbl')
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
            print('[error][Ego logit] unable to fetch choice data from mysql')
            print(e)
            conn.rollback()
        df = prepare_logit_data_df(data)
        # df.to_csv('data.csv', index=False)
        # estimate model
        # alts = ['A', 'B']
        # rhs_columns = ['mask_1', 'mask_2', 'social_dist', 'commute_dist', 'working_day', 'working_hour',
        #     'home_time', 'refresh_1', 'refresh_2', 'restaurant_1', 'restaurant_2']
        alts = ['Stay', 'Move']
        rhs_columns = ['Move', 'Commute Distance', 'Rent', 'Large Size', 'Density', 'Income Disparity']
        logit_rst = clogit(df, alts, choice_column='choice', rhs_columns=rhs_columns, point_only=False)
        print_str = print_str + 'Ego Logit estimation' + '\n' + print_result(logit_rst, print_str=False, return_str=True) + '\n'
        logit_rst_json = {var:param for var, param in zip(logit_rst['var'], logit_rst['para'])}
        logit_rst_json['r2'] = logit_rst['r2']
        logit_rst_json = json.dumps(logit_rst_json)

        # send results
        # send_results_sql = 'insert into logit_tbl (user_id, task_hash, results) values (%s, %s, %s)'
        send_results_sql = 'insert into logit_tbl (user_id, task_hash, results, model_type) values ({}, "{}", \'{}\', 1)'.format(
            user_id, task_hash, logit_rst_json)
        try:
            cur.execute(send_results_sql)
            print_str += '[ok][Ego logit] Logit results are sent to logit_tbl\n'
        except Exception as e:
            print('[error][Ego logit] unable to send logit estimate results to logit_tbl')
            print(e)
            conn.rollback()
        
        # remove task from task_tblprint_str1
        # this task might be modified by js, in this case should throw no error, just do not delete
        remove_task_sql = 'delete from task_tbl where task_hash="{}" and model_type=1'.format(task_hash)
        try:
            cur.execute(remove_task_sql)
            conn.commit()
            print_str += '[ok][Ego logit] The solved task is removed\n'
        except Exception as e:
            print('[error][Ego logit] unable to remove the solved task from task_tbl')
            print(e)   
            conn.rollback()
        t1 = time.time()
        print_str = print_str + 'Ego logit task solving time: {:4.4f} seconds\n\n'.format(t1-t0) + '\n\n'
        print(print_str)




        

# conn.close()

        



