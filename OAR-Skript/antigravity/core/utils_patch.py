from .utils_log import log
def apply_nodriver_py314_patch() -> None:
    try:
        import pathlib, site
        for sp in site.getsitepackages():
            p = pathlib.Path(sp) / "nodriver" / "cdp" / "network.py"
            if p.exists():
                content = p.read_bytes()
                if b"\xb1" in content:
                    p.write_bytes(content.replace(b"\xb1", b"+-"))
                    log("Applied nodriver Python 3.14 patch")
                break
    except Exception as e:
        log(f"nodriver patch skipped: {e}", "WARN")
