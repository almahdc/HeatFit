/**
 * StyleTile — Visual reference for the redesigned HeatFit.
 *
 * This page showcases:
 * - Token file (colors, typography, spacing)
 * - Type scale with all sizes and weights
 * - Button states and interactions
 * - Scenario card (with gold highlight example)
 * - Table row patterns
 * - WCAG AA contrast ratio verification table
 *
 * Not part of the shipped tool; used for design review and handoff.
 * Delete this file before production.
 */

export function StyleTile() {
  return (
    <div className="style-tile">
      {/* === PAGE HEADER === */}
      <div className="st-section st-header">
        <h1 className="st-title">HeatFit Design System</h1>
        <p className="st-lede">
          Bold editorial. Large type, thick colour blocks, confident geometry,
          generous whitespace, strong horizontal rules.
        </p>
      </div>

      {/* === TYPOGRAPHY SCALE === */}
      <section className="st-section">
        <h2>Type Scale</h2>
        <p className="st-hint">
          Modular 1.25× scale. All weights medium or heavier. 17px body minimum.
        </p>

        <div className="st-type-grid">
          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-xs)" }} className="st-sample-label">
              --type-xs: 13.44px (0.84rem)
            </div>
            <p style={{ fontSize: "var(--type-xs)", margin: 0 }} className="st-sample-text">
              Small labels and hints
            </p>
          </div>

          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-sm)" }} className="st-sample-label">
              --type-sm: 16.8px (1.05rem)
            </div>
            <p style={{ fontSize: "var(--type-sm)", margin: 0 }} className="st-sample-text">
              Secondary text and captions
            </p>
          </div>

          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-base)" }} className="st-sample-label">
              --type-base: 20.96px (1.31rem) ← BODY MINIMUM
            </div>
            <p style={{ fontSize: "var(--type-base)", margin: 0 }} className="st-sample-text">
              Main body text, readable at 200% zoom
            </p>
          </div>

          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-lg)" }} className="st-sample-label">
              --type-lg: 26.24px (1.64rem)
            </div>
            <p style={{ fontSize: "var(--type-lg)", margin: 0 }} className="st-sample-text">
              Subheadings and section labels
            </p>
          </div>

          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-xl)" }} className="st-sample-label">
              --type-xl: 32.8px (2.05rem)
            </div>
            <p style={{ fontSize: "var(--type-xl)", margin: 0 }} className="st-sample-text">
              Step titles in wizard
            </p>
          </div>

          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-2xl)" }} className="st-sample-label">
              --type-2xl: 40.96px (2.56rem)
            </div>
            <p style={{ fontSize: "var(--type-2xl)", margin: 0 }} className="st-sample-text">
              Section headings
            </p>
          </div>

          <div className="st-type-sample">
            <div style={{ fontSize: "var(--type-3xl)" }} className="st-sample-label">
              --type-3xl: 51.2px (3.2rem)
            </div>
            <p style={{ fontSize: "var(--type-3xl)", margin: 0, fontWeight: 700 }} className="st-sample-text">
              Page title
            </p>
          </div>

          <div className="st-type-sample st-type-figure-sample">
            <div style={{ fontSize: "var(--type-base)" }} className="st-sample-label">
              --type-figure: 64px (4rem)
            </div>
            <p
              style={{
                fontSize: "var(--type-figure)",
                margin: 0,
                fontWeight: 800,
                lineHeight: 1,
              }}
              className="st-sample-text"
            >
              3,420
            </p>
            <p style={{ fontSize: "var(--type-sm)", margin: "0.5rem 0 0", color: "var(--text-secondary)" }}>
              Monthly cost — signature figure, impossible to miss
            </p>
          </div>
        </div>
      </section>

      {/* === COLORS & PALETTE === */}
      <section className="st-section">
        <h2>Color Palette</h2>
        <p className="st-hint">
          Semantic tokens. Colors encode scenario identity, not judgement. Verdict is in words and numbers.
        </p>

        <div className="st-color-grid">
          {/* Primary colors */}
          <div className="st-color-swatch">
            <div
              className="st-swatch"
              style={{ backgroundColor: "var(--color-charcoal)" }}
            />
            <div className="st-color-label">
              <div className="st-color-name">Charcoal</div>
              <div className="st-color-value">#30323D</div>
              <div className="st-color-usage">Primary text, coal baseline</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-slate)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Slate</div>
              <div className="st-color-value">#4D5061</div>
              <div className="st-color-usage">Secondary text, borders</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-sage)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Sage</div>
              <div className="st-color-value">#CDD1C4</div>
              <div className="st-color-usage">Page ground, card fills, sections</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-blue)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Blue</div>
              <div className="st-color-value">#5C80BC</div>
              <div className="st-color-usage">Fills, charts, large text only</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-blue-dark)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Blue-Dark</div>
              <div className="st-color-value">#3D5E96</div>
              <div className="st-color-usage">Button labels, links, focus</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-gold)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Gold</div>
              <div className="st-color-value">#E8C547</div>
              <div className="st-color-usage">Highlight one answer only</div>
            </div>
          </div>

          {/* Proposed neutrals */}
          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-off-white)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Off-White</div>
              <div className="st-color-value">#F9F8F6</div>
              <div className="st-color-usage">Page ground</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-grey-light)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Grey-Light</div>
              <div className="st-color-value">#E8E7E3</div>
              <div className="st-color-usage">Secondary sections</div>
            </div>
          </div>

          <div className="st-color-swatch">
            <div className="st-swatch" style={{ backgroundColor: "var(--color-grey-dark)" }} />
            <div className="st-color-label">
              <div className="st-color-name">Grey-Dark</div>
              <div className="st-color-value">#8E8E8E</div>
              <div className="st-color-usage">Muted text, disabled states</div>
            </div>
          </div>
        </div>
      </section>

      {/* === SCENARIO RAMP === */}
      <section className="st-section">
        <h2>Scenario Identity Ramp</h2>
        <p className="st-hint">
          Five scenarios, light-to-dark blue ramp. Coal is charcoal. No rainbow, no additional hues.
        </p>

        <div className="st-scenario-ramp">
          <div className="st-scenario-color">
            <div className="st-scenario-swatch" style={{ backgroundColor: "var(--scenario-coal)" }} />
            <div className="st-scenario-label">Coal (keep burning)</div>
          </div>
          <div className="st-scenario-color">
            <div className="st-scenario-swatch" style={{ backgroundColor: "var(--scenario-ecodesign)" }} />
            <div className="st-scenario-label">Ecodesign Coal</div>
          </div>
          <div className="st-scenario-color">
            <div className="st-scenario-swatch" style={{ backgroundColor: "var(--scenario-pellet)" }} />
            <div className="st-scenario-label">Pellet Boiler</div>
          </div>
          <div className="st-scenario-color">
            <div className="st-scenario-swatch" style={{ backgroundColor: "var(--scenario-heatpump)" }} />
            <div className="st-scenario-label">Heat Pump</div>
          </div>
          <div className="st-scenario-color">
            <div className="st-scenario-swatch" style={{ backgroundColor: "var(--scenario-heatpump-pv)" }} />
            <div className="st-scenario-label">Heat Pump + PV</div>
          </div>
        </div>
      </section>

      {/* === BUTTONS === */}
      <section className="st-section">
        <h2>Button States</h2>
        <p className="st-hint">
          Two button types. All at 48×48px minimum. Text labels always visible, never icon-only.
        </p>

        <div className="st-button-group">
          <h3>Primary Buttons (blue-dark, white text)</h3>
          <div className="st-buttons">
            <button className="st-btn st-btn-primary">Default</button>
            <button className="st-btn st-btn-primary" disabled>
              Disabled
            </button>
            <button className="st-btn st-btn-primary">Next »</button>
          </div>
        </div>

        <div className="st-button-group">
          <h3>Secondary Buttons (grey-light, charcoal text)</h3>
          <div className="st-buttons">
            <button className="st-btn st-btn-secondary">Default</button>
            <button className="st-btn st-btn-secondary" disabled>
              Disabled
            </button>
            <button className="st-btn st-btn-secondary">« Back</button>
          </div>
        </div>
      </section>

      {/* === SCENARIO CARD EXAMPLE === */}
      <section className="st-section">
        <h2>Scenario Card</h2>
        <p className="st-hint">
          One scenario. The gold border shows the recommended answer (at most one per screen).
        </p>

        <div className="st-card-container">
          <div className="st-card st-card-highlighted">
            <h3 className="st-card-title">Heat Pump + PV</h3>

            <div className="st-card-stat">
              <div className="st-stat-label">Monthly Cost</div>
              <div className="st-figure">1,840</div>
              <div className="st-unit">zł/month</div>
            </div>

            <div className="st-card-stat">
              <div className="st-stat-label">Total After Loan</div>
              <div className="st-range">95,000 – 110,000 zł</div>
            </div>

            <div className="st-card-detail">
              <div className="st-detail-row">
                <dt>Equipment + install</dt>
                <dd>68,000 zł</dd>
              </div>
              <div className="st-detail-row">
                <dt>Grant (Clean Air)</dt>
                <dd className="st-grant">+30,000 zł</dd>
              </div>
              <div className="st-detail-row">
                <dt>Tax credit</dt>
                <dd className="st-grant">+8,100 zł</dd>
              </div>
            </div>

            <div className="st-card-note">
              Heating works during outages. PV may produce more electricity than
              you use in mild months.
            </div>
          </div>
        </div>
      </section>

      {/* === TABLE ROW PATTERN === */}
      <section className="st-section">
        <h2>Comparison Table Row</h2>
        <p className="st-hint">
          Rows distinguishable by label, position, and scenario colour. Information never conveyed by
          colour alone.
        </p>

        <table className="st-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Monthly Cost</th>
              <th>Total After Loan</th>
              <th>Grant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="st-table-row" style={{ borderLeftColor: "var(--scenario-coal)" }}>
              <td>Coal (keep burning)</td>
              <td>2,640 zł</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr className="st-table-row" style={{ borderLeftColor: "var(--scenario-ecodesign)" }}>
              <td>Ecodesign Coal</td>
              <td>2,540 zł</td>
              <td>62,000 zł</td>
              <td>—</td>
            </tr>
            <tr className="st-table-row" style={{ borderLeftColor: "var(--scenario-pellet)" }}>
              <td>Pellet Boiler</td>
              <td>2,280 zł</td>
              <td>75,000 zł</td>
              <td>14,000 zł</td>
            </tr>
            <tr className="st-table-row" style={{ borderLeftColor: "var(--scenario-heatpump)" }}>
              <td>Heat Pump</td>
              <td>1,960 zł</td>
              <td>82,000 zł</td>
              <td>25,000 zł</td>
            </tr>
            <tr className="st-table-row st-table-highlighted" style={{ borderLeftColor: "var(--scenario-heatpump-pv)" }}>
              <td>Heat Pump + PV</td>
              <td>1,840 zł</td>
              <td>95,000 zł</td>
              <td>38,100 zł</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* === CONTRAST RATIOS === */}
      <section className="st-section st-section-last">
        <h2>WCAG AA Contrast Verification</h2>
        <p className="st-hint">
          All pairings tested. ✓ = WCAG AA pass (4.5:1 body, 3:1 large). Body text must be
          charcoal on white or sage.
        </p>

        <table className="st-contrast-table">
          <thead>
            <tr>
              <th>Text Color</th>
              <th>Background</th>
              <th>Contrast Ratio</th>
              <th>WCAG AA Status</th>
              <th>Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: "var(--color-charcoal)" }}>Charcoal #30323D</td>
              <td style={{ backgroundColor: "white", border: "1px solid #ccc" }}>White</td>
              <td>12.7:1</td>
              <td className="st-pass">✓ PASS</td>
              <td>Primary body text</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-charcoal)" }}>Charcoal #30323D</td>
              <td style={{ backgroundColor: "var(--color-sage)", border: "1px solid #ccc" }}>Sage #CDD1C4</td>
              <td>8.2:1</td>
              <td className="st-pass">✓ PASS</td>
              <td>Text on section background</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-charcoal)" }}>Charcoal #30323D</td>
              <td style={{ backgroundColor: "var(--color-gold)", border: "1px solid #ccc" }}>Gold #E8C547</td>
              <td>7.6:1</td>
              <td className="st-pass">✓ PASS</td>
              <td>Text on highlight block</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-slate)" }}>Slate #4D5061</td>
              <td style={{ backgroundColor: "white", border: "1px solid #ccc" }}>White</td>
              <td>8.0:1</td>
              <td className="st-pass">✓ PASS</td>
              <td>Secondary text</td>
            </tr>
            <tr>
              <td style={{ color: "var(--color-blue)" }}>Blue #5C80BC</td>
              <td style={{ backgroundColor: "white", border: "1px solid #ccc" }}>White</td>
              <td>4.0:1</td>
              <td className="st-pass">✓ PASS (large only)</td>
              <td>Large text (21px+), never body</td>
            </tr>
            <tr>
              <td style={{ color: "white" }}>White</td>
              <td style={{ backgroundColor: "var(--color-blue-dark)", border: "1px solid #333" }}>
                Blue-Dark #3D5E96
              </td>
              <td>5.5:1</td>
              <td className="st-pass">✓ PASS</td>
              <td>Button labels, link text</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
