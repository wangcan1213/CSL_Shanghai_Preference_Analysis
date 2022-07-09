FROM python:3.7-slim 

MAINTAINER canwang<wangcan1213@gmail.com>

ADD . .

# if not using tencentyun, the decomment the following line to use default pip src
# RUN pip install -r requirements.txt
RUN pip install -r requirements.txt -i http://mirrors.tencentyun.com/pypi/simple --trusted-host mirrors.tencentyun.com

CMD ["python", "backend.py"]