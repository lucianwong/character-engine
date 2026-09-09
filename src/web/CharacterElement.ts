import {
  CharacterController,
  CharacterControllerOptions,
} from "../core/CharacterController";
import {
  SvgPuppetDefinition,
  SvgPuppetRendererAdapter,
} from "../renderers/SvgPuppetRenderer";
import { CharacterPack, SemanticAction } from "../types";

export interface CharacterElementConfig {
  pack: CharacterPack;
  puppet: SvgPuppetDefinition;
  controller?: CharacterControllerOptions;
}

/**
 * Creates, but does not automatically register, a dependency-free
 * <character-engine> custom element class.
 *
 * The factory avoids touching HTMLElement during Node/headless imports.
 */
export function createCharacterEngineElementClass() {
  if (typeof HTMLElement === "undefined") {
    throw new Error(
      "Character Engine Web Component requires a browser DOM",
    );
  }

  return class CharacterEngineElement extends HTMLElement {
    svg?: SVGSVGElement;
    controller?: CharacterController;
    raf?: number;
    startedAt = 0;

    async configure(config: CharacterElementConfig): Promise<void> {
      this.stop();

      this.replaceChildren();

      const svg = this.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      ) as SVGSVGElement;

      svg.setAttribute("role", "img");
      svg.setAttribute(
        "aria-label",
        config.pack.manifest.name,
      );

      this.appendChild(svg);
      this.svg = svg;

      const renderer = new SvgPuppetRendererAdapter(
        svg,
        config.puppet,
      );

      this.controller = new CharacterController(
        config.pack,
        renderer,
        config.controller,
      );

      await this.controller.load();
      this.start();
    }

    dispatchCharacterAction(action: SemanticAction): void {
      this.controller?.dispatch(action);
    }

    setCharacterGaze(x: number, y: number): void {
      this.controller?.setGaze(x, y);
    }

    start(): void {
      if (!this.controller || this.raf !== undefined) return;

      this.startedAt = performance.now();

      const frame = async (now: number) => {
        if (!this.controller) return;
        await this.controller.tick(now - this.startedAt);
        this.raf = requestAnimationFrame(frame);
      };

      this.raf = requestAnimationFrame(frame);
    }

    stop(): void {
      if (this.raf !== undefined) {
        cancelAnimationFrame(this.raf);
        this.raf = undefined;
      }

      void this.controller?.unload();
      this.controller = undefined;
    }

    disconnectedCallback(): void {
      this.stop();
    }
  };
}

export function defineCharacterEngineElement(
  tagName = "character-engine",
): CustomElementConstructor {
  if (typeof customElements === "undefined") {
    throw new Error(
      "Character Engine Web Component requires Custom Elements",
    );
  }

  const existing = customElements.get(tagName);
  if (existing) return existing;

  const elementClass = createCharacterEngineElementClass();
  customElements.define(tagName, elementClass);
  return elementClass;
}
