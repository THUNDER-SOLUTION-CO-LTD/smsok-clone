import * as React from "react";

/*
 * Shared email layout for SMSOK activation emails.
 * Uses inline styles because email clients don't support external CSS.
 * Design: Nansen DNA dark theme adapted for email.
 */

const colors = {
  bgBase: "#0b1118",
  bgSurface: "#10161c",
  bgElevated: "#1a2028",
  accent: "#00E2B5",
  accentHover: "#00d4a8",
  textPrimary: "#F2F4F5",
  textSecondary: "#b2bacd",
  textMuted: "#8a95a0",
  textOnAccent: "#0b1118",
  border: "#20252c",
} as const;

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <title>{preview}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.bgBase,
          fontFamily:
            "'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: colors.textSecondary,
          WebkitTextSizeAdjust: "100%",
        }}
      >
        {/* Preview text (hidden) */}
        <div
          style={{
            display: "none",
            overflow: "hidden",
            lineHeight: "1px",
            maxHeight: 0,
            maxWidth: 0,
            opacity: 0,
          }}
        >
          {preview}
        </div>

        {/* Container */}
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: colors.bgBase }}
        >
          <tr>
            <td align="center" style={{ padding: "40px 16px" }}>
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{ maxWidth: "560px" }}
              >
                {/* Logo */}
                <tr>
                  <td align="center" style={{ paddingBottom: "32px" }}>
                    <table role="presentation" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            backgroundColor: colors.accent,
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            lineHeight: "28px",
                            color: colors.textOnAccent,
                            fontWeight: 700,
                          }}
                        >
                          S
                        </td>
                        <td
                          style={{
                            paddingLeft: "8px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: colors.textPrimary,
                            letterSpacing: "0.5px",
                          }}
                        >
                          SMSOK
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Content Card */}
                <tr>
                  <td
                    style={{
                      backgroundColor: colors.bgSurface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "12px",
                      padding: "40px 32px",
                    }}
                  >
                    {children}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    align="center"
                    style={{
                      paddingTop: "24px",
                      fontSize: "12px",
                      lineHeight: "20px",
                      color: colors.textMuted,
                    }}
                  >
                    <p style={{ margin: 0 }}>SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ</p>
                    <p style={{ margin: "4px 0 0" }}>
                      หากไม่ต้องการรับอีเมลนี้{" "}
                      <a
                        href="{{unsubscribe_url}}"
                        style={{ color: colors.accent, textDecoration: "underline" }}
                      >
                        ยกเลิกการรับอีเมล
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
      <tr>
        <td align="center" style={{ paddingTop: "24px", paddingBottom: "8px" }}>
          <a
            href={href}
            style={{
              display: "inline-block",
              padding: "12px 32px",
              backgroundColor: colors.accent,
              color: colors.textOnAccent,
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "8px",
              textDecoration: "none",
              lineHeight: "24px",
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        margin: "0 0 16px",
        fontSize: "24px",
        fontWeight: 700,
        color: colors.textPrimary,
        lineHeight: "32px",
      }}
    >
      {children}
    </h1>
  );
}

export function EmailText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 16px",
        fontSize: "15px",
        lineHeight: "24px",
        color: colors.textSecondary,
      }}
    >
      {children}
    </p>
  );
}

export function EmailDivider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${colors.border}`,
        margin: "24px 0",
      }}
    />
  );
}

export function EmailHighlight({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
      <tr>
        <td
          align="center"
          style={{
            padding: "20px",
            backgroundColor: colors.bgElevated,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 700,
              color: colors.accent,
              lineHeight: "40px",
            }}
          >
            {value}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: colors.textMuted,
            }}
          >
            {label}
          </p>
        </td>
      </tr>
    </table>
  );
}

export { colors };
