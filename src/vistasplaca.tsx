import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Database } from "lucide-react";

interface Placa {
  texto: string;
  confianza: number;
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
      console.log("Respuesta del backend:", data);
      setPlacas(data.placas || []);
    } catch (error) {
      console.error("Error al enviar la imagen:", error);
    }
  };

  const obtenerTipoVehiculo = (placa: string): "Carro" | "Moto" | "Desconocido" => {
    if (/^[A-Z]{3}\d{3}$/.test(placa)) return "Carro";
    if (/^[A-Z]{3}\d{2}[A-Z]$/.test(placa)) return "Moto";
    return "Desconocido";
  };

  const guardarEnBaseDeDatos = async (placa: string) => {
    const tipo = obtenerTipoVehiculo(placa);
    const hora = new Date().toISOString();

    setGuardando(placa);

    try {
      const res = await fetch("http://localhost:5000/guardar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ placa, tipo, hora }),
      });

      const data = await res.json();
      console.log("Guardado en BD:", data);
      alert(`Placa ${placa} guardada correctamente.`);
    } catch (error) {
      console.error("Error al guardar en la base de datos:", error);
      alert(`Error al guardar la placa ${placa}`);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Detector de Placas</h2>

      <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="block w-full sm:w-auto border rounded px-3 py-2 text-sm"
        />
        <Button onClick={handleUpload} className="bg-primary hover:bg-primary/90">
          <UploadCloud className="h-4 w-4 mr-2" />
          Subir y Detectar
        </Button>
      </div>

      {placas.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 border">
          <h3 className="text-lg font-semibold mb-2">Resultados</h3>
          <ul className="space-y-4">
            {placas.map((p, i) => (
              <li key={i} className="bg-gray-100 rounded p-3 flex justify-between items-center">
                <div>
                  <strong>{p.texto}</strong> — Confianza: {p.confianza.toFixed(2)} <br />
                  Tipo: {obtenerTipoVehiculo(p.texto)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => guardarEnBaseDeDatos(p.texto)}
                  disabled={guardando === p.texto}
                >
                  <Database className="w-4 h-4 mr-2" />
                  {guardando === p.texto ? "Guardando..." : "Guardar"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DetectorDePlacas;
