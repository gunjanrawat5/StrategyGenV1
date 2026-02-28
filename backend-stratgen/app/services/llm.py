def generate_title(prompt: str) -> str:
    text = prompt.strip()
    if not text:
        return "Generated Game"
    return text[:60]
