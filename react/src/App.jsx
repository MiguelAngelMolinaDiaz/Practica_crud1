// Importar los estilos locales del componente App
import './App.css'

// Componenete principal funcional
function App() {
  return (
    //Contenedor general de la landing page
    <div className='landing'>
      {/* Barra de navegación superior */}
      <header className='topbar'>
        {/* Nombre de marca o empresa */}
        <p className='brand'>Marca</p>
        {/* Menú anclado a secciones internas de la misma pagina */}
        <nav className='menu' aria-label='navegacion principal'>
          <a href="#react"> React</a>
          <a href="#backend"> Backend</a>
          <a href="#frontend"> Fontend</a>
        </nav>
      </header>

      <main>
        {/* hero principal, pide scroll  */}
        <section className='hero'>
          {/* Etiqueta corta de posicionamiento */}
          <p className='tag'>Diseño en react</p>
          {/* titulo principal */}
          <h1>Pagina diseáda en React</h1>
          {/* Descripcion del valor */}
          <p className='hero-copy'>Creamos software con Node.js y React</p>

          {/* Botones de accion */}
          <div className='actions'>
            <button type="button" className='btn btn-primary'>Comenzar</button>
            <button type="button" className='btn btn-ghost'>Ver portafolio</button>
          </div>
          {/* Indicadores */}
          <ul className='stats' aria-label='Indicadores'>
            <li>
              <strong>+120</strong>
              Poyectos lanzados
            </li>
            <li>
              <strong>90%</strong>
              Cliemtes Satisfechos
            </li>
            <li>
              <strong>+120</strong>
              Tiempo de respuesta
            </li>
          </ul>

        </section>
      </main>
    </div>
  )
}

export default App
