from unstructured.partition.auto import partition
import re


REMOVE_TYPES  = {"Header", "Footer", "PageNumber", "PhoneNumber", "EmailAddress"}
MIN_WORD_COUNT = 3


def get_elements_fast(file: str):
    return partition(strategy="fast", languages=["eng"], filename=file)

def get_elements_ocr(file: str):
    return partition(strategy="ocr_only", languages=["eng"], filename=file)

def get_elements_hi_res(file: str):
    return partition(strategy="hi_res", languages=["eng"], filename=file)


def clean_text(text: str) -> str:
    text = re.sub(r'[ \t]+', ' ', text)  
    text = re.sub(r'\n+', '\n', text)    
    return text.strip()

def clean_elements(elements) -> list[str]:
    cleaned = []
    for element in elements:
        if type(element).__name__ in REMOVE_TYPES:
            continue

        text = element.text or ""

        if len(text.split()) < MIN_WORD_COUNT:
            continue

        cleaned.append(clean_text(text))

    return cleaned