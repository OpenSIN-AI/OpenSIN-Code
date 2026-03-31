# Single action: stops a screen recording process
import subprocess, signal

def stop(proc: subprocess.Popen) -> None:
    if proc and proc.poll() is None:
        proc.send_signal(signal.SIGINT)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
