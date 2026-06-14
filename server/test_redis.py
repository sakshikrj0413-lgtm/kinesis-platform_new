try:
    import redis
    r = redis.Redis(host='127.0.0.1', port=6379, db=0, socket_connect_timeout=1, protocol=2)
    r.ping()
    print('OK')
except Exception as e:
    print('ERROR:', repr(e))