import os

web_concurrency_str = os.getenv('WEB_CONCURRENCY', 1)
host = 'unix'
port = '///tmp/asgi.sock'
bind = f"{host}:{port}"
use_loglevel = os.getenv('LOG_LEVEL', 'info')


web_concurrency = int(web_concurrency_str)
assert web_concurrency > 0

accesslog_var = os.getenv("ACCESS_LOG", "-")
use_accesslog = accesslog_var or None
errorlog_var = os.getenv("ERROR_LOG", "-")
use_errorlog = errorlog_var or None
graceful_timeout_str = os.getenv("GRACEFUL_TIMEOUT", "120")
timeout_str = os.getenv("TIMEOUT", "120")
keepalive_str = os.getenv("KEEP_ALIVE", "5")

# Gunicorn config variables
loglevel = use_loglevel
workers = web_concurrency
errorlog = use_errorlog
worker_tmp_dir = "/dev/shm"
accesslog = use_accesslog
graceful_timeout = int(graceful_timeout_str)
timeout = int(timeout_str)
keepalive = int(keepalive_str)