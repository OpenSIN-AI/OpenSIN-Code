from .step03_fill import fill_password
async def run(tab, password: str) -> bool:
    return await fill_password(tab, password)
