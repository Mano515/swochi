import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "24px 16px", color: "var(--red)",
          background: "var(--surface)", borderRadius: "14px",
          margin: "16px", border: "1px solid var(--red)",
          fontSize: "13px",
        }}>
          <strong>Erreur de rendu :</strong> {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
