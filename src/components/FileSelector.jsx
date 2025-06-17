import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FileSelector = () => {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем данные из локального файла files.json
    fetch("/pdf-selector-app/files.json")
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => {
        console.error("Ошибка загрузки списка файлов:", err);
        setFiles([]);
      });
  }, []);

  // Функция обработки выбора файла
  const handleSelect = (fileName) => {
    navigate(`/select?fileName=${encodeURIComponent(fileName)}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Montserrat, sans-serif",
        backgroundColor: "#f9f9f9",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: 30 }}>Выберите PDF-файл</h1>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file, index) => (
            <li key={index} style={{ marginBottom: 15 }}>
              <button
                onClick={() => handleSelect(file)}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#4a90e2",
                  color: "white",
                  fontFamily: "Montserrat, sans-serif",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#3f7acb")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "#4a90e2")
                }
              >
                {file}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileSelector;
