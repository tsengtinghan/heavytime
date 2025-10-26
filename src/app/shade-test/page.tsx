import "./shade-test.css";

export default function ShadeTestPage() {
  return (
    <div className="shade-test-container sunlit-content">
      {/* Wall color gradient (darkest to mid tones) */}
      <div className="wall-gradient" aria-hidden></div>

      {/* Window light beams with perspective */}
      <div className="window-light-container" aria-hidden>
        <div className="perspective-window-frame">
          {/* Light beams through window panes */}
          <div className="window-beam beam-pane-1"></div>
          <div className="window-beam beam-pane-2"></div>
          <div className="window-beam beam-pane-3"></div>
          <div className="window-beam beam-pane-4"></div>
        </div>
      </div>

      {/* Window frame shadows creating dark cross pattern */}
      <div className="window-frame-shadows" aria-hidden>
        {/* Vertical mullions (window frame dividers) */}
        <div className="mullion-shadow mullion-1"></div>
        <div className="mullion-shadow mullion-2"></div>
        <div className="mullion-shadow mullion-3"></div>

        {/* Horizontal transom */}
        <div className="transom-shadow"></div>

        {/* Edge shadow for depth */}
        <div className="edge-shadow"></div>
      </div>
    </div>
  );
}
