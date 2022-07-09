import numpy as np
import pandas as pd
import json

mean_para = {
    'mask_1': 0.5,
    'mask_2': 0.2,
    'social_dist': 0.5,
    'commute_dist': 0.08,
    'working_day': 0.2,
    'working_hour': 0.1,
    'home_time': 0.3,
    'refresh_1': -0.4,
    'refresh_2': -0.2,
    'restaurant_1': -0.4,
    'restaurant_2': -0.2
}

varnames = list(mean_para.keys())

mean_para = {var:2*mean_para[var] for var in varnames}

std_para = {
    'mask_1': 0.1,
    'mask_2': 0.1,
    'social_dist': 0.05,
    'commute_dist': 0.01,
    'working_day': 0.2,
    'working_hour': 0.05,
    'home_time': 0.05,
    'refresh_1': 0.1,
    'refresh_2': 0.05,
    'restaurant_1': 0.1,
    'restaurant_2': 0.05
}

## logit
# std_para = {var:0 for var in varnames}

n_users = 100

ex_list = json.load(open('DOE_logit_long_form.json', 'r'))
data = []
group_num = 0
for u in range(n_users):
    his_params = {var: np.random.normal(mean_para[var], std_para[var],1) for var in varnames}
    his_ex_list = np.random.choice(ex_list, 20, False)
    for ex in his_ex_list:
        row_a = ex['alt_a'].copy()
        row_b = ex['alt_b'].copy()
        row_a['group'] = group_num
        row_b['group'] = group_num
        row_a['alt'] = 1
        row_b['alt'] = 2
        row_a['choice'] = 0
        row_b['choice'] = 0
        row_a['user_id'] = u
        row_b['user_id'] = u
        this_v_a, this_v_b = [0, 0]
        for var in varnames:
            this_v_a += ex['alt_a'][var] * his_params[var]
            this_v_b += ex['alt_b'][var] * his_params[var]
        m = np.asarray([this_v_a, this_v_b]).mean()
        this_v_a -= m
        this_v_b == m
        this_v_a = min(this_v_a, 700)
        this_v_b = min(this_v_b, 700)
        ev_a, ev_b = np.exp(this_v_a), np.exp(this_v_b)
        p_a, p_b  = ev_a/(ev_a+ev_b), ev_b/(ev_a+ev_b)
        rst = np.random.choice([1,2], 1, False, [p_a[0], p_b[0]])
        if rst == 1:
            row_a['choice'] = 1
        elif rst == 2:
            row_b['choice'] = 1
        group_num += 1
        data += [row_a, row_b]
df = pd.DataFrame(data)
df['num_groups'] = 20
df.to_csv('sample_data.csv', index=False)



