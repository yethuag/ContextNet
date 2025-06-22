# text_utils.py
from bs4 import BeautifulSoup
import html, re

def html_to_text(raw_html: str) -> str:
    """
    Remove tags, unescape entities, collapse whitespace.
    """
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "lxml")        # fast parser
    text = soup.get_text(separator=" ", strip=True)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text