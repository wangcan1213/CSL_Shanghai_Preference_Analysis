import time

from scipy import optimize   
from scipy.stats import norm
import pandas as pd
import numpy as np
import json
from collections import OrderedDict
import pylogit as pl
import warnings
warnings.filterwarnings("ignore")

def clogit_ll(b, y, X, wei=None):
    b = b.reshape(-1, 1)
    y = y.reshape(-1, 1)
    ncs = len(y)
    nvar = X.shape[1]
    nalt = len(np.unique(y))
    V = np.zeros((ncs, nalt))
    for i in range(nalt):
        V[:,[i]] = np.matmul(X[:, :, i], b)
    V = V - V.mean(axis=1, keepdims=True)   
    num, dem = np.zeros((ncs, 1)), np.zeros((ncs, 1))
    for i in range(nalt):
        num = (y==i) * V[:,[i]] + num
        dem = np.exp(V[:,[i]]) + dem
    if wei is not None:
        ll = np.sum((np.log(dem) - num) * wei)
    else:
        ll = np.sum(np.log(dem) - num)
    return ll
    
def clogit(df, alts, choice_column='choice', rhs_columns=[], rh2_columns=[], weight=None, base_alt=None, point_only=False):
    """
    it is a little bit weird that this version, which uses scipy.optimize.fmin_bfgs, the solution (point estimate) and fval
    is correct, but the gradient and hess is inaccurate, and makes stderr, t-value, p-value inaccurate. Nevertheless, they are 
    just inaccurate but the generally OK. Matlab version use the exactly the same method and produce accurate results.
    """

    df = df.copy()
    nalt = len(alts)
    ncs = int(df.shape[0] / nalt)
    if len(rh2_columns) > 0:
        if base_alt is None:
            base_alt = alts[-1]
        df['asc'] = 1
        df_asc = pd.DataFrame(columns=alts)
        all_zeros = np.zeros((ncs, nalt))
        for alt in alts:
            tmp = all_zeros.copy()
            tmp[:, alts.index(alt)] = 1
            df_asc[alt] = tmp.flatten() 
    for rh2 in rh2_columns:
        for alt in alts:
            if alt != base_alt: 
                df['{}:{}'.format(rh2, alt)] = df[rh2]*df_asc[alt]
                rhs_columns.append('{}:{}'.format(rh2, alt))
    
    choice = np.asarray(df[choice_column]).reshape(-1, nalt)
    y = choice.argmax(axis=1)
    rhs = np.asarray(df[rhs_columns])
    X = np.asarray([rhs[i*nalt:(i+1)*nalt].T for i in range(ncs)])
    
    if weight is None:
        wei = None
    elif isinstance(weight, str) and weight in df.columns:
        weight_raw = np.asarray(df[weight_column]).reshape(-1, nalt)
        if np.all(weight_raw == weight_raw[:,0].reshape(-1,1)*np.ones(weight_raw.shape)):
            wei = weight_raw[:,0].reshape(-1,1)
        else:
            wei = None
            print('Invalid weight_column: {}, use unweighted data'.format(weight_column))
    elif isinstance(weight, dict):
        wei = np.ones((ncs, 1))
        for k, v in weight.items():
            wei[y==alts.index(k)] = v

    x0 = np.zeros(len(rhs_columns))
    opt_results = optimize.fmin_bfgs(clogit_ll, x0, args=(y,X, wei), full_output=1, disp=0)
    paramhat, fval, ihess = opt_results[0], opt_results[1], opt_results[3]
    # opt_results = optimize.minimize(clogit_ll, x0, args=(y,X,wei),method='BFGS')
    # paramhat, fval, ihess = opt_results['x'], opt_results['fun'], opt_results['hess_inv']
    para = np.asarray(paramhat)
    if not point_only:
        stderr = np.sqrt(np.diag(ihess))
        tvalue = paramhat / stderr
        pvalue = 2 * (1 - norm.cdf(abs(tvalue)))
    else:
        stderr, tvalue, pvalue = None, None, None
    if wei is None:
        ll0 = np.log(1/nalt) * ncs
    else:
        ll0 = np.sum(np.log(1/nalt)*np.ones((ncs,1)) * wei)
    r2 = 1 - (-fval)/ll0
    return {'var':rhs_columns, 'para': para, 'se':stderr, 't':tvalue, 
                'p':pvalue, 'll':-fval, 'll0':ll0, 'r2':r2}



def print_result(rst, return_str=False):
    para, se, t, p, var = rst['para'], rst['se'], rst['t'], rst['p'], rst['var']
    max_len = max([len(this_var) for this_var in var] + [len('variable')] ) + 1
    idx = range(len(var))
    s = []
    s.append('LL for null model: {:<10.4f}'.format(rst['ll0']))
    s.append('LL for estimated model: {:<10.4f}'.format(rst['ll']))
    s.append('McFadden R-square: {:<10.4f}'.format(rst['r2']))
    if se is not None:
        s.append('-'*60)
        s.append('{:{}s} {:>12s} {:>12s} {:>12s} {:>12s}'.format('variable', max_len, 'coeff', 'S.E.', 't-value', 'p-value'))
        for this_var, this_para, this_se, this_t, this_p, this_idx in zip(var, para, se, t, p, idx):
            s.append('{:{}s} {:12.4f} {:12.4f} {:12.4f} {:12.4f}'.format(this_var, max_len, this_para, this_se, this_t, this_p))

        s = '\n'.join(s)
    else:
        s.append('-'*30)
        s.append('{:{}s} {:>12s}'.format('variable', max_len, 'coeff'))
        for this_var, this_para in zip(var, para):
            s.append('{:{}s} {:12.4f}'.format(this_var, max_len, this_para))

        s = '\n'.join(s)
    print(s)
    if return_str:
        return s
        
def prepare_logit_data_df(data):
    obj = []
    for ex in data:
        ans_id, user_id, ex_id, answer = ex
        row_alt_a = experiments[ex_id]['alt_a'].copy()
        row_alt_b = experiments[ex_id]['alt_b'].copy()
        row_alt_a['group'] = ans_id
        row_alt_b['group'] = ans_id
        row_alt_a['user_id'] = user_id
        row_alt_b['user_id'] = user_id
        # print(row_alt_a)
        # print(row_alt_b)
        if answer == 1:
            row_alt_a['choice'] = 1
        elif answer == 2:
            row_alt_b['choice'] = 1

        obj += [row_alt_a, row_alt_b]

    df = pd.DataFrame(obj)
    return df 

def pylogit_logit_estimate():
    spec = OrderedDict()
    variable_names = OrderedDict()
    for var in rhs_columns:
        spec[var] = [ [1, 2] ]
        variable_names[var] = [var]
    model = pl.create_choice_model(data = df,
                        alt_id_col="alt",
                        obs_id_col="group",
                        choice_col="choice",
                        specification=spec,
                        model_type = "MNL",
                        names = variable_names
    )
    numCoef = sum([len(spec[s]) for s in spec])
    model.fit_mle(np.zeros(numCoef))
    print(model.get_statsmodels_summary())
    return model

try:
    experiments = json.load(open('DOE_logit_long_form.json', 'r'))
except:
    from get_doe_long_form import get_doe_logit_long_form, profile_to_logit_row
    print('Generate experiments in logit long form')
    get_doe_logit_long_form()
    experiments = json.load(open('DOE_logit_long_form.json', 'r'))


def pylogit_mxlogit_estimate(data, rhs_columns, random_varnames, num_draws=100):
    spec = OrderedDict()
    variable_names = OrderedDict()
    for var in rhs_columns:
        spec[var] = [ [1, 2] ]
        variable_names[var] = [var]

    mixed_model = pl.create_choice_model(data = data,
                    alt_id_col="alt",
                    obs_id_col="group",
                    choice_col="choice",
                    specification=spec,
                    model_type = "Mixed Logit",
                    names = variable_names,
                    mixing_id_col = 'user_id',
                    mixing_vars = random_varnames
    )
    numCoef = sum([len(spec[s]) for s in spec]) + len(random_varnames)
    mixed_model.fit_mle(np.zeros(numCoef), num_draws=num_draws)
    print(mixed_model.get_statsmodels_summary())
    return mixed_model