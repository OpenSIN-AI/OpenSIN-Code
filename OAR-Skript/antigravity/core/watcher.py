from typing import Callable
from .watcher_config import LOCK_FILE
from .watcher_loop import run_loop
class Watcher:
    def __init__(self, rotation_callback: Callable, poll_interval: float = 8.0):
        self.rotation_callback = rotation_callback
        self.poll_interval = poll_interval
        self._state: dict = {}
    def run(self) -> None:
        run_loop(self._state, self.rotation_callback, self.poll_interval)
