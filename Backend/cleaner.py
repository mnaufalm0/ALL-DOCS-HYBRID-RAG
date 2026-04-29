from unstructured.partition.auto import partition
import re

REMOVE_TYPES = ["Header", "Footer", "PageNumber", "PhoneNumber", "EmailAddress"]

def get_elements_fast(file):
    return partition(strategy="fast", languages=["eng"], filename=file)

def get_elements_ocr(file):
    return partition(strategy="ocr_only", languages=["eng"], filename=file)

def get_elements_hi_res(file):
    return partition(strategy="hi_res", languages=["eng"], filename=file)

def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

def clean_elements(elements):
    cleaned_elements = []
    for element in elements:
        if type(element).__name__ in REMOVE_TYPES:  
            continue
        if len(element.text.split()) < 3:           
            continue
        cleaned_elements.append(clean_text(element.text))
    return cleaned_elements