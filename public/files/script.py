import os
import json

def scan_pdf_files(directory):
    pdf_files = []
    target_subdir = "public/files"
    full_path = os.path.join(directory, target_subdir)

    if os.path.isdir(full_path):
        for file in os.listdir(full_path):
            if file.lower().endswith(".pdf"):
                pdf_files.append(file)

    return pdf_files

if __name__ == "__main__":
    target_directory = "."  # текущая директория
    pdf_files = scan_pdf_files(target_directory)
    with open("files.json", "w", encoding="utf-8") as f:
        json.dump(pdf_files, f, indent=2, ensure_ascii=False)
    print(f"{len(pdf_files)} PDF-файлов записано в files.json")
