import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px",
      backgroundColor: "var(--crema)"
    }}>
      {/* Texture Layer */}
      <div className="texture" />

      {/* Logo Link */}
      <div style={{ marginBottom: "32px", zIndex: 10 }}>
        <Link href="/" style={{ textDecoration: "none" }} className="logo">
          <span>Girona</span><span>Xics</span>
        </Link>
      </div>

      {/* Main Container */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "white",
        borderRadius: "16px",
        border: "1px solid var(--verd-pallid)",
        boxShadow: "0 16px 32px rgba(26, 107, 58, 0.04)",
        padding: "40px 32px",
        zIndex: 10,
        position: "relative"
      }}>
        {children}
      </div>

      {/* Footer link */}
      <div style={{ marginTop: "24px", zIndex: 10 }}>
        <Link href="/" style={{
          fontSize: "14px",
          color: "var(--verd)",
          textDecoration: "none",
          fontWeight: 500
        }}>
          ← Tornar a la web pública
        </Link>
      </div>
    </div>
  );
}
