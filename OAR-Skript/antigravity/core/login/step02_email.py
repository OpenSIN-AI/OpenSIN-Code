from .step02_fill import fill_email
async def run(tab, email: str) -> bool:
    return await fill_email(tab, email)
