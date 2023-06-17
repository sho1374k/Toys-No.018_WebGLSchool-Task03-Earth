// --------------------------

// lib

// --------------------------
// import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";

export class PostProcessing {
  constructor(stage, params, bool) {
    this.stage = stage;
    this.params = params;
    this.bool = bool;

    this.composer = null;
    this.customPass = null;
  }

  setComposer() {
    this.pixelParams = {
      pixelSize: this.bool.isMatchMediaWidth ? 5 : 10, // 100
      normalEdgeStrength: 0.3,
      depthEdgeStrength: 0.4,
      pixelAlignedPanning: true,
    };
    this.renderPass = new RenderPass(this.stage.scene, this.stage.camera);

    this.pixelatedPass = new RenderPixelatedPass(
      this.pixelParams,
      this.stage.scene,
      this.stage.camera
    );
    this.gammaPass = new ShaderPass(GammaCorrectionShader);

    if (GUI != null) {
      const pixelParams = this.pixelParams;
      const pixel = GUI.addFolder("pixel");
      // pixel.close();
      pixel
        .add(pixelParams, "pixelSize")
        .min(1)
        .max(100)
        .step(1)
        .onChange(() => {
          this.pixelatedPass.setPixelSize(pixelParams.pixelSize);
        });
      pixel
        .add(this.pixelatedPass, "normalEdgeStrength")
        .min(0)
        .max(2)
        .step(0.05);
      pixel
        .add(this.pixelatedPass, "depthEdgeStrength")
        .min(0)
        .max(1)
        .step(0.05);
      pixel.add(pixelParams, "pixelAlignedPanning");
    }

    this.composer = new EffectComposer(this.stage.renderer);
    this.composer.renderToScreen = true;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.pixelatedPass);
    this.composer.addPass(this.gammaPass);
  }

  raf(time) {
    if (this.composer != null) {
      this.composer.render();
    } else {
      this.stage.renderer.render(this.stage.scene, this.stage.camera);
    }
  }

  setEnterAnimation() {
    this.pixelatedPass.setPixelSize(200);
  }

  toEnterAnimation() {
    return new Promise((resolve) => {
      const DURATION = 1;
      let c = 0;
      if (this.bool.isMatchMediaWidth) {
        GSAP.to(this.pixelatedPass, {
          duration: DURATION,
          onUpdate: () => {
            c++;
            const progress = c / 30;
            const size = GSAP.utils.interpolate(
              [100, 5],
              G.clamp(progress, 0.0, 1.0)
            );
            this.pixelatedPass.setPixelSize(size);
          },
          onComplete: () => {
            if (this.pixelatedPass.pixelSize > 5.0) {
              this.pixelatedPass.setPixelSize(5);
            }
            resolve();
          },
        });
      } else {
        GSAP.to(this.pixelatedPass, {
          duration: DURATION,
          onUpdate: () => {
            c++;
            const progress = c / 30;
            const size = GSAP.utils.interpolate(
              [200, 10],
              G.clamp(progress, 0.0, 1.0)
            );
            this.pixelatedPass.setPixelSize(size);
          },
          onComplete: () => {
            if (this.pixelatedPass.pixelSize > 10.0) {
              this.pixelatedPass.setPixelSize(10);
            }
            resolve();
          },
        });
      }
    });
  }

  init() {
    this.setComposer();
    this.setEnterAnimation();
  }
}
