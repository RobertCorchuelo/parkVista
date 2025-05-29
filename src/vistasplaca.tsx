import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Database } from "lucide-react";
import { Link } from "react-router-dom";
import "../src/styles/vistasplaca.css";

interface Placa {
  texto: string;
  confianza: number;
  tipo: string;
}

const DetectorDePlacas: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [placas, setPlacas] = useState<Placa[]>([]);
  const [guardando, setGuardando] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("imagen", file);

    try {
      const res = await fetch("http://localhost:5000/placa", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setPlacas(data.placas || []);
    } catch (error) {
      console.error("Error al enviar la imagen:", error);
    }
  };

  const guardarEnBaseDeDatos = async (texto: string, tipo: string) => {
    setGuardando(texto);

    try {
      const res = await fetch("http://localhost:5000/guardar_placa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texto, tipo }),
      });

      const data = await res.json();
      alert(`Placa ${texto} guardada correctamente.`);
    } catch (error) {
      console.error("Error al guardar en la base de datos:", error);
      alert(`Error al guardar la placa ${texto}`);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="detector-container">
      <h2 className="detector-title">Detector de Placas</h2>

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="file-input"
        />
        <button onClick={handleUpload} className="upload-button">
          <UploadCloud className="w-5 h-5" />
          Subir y Detectar
        </button>
      </div>

      <nav className="nav-links">
        <Link to="/">Detector de Placas</Link>
        <Link to="/registros">Ver Registros</Link>
      </nav>

      {placas.length > 0 && (
        <div className="results-container">
          <h3 className="results-title">Resultados</h3>
          <ul>
            {placas.map((p, i) => (
              <li key={i} className="placa-item">
                <div>
                  <span className="placa-text">{p.texto}</span>
                  <span className="placa-confianza">
                    {" "}
                    — Confianza: {p.confianza.toFixed(2)}
                  </span>
                  <br />
                  <span className="placa-tipo">Tipo: {p.tipo}</span>
                </div>
                <button
                  onClick={() => guardarEnBaseDeDatos(p.texto, p.tipo)}
                  disabled={guardando === p.texto}
                  className="save-button"
                >
                  <Database
                    className={`save-icon ${guardando === p.texto ? "spin" : ""}`}
                  />
                  {guardando === p.texto ? "Guardando..." : "Guardar"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DetectorDePlacas;
