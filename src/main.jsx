import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// On récupère la div "root"
const rootElement = document.getElementById('root');

// On dessine l'application sans utiliser le mot-clé "React" qui pose problème
ReactDOM.createRoot(rootElement).render(
    <App />
)