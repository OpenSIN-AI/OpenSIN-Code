# Single action: validates a step video via NVIDIA NIM cosmos-reason2-8b
import base64, os, sys
from openai import OpenAI
from pathlib import Path

def check(video_path: str, task_desc: str) -> None:
    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=os.environ["NVIDIA_API_KEY"])
    video_b64 = base64.b64encode(Path(video_path).read_bytes()).decode()
    resp = client.chat.completions.create(
        model="nvidia/cosmos-reason2-8b",
        messages=[{"role":"user","content":[
            {"type":"text","text":f"Task: {task_desc}. Analysiere den Desktop. Wurde die Aktion fehlerfrei ausgeführt? Antworte mit <think>...</think> STATUS: VALIDATED oder STATUS: ERROR:[Grund]"},
            {"type":"video_url","video_url":{"url":f"data:video/mp4;base64,{video_b64}"}}
        ]}],
        extra_body={"media_io_kwargs":{"video":{"fps":4.0}}}
    )
    result = resp.choices[0].message.content
    if "STATUS: VALIDATED" not in result:
        print(f"[nim_check] ABBRUCH: {result}"); sys.exit(1)
    print(f"[nim_check] VALIDATED: {task_desc}")
