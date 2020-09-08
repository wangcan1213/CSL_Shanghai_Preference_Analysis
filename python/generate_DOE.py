import pandas as pd
import numpy as np
from os import path, chdir
import sys
import json

chdir(path.dirname(sys.argv[0]))


"""
# this is for seq DOE methods
df = pd.read_csv('results.csv')
varnames = ["commute", "size", "price", "density", "income_disparity"]
df = df[varnames]
      

print(df.head())
data = []
for idx, row in df.iterrows():
    data.append(list(row))
# for k in range(len(data)): print(data[k])
num_experiments = len(data)
basket_a = list(range(num_experiments))
basket_b = basket_a.copy()

while sum([x==y for x,y in zip(basket_a, basket_b)])>0:
    np.random.shuffle(basket_b)

print('\n')
print('basket_a: ', basket_a)
print('basket_b: ', basket_b)
results = []
for experiment_idx in range(len(basket_a)):
    print('{}, {}'.format(data[basket_a[experiment_idx]], data[basket_b[experiment_idx]]))
    alt_a, alt_b = {}, {}
    for var_idx in range(8):
        alt_a[varnames[var_idx]] = int(data[basket_a[experiment_idx]][var_idx])
        alt_b[varnames[var_idx]] = int(data[basket_b[experiment_idx]][var_idx])
    results.append({'alt_a':alt_a, 'alt_b':alt_b})

# print(results)
"""

# this is for sim DOE methods
df = pd.read_csv('results_sim.csv')
varnames = ["commute", "size", "price", "density", "income_disparity"]
df = df[[x+'_a' for x in varnames] + [x+'_b' for x in varnames]] 
results = []
for idx, row in df.iterrows():
    tmp_a, tmp_b = list(row)[0:5], list(row)[5:10]
    alt_a, alt_b = {}, {}
    if tmp_a != tmp_b:
        for var_idx in range(5):
            alt_a[varnames[var_idx]] = tmp_a[var_idx]
            alt_b[varnames[var_idx]] = tmp_b[var_idx]
        results.append({'alt_a':alt_a, 'alt_b':alt_b})

json.dump(results, open('DOE.json', 'w'), indent=4)
