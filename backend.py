from multiprocessing import Process
import subprocess
from os import path, chdir
import sys
chdir(path.dirname(path.abspath(sys.argv[0])) + '/python')

def new_process(py_name):
    subprocess.call(['python', py_name+'.py'])

# process_ego_logit = subprocess.call(['python', 'python/estimate.py'])
# process_population_logit = subprocess.call(['python', 'python/estimate_all.py'])
# process_mxlogit = subprocess.call(['python', 'python/estimate_all_mxl.py'])
# process_mxlogit_individual = subprocess.call(['python', 'python/estimate_mxl_individual.py'])

if __name__ == '__main__':
    process_ego_logit = Process(target=new_process, args=('estimate',))
    process_population_logit = Process(target=new_process, args=('estimate_all',))
    process_mxlogit = Process(target=new_process, args=('estimate_all_mxl',))
    process_mxlogit_individual = Process(target=new_process, args=('estimate_mxl_individual',))

    process_ego_logit.start()
    process_population_logit.start()
    process_mxlogit.start()
    process_mxlogit_individual.start()