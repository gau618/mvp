import React, { useState } from "react";
import "./LandingPage.css";

interface LandingPageProps {
  onLogin: (user: { email: string; name: string }) => void;
  user?: { email: string; name: string } | null;
  onEnterEditor?: () => void;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  user,
  onEnterEditor,
  onLogout,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!isLogin && !name) {
      setError("Please enter your name");
      return;
    }

    // Get existing users from localStorage
    const users = JSON.parse(localStorage.getItem("chronicle_users") || "[]");

    if (isLogin) {
      // Login logic
      const user = users.find(
        (u: any) => u.email === email && u.password === password
      );
      if (user) {
        localStorage.setItem(
          "chronicle_current_user",
          JSON.stringify({ email: user.email, name: user.name })
        );
        onLogin({ email: user.email, name: user.name });
        setShowAuthModal(false);
      } else {
        setError("Invalid email or password");
      }
    } else {
      // Sign up logic
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        setError("An account with this email already exists");
        return;
      }

      const newUser = { email, password, name };
      users.push(newUser);
      localStorage.setItem("chronicle_users", JSON.stringify(users));
      localStorage.setItem(
        "chronicle_current_user",
        JSON.stringify({ email, name })
      );
      onLogin({ email, name });
      setShowAuthModal(false);
    }
  };

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Intelligent Autocompletion",
      description:
        "Leverage advanced AI to enhance your writing workflow. Generate content, refine tone, and expand ideas seamlessly.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Focused Workspace",
      description:
        "A professional, distraction-free environment designed to maximize productivity and focus on content creation.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 6V12L16 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: "Secure Auto-Save",
      description:
        "Your work is automatically saved locally. Never lose critical documentation or drafts.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Adaptive Theming",
      description:
        "Professional dark and light modes optimized for extended writing sessions and eye comfort.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4H10V10H4V4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 4H20V10H14V4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 14H20V20H14V14Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 14H10V20H4V14Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Document Management",
      description:
        "Organize your workspace efficiently with an intuitive sidebar for quick access to all your projects.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3V21M3 12H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 7L12 3L8 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 17L12 21L8 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Tone Calibration",
      description:
        "Adjust AI output to match your specific requirements: professional, academic, formal, or creative.",
    },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="logo-icon"
            >
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path
                d="M8 10H24M8 16H20M8 22H16"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="logo-text">Chronicle</span>
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <button className="nav-btn secondary" onClick={onLogout}>
                  Log out
                </button>
                <button
                  className="nav-btn primary"
                  onClick={() => onEnterEditor?.()}
                >
                  Go to Editor
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-btn secondary"
                  onClick={() => {
                    setIsLogin(true);
                    setShowAuthModal(true);
                  }}
                >
                  Log in
                </button>
                <button
                  className="nav-btn primary"
                  onClick={() => {
                    setIsLogin(false);
                    setShowAuthModal(true);
                  }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                Enterprise-Grade AI Writing Assistant
              </div>
              <h1 className="hero-title">
                Professional Writing, <br />
                <span className="gradient-text">Enhanced by Intelligence</span>
              </h1>
              <p className="hero-description">
                Chronicle provides a secure, intelligent environment for
                professional documentation and creative workflows. Experience
                the future of writing today.
              </p>
              <div className="hero-actions">
                {user ? (
                  <button
                    className="hero-btn primary"
                    onClick={() => onEnterEditor?.()}
                  >
                    Go to Editor
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 10H16M16 10L11 5M16 10L11 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    className="hero-btn primary"
                    onClick={() => {
                      setIsLogin(false);
                      setShowAuthModal(true);
                    }}
                  >
                    Start Free Trial
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 10H16M16 10L11 5M16 10L11 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                <button className="hero-btn secondary">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M8 7L13 10L8 13V7Z" fill="currentColor" />
                  </svg>
                  View Demo
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">10,000+</span>
                  <span className="stat-label">Professionals</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                  <span className="stat-number">1M+</span>
                  <span className="stat-label">Documents Created</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Uptime</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Preview */}
            <div className="hero-preview">
              <div className="preview-window">
                <div className="preview-header">
                  <div className="preview-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="preview-title">Chronicle Editor</span>
                </div>
                <div className="preview-content">
                  <div className="preview-sidebar">
                    <div className="preview-sidebar-item active"></div>
                    <div className="preview-sidebar-item"></div>
                    <div className="preview-sidebar-item"></div>
                  </div>
                  <div className="preview-editor">
                    <div className="preview-line title"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                    <div className="preview-ai-text">
                      <span className="ai-cursor"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Engineered for Excellence</h2>
            <p className="features-description">
              A comprehensive suite of tools designed to elevate your writing
              standards and streamline your documentation process.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Elevate Your Writing Workflow</h2>
          <p className="cta-description">
            Join thousands of professionals who trust Chronicle for their
            critical documentation and creative needs.
          </p>
          {user ? (
            <button className="cta-btn" onClick={() => onEnterEditor?.()}>
              Go to Editor
            </button>
          ) : (
            <button
              className="cta-btn"
              onClick={() => {
                setIsLogin(false);
                setShowAuthModal(true);
              }}
            >
              Start Your Free Trial
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="logo-icon"
                >
                  <rect width="32" height="32" rx="8" fill="currentColor" />
                  <path
                    d="M8 10H24M8 16H20M8 22H16"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Chronicle</span>
              </div>
              <p className="footer-description">
                The intelligent workspace for professional writers and teams.
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#">Features</a>
                <a href="#">Enterprise</a>
                <a href="#">Security</a>
                <a href="#">Pricing</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Careers</a>
                <a href="#">Blog</a>
                <a href="#">Contact</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Chronicle Inc. All rights reserved.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="auth-modal-overlay"
          onClick={() => setShowAuthModal(false)}
        >
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-close"
              onClick={() => setShowAuthModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="auth-header">
              <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
              <p>
                {isLogin
                  ? "Enter your credentials to access your workspace"
                  : "Start your professional writing journey"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Work Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-submit">
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="auth-switch">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => setIsLogin(false)}>Sign up</button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => setIsLogin(true)}>Log in</button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
