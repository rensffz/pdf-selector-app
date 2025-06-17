import os
import json

def scan_pdf_files(directory):
    pdf_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(".pdf"):
                pdf_files.append(file)  # Только имя, без пути
    return list(set(pdf_files))  # Убираем дубликаты, если они есть

if __name__ == "__main__":
    target_directory = "."  # текущая директория
    pdf_files = scan_pdf_files(target_directory)
    with open("files.json", "w", encoding="utf-8") as f:
        json.dump(pdf_files, f, indent=2, ensure_ascii=False)
    print(f"{len(pdf_files)} PDF-файлов записано в files.json")
