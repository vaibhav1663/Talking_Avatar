import React, { useEffect } from "react";
import { gsap } from "gsap";

const Loader = () => {
  useEffect(() => {
    const select = (s) => document.querySelector(s);
    const toArray = (s) => gsap.utils.toArray(s);
    const mainSVG = select("#mainSVG");
    const allEll = toArray(".ell");
    const colorArr = ["#359EEE", "#FFC43D", "#EF476F", "#03CEA4"];

    const colorInterp = gsap.utils.interpolate(colorArr);

    gsap.set(mainSVG, {
      visibility: "visible",
    });

    const animate = (el, count) => {
      const tl = gsap.timeline({
        defaults: {
          ease: "sine.inOut",
        },
        repeat: -1,
      });
      gsap.set(el, {
        opacity: 1 - count / allEll.length,
        stroke: colorInterp(count / allEll.length),
      });

      tl.to(el, {
        attr: {
          ry: `-=${count * 2.3}`,
          rx: `+=${count * 1.4}`,
        },
        ease: "sine.in",
      })
        .to(el, {
          attr: {
            ry: `+=${count * 2.3}`,
            rx: `-=${count * 1.4}`,
          },
          ease: "sine",
        })
        .to(
          el,
          {
            duration: 1,
            rotation: -180,
            transformOrigin: "50% 50%",
          },
          0
        )
        .timeScale(0.5);
    };

    allEll.forEach((c, i) => {
      gsap.delayedCall(i / (allEll.length - 1), animate, [c, i + 1]);
    });

    gsap.to("#aiGrad", {
      duration: 4,
      delay: 0.75,
      attr: {
        x1: "-=300",
        x2: "-=300",
      },
      scale: 1.2,
      transformOrigin: "50% 50%",
      repeat: -1,
      ease: "none",
    });
    gsap.to("#ai", {
      duration: 1,
      scale: 1.1,
      transformOrigin: "50% 50%",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div className="loader-container" style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }}>
      <svg
        id="mainSVG"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
      >
        <defs>
          <linearGradient
            id="aiGrad"
            x1="513.98"
            y1="290"
            x2="479.72"
            y2="320"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset=".15" stopColor="#EF476F" />
            <stop offset=".4" stopColor="#359eee" />
            <stop offset=".6" stopColor="#03cea4" />
            <stop offset=".78" stopColor="#FFC43D" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: 30 }).map((_, index) => (
          <ellipse
            key={index}
            className="ell"
            cx="400"
            cy="300"
            rx="80"
            ry="80"
          />
        ))}
        <path
          id="ai"
          opacity="0.85"
          d="m417.17,323.85h-34.34c-3.69,0-6.67-2.99-6.67-6.67v-34.34c0-3.69,2.99-6.67,6.67-6.67h34.34c3.69,0,6.67,2.99,6.67,6.67v34.34c0,3.69-2.99,6.67-6.67,6.67Zm-5.25-12.92v-21.85c0-.55-.45-1-1-1h-21.85c-.55,0-1,.45-1,1v21.85c0,.55.45,1,1,1h21.85c.55,0,1-.45,1-1Zm23.08-16.29h-11.15m-47.69,0h-11.15m70,10.73h-11.15m-47.69,0h-11.15m40.37,29.63v-11.15m0-47.69v-11.15m-10.73,70v-11.15m0-47.69v-11.15"
          stroke="url(#aiGrad)"
          strokeLinecap="round"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default Loader;
