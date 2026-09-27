import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, POIMediaGallery, ThemeProvider } from "@kozmos-ds/react";

// Deliberately labelled test illustrations, not venue photos or brand assets.
const pictures = ["One", "Two", "Three"].map((label, index) => ({
  id: String(index),
  alt: `Test illustration ${label}`,
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e3e4e8"/><text x="40" y="150" fill="#17191c" font-size="32">Test ${label}</text></svg>`)}`,
}));
function Fixture() {
  const [index, setIndex] = useState(0);
  const [media, setMedia] = useState(pictures);
  const [reject, setReject] = useState(false);
  const [rtl, setRtl] = useState(false);
  return (
    <ThemeProvider theme="light" dir={rtl ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 400, padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button onClick={() => setIndex(2)}>Select third</Button>
          <Button onClick={() => setIndex(0)}>Select first</Button>
          <Button onClick={() => setReject(!reject)}>
            {reject ? "Accept changes" : "Reject changes"}
          </Button>
          <Button onClick={() => setMedia(pictures.slice(0, 1))}>
            Shrink media
          </Button>
          <Button onClick={() => setMedia([])}>Clear media</Button>
          <Button onClick={() => setMedia(pictures)}>Restore media</Button>
          <Button onClick={() => setRtl(!rtl)}>
            {rtl ? "Use LTR" : "Use RTL"}
          </Button>
        </div>
        <div
          id="scrolling-host"
          tabIndex={0}
          aria-label="Scrollable host"
          style={{ height: 300, overflow: "auto", marginTop: 16 }}
        >
          <div style={{ height: 160 }}>Host content before gallery</div>
          <POIMediaGallery
            label="Controlled photos"
            media={media}
            activeIndex={index}
            onActiveIndexChange={(next) => {
              if (!reject) setIndex(next);
            }}
            controlsLabel="Controlled photo actions"
            positionLabel={(n, total) => `Controlled image ${n} of ${total}`}
          />
          <POIMediaGallery
            label="Uncontrolled photos"
            media={media}
            defaultActiveIndex={1}
            positionLabel={(n, total) => `Uncontrolled image ${n} of ${total}`}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
