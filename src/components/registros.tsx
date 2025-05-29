import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import "../styles/registros.css";

interface Registro {
  id: number;
  placa: string;
  tipo: string;
  hora: string;
}

const Registros: React.FC = () => {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [factura, setFactura] = useState<string | null>(null);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Registro | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/registros")
      .then((res) => res.json())
      .then((data) => {
        setRegistros(data.registros || data);
      })
      .catch((err) => {
        console.error("Error al cargar registros:", err);
      });
  }, []);

  const registrarSalida = (registro: Registro) => {
    const horaEntrada = new Date(registro.hora);
    const horaSalida = new Date();
    const minutos = Math.ceil((horaSalida.getTime() - horaEntrada.getTime()) / 60000);

    const tarifa = registro.tipo === "Carro" ? 100 : 50;
    const total = minutos * tarifa;

    const facturaTexto = `
🧾 Factura de Salida

Placa: ${registro.placa}
Tipo: ${registro.tipo}
Hora de entrada: ${horaEntrada.toLocaleString()}
Hora de salida: ${horaSalida.toLocaleString()}
Tiempo: ${minutos} minuto(s)
Tarifa: $${tarifa} / minuto
--------------------------
Total a pagar: $${total}
    `;

    setFactura(facturaTexto);
    setRegistroSeleccionado(registro);
  };

  const cerrarFactura = () => {
    if (!registroSeleccionado) return;

    fetch(`http://localhost:5000/salida/${registroSeleccionado.id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("No se pudo eliminar el registro.");
        }
      })
      .then((data) => {
        alert(data.mensaje);
        setRegistros(registros.filter((r) => r.id !== registroSeleccionado.id));
        setFactura(null);
        setRegistroSeleccionado(null);
      })
      .catch((error) => {
        alert(error.message || "Error al conectar con el servidor.");
      });
  };

  return (
    <div className="registros-container">
      <h2 className="registros-title">Registros guardados</h2>

      {registros.length === 0 ? (
        <p>No hay registros aún.</p>
      ) : (
        <table className="registros-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Placa</th>
              <th>Tipo</th>
              <th>Fecha y hora de entrada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.placa}</td>
                <td>{r.tipo}</td>
                <td>{new Date(r.hora).toLocaleString()}</td>
                <td>
                  <Button variant="outline" onClick={() => registrarSalida(r)}>
                    Registrar salida
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {factura && (
        <div className="factura-box">
          <pre className="factura-text">{factura}</pre>
          <Button className="mt-2" onClick={cerrarFactura}>
            Cerrar factura
          </Button>
        </div>
      )}
    </div>
  );
};

export default Registros;
