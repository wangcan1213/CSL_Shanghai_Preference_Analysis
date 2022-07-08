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



print('\nProcess for mixed logit estimation is running...')
conn = pymysql.connect(
    host = '127.0.0.1',
    port = 3306,
    user = 'workshop',
    password = 'workshop123',
    db = 'workshop_az',
    charset = 'utf8'
)


with conn.cursor() as cur:
    while True:
        print_str = '\n\nMixed Logit Model Estimation at {}\n'.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")) + '\n'
        t1 = time.time()
        # get data
        fetch_ans_sql = 'select ans_id, user_id, experiment_id, answer from ans_tbl order by ans_id'
        try:
            # print('\n', fetch_ans_sql, '\n')
            cur.execute(fetch_ans_sql)
            data = cur.fetchall()
        except Exception as e:
            print('[error][Mixed logit] unable to fetch choice data from mysql')
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

        mixed_model = pylogit_mxlogit_estimate(df, rhs_columns, rhs_columns, seed=19880210)
        print_str = print_str + str(mixed_model.get_statsmodels_summary()) + '\n'
        mxlogit_rst_json_raw = dict(mixed_model.coefs);
        mxlogit_rst_json = {'r2': mixed_model.rho_squared}
        for var, value in mxlogit_rst_json_raw.items():
            if not var.startswith('Sigma '):
                if var in mxlogit_rst_json:
                    mxlogit_rst_json[var]['mean'] = value
                else:
                    mxlogit_rst_json[var] = {'mean':value, 'std':0}
            else:
                real_var = var[6:]
                if real_var in mxlogit_rst_json:
                    mxlogit_rst_json[real_var]['std'] = np.abs(value)
                else:
                    print('[error][Mixed logit] Possible error in parsing mixed logit results: ({}: {})'.format(var, value))

        mxlogit_rst_json = json.dumps(mxlogit_rst_json)

        # send results
        send_results_sql = 'insert into logit_tbl (user_id, task_hash, results, model_type) values (0, "{}", \'{}\', 2) on duplicate key update results=\'{}\''.format(
            'no_hash', mxlogit_rst_json, mxlogit_rst_json)
        try:
            cur.execute(send_results_sql)
            conn.commit()
            print_str += '[ok][Mixed logit] Overall logit results are sent to logit_tbl' + '\n'
        except Exception as e:
            print('[error][Mixed logit] unable to send overall logit estimate results to logit_tbl')
            print(e)
            conn.rollback()

        t2 = time.time()
        print_str = print_str + 'Mixed logit model estimation took {:4.4f} seconds'.format(t2-t1) + '\n\n'
        print(print_str)
        time.sleep(10)
        



        

# conn.close()

        



