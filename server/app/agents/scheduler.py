import threading
import time
from app.agents.executor import execute_agent_cycle
from app.models.agent import Agent


class AgentScheduler:
    def __init__(self, socketio=None):
        self.socketio = socketio
        self._running = False
        self._thread = None
        self._interval = 30

    def start(self, socketio=None):
        if socketio:
            self.socketio = socketio
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self):
        while self._running:
            try:
                from app import create_app
                app = create_app()
                with app.app_context():
                    active_agents = Agent.query.filter_by(status="running").all()
                    for agent in active_agents:
                        execute_agent_cycle(agent.id, self.socketio)
            except Exception as e:
                print(f"[AgentScheduler] Error: {e}")

            time.sleep(self._interval)


scheduler = AgentScheduler()
