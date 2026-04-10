import React from 'react'; // Importa React; necesario para que JSX funcione aunque no se use explícitamente
import ReactDOM from 'react-dom/client'; // API moderna de React 18 para montar la app en el DOM con createRoot
import './index.css'; // Estilos base globales de Create React App (body, html, reset)
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS para clases utilitarias y componentes UI responsivos
import './styles/main.css'; // Estilos personalizados del proyecto que extienden/sobreescriben Bootstrap
import App from './App'; // Componente raíz de la aplicación; contiene toda la lógica de navegación y estado
import reportWebVitals from './reportWebVitals'; // Función para medir métricas de rendimiento (FCP, LCP, CLS, etc.)

const root = ReactDOM.createRoot(document.getElementById('root')); // Crea la raíz React en el div#root del public/index.html; API de React 18 con concurrent features
root.render( // Monta el árbol de componentes en el DOM
  <React.StrictMode> {/* StrictMode activa advertencias adicionales en desarrollo: detecta efectos secundarios y APIs obsoletas */}
    <App /> {/* Componente raíz que gestiona autenticación, navegación y renderizado de todos los módulos */}
  </React.StrictMode>
);

// Si quieres medir rendimiento de la app, pasa una función como argumento
// Por ejemplo: reportWebVitals(console.log) para loguear métricas en consola
// O envíalas a un endpoint de analíticas. Ver: https://bit.ly/CRA-vitals
reportWebVitals(); // Inicializa la medición de métricas de rendimiento web (en modo silencioso sin callback)
reportWebVitals();
