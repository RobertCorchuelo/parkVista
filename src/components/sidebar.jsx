import { Link } from 'react-router-dom';
import { FaCar, FaSignOutAlt, FaListUl } from 'react-icons/fa';
import '../styles/sidebar.css';
function Sidebar() {
  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <FaCar />
          </div>
          <h2>ParkVista</h2>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-content">
        <nav>
          <ul className="sidebar-menu">
            <li>
              <Link to="/placas" className="sidebar-link">
                <FaCar className="sidebar-icon" />
                <span>Ingresar Vehículo</span>
              </Link>
            </li>
            
            <li>
              <Link to="/registros" className="sidebar-link">
                <FaListUl className="sidebar-icon" />
                <span>Ver Vehículos</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Footer Status */}
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-indicator"></div>
          <span>Sistema Activo</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;