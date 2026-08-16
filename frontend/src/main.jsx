// ════════════════════════════════════════════════════════════════
// FILE: main.jsx
// PURPOSE: Application entry point. Mounts the React root into the
//          DOM and wraps <App /> in StrictMode + a global
//          ErrorBoundary that renders a crash screen on failure.
// DEPENDS ON: App.jsx, styles/globals.css
// ════════════════════════════════════════════════════════════════
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

/**
 * Global React ErrorBoundary.
 * Catches unhandled rendering errors and displays a fallback crash UI
 * instead of a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#ffebee', color: '#b71c1c', fontFamily: 'monospace', height: '100vh', overflow: 'auto' }}>
          <h1>React App Crashed</h1>
          <p><b>{this.state.error && this.state.error.toString()}</b></p>
          <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
