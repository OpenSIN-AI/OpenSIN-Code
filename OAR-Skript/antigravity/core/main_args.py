import argparse
def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="openAntigravity-auth-rotator")
    p.add_argument(
        "command",
        nargs="?",
        default="watch",
        choices=["watch", "setup", "rotate", "status", "cleanup"],
        help="watch=start watcher (default), setup=force setup, rotate=force rotation, status=list, cleanup=delete orphans",
    )
    return p
