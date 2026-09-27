import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">
          <MessageSquare size={18} />
        </div>
        <span className="navbar-title">Shocket</span>
      </Link>
      <Link to="/" className="navbar-link">Home</Link>
    </nav>
  );
}
