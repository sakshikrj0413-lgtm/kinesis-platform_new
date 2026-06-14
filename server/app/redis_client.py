import os
import redis

class FakeRedis:
    def setex(self, *args, **kwargs): pass
    def get(self, *args, **kwargs): return None
    def delete(self, *args, **kwargs): pass
    def exists(self, *args, **kwargs): return False

try:
    _client = redis.Redis(
        host=os.environ.get("REDIS_HOST", "127.0.0.1"),
        port=int(os.environ.get("REDIS_PORT", 6379)),
        db=0,
        socket_connect_timeout=1,
        protocol=2,
    )
    _client.ping()
    redis_client = _client
    print("[Redis] Connected")

except Exception as e:
    print("REDIS ERROR:", repr(e))
    redis_client = FakeRedis()
    print("[Redis] Not available - using fallback")