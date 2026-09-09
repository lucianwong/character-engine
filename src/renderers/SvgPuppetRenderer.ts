import { CharacterPack, ParameterFrame } from "../types";
import { RendererAdapter } from "./RendererAdapter";

export interface SvgParameterBinding {
  parameter: string;
  scale?: number;
  offset?: number;
}

export interface SvgPuppetLayer {
  id: string;
  parent?: string;
  src: string;

  x: number;
  y: number;
  width: number;
  height: number;

  pivotX: number;
  pivotY: number;
  zIndex?: number;

  rotation?: SvgParameterBinding;
  translateX?: SvgParameterBinding;
  translateY?: SvgParameterBinding;
  scaleX?: SvgParameterBinding;
  scaleY?: SvgParameterBinding;
  opacity?: SvgParameterBinding;
}

export interface SvgPuppetDefinition {
  width: number;
  height: number;
  viewBox?: string;
  layers: SvgPuppetLayer[];
}

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function bindingValue(
  frame: ParameterFrame,
  binding: SvgParameterBinding | undefined,
  defaultValue: number,
): number {
  if (!binding) return defaultValue;
  const value = frame[binding.parameter] ?? 0;
  return (binding.offset ?? 0) + value * (binding.scale ?? 1);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Dependency-free browser renderer for layered PNG/SVG character parts.
 *
 * Every layer is a nested SVG <g> with a local pivot. Parent/child nesting
 * provides articulated motion: rotating an upper arm carries the forearm and
 * hand while the child joints remain independently controllable.
 */
export class SvgPuppetRendererAdapter implements RendererAdapter {
  readonly id = "svg-puppet";

  private readonly nodes = new Map<string, SVGGElement>();
  private readonly definitions = new Map<string, SvgPuppetLayer>();
  private mount?: SVGGElement;

  constructor(
    private readonly root: SVGSVGElement,
    private readonly definition: SvgPuppetDefinition,
  ) {
    for (const layer of definition.layers) {
      this.definitions.set(layer.id, layer);
    }
  }

  load(_pack: CharacterPack): void {
    if (this.mount) return;

    this.root.setAttribute("width", String(this.definition.width));
    this.root.setAttribute("height", String(this.definition.height));
    this.root.setAttribute(
      "viewBox",
      this.definition.viewBox ??
        "0 0 " + this.definition.width + " " + this.definition.height,
    );

    const mount = this.root.ownerDocument.createElementNS(
      SVG_NS,
      "g",
    ) as SVGGElement;
    mount.dataset.characterEngine = "svg-puppet";
    this.root.appendChild(mount);
    this.mount = mount;

    const ordered = [...this.definition.layers].sort(
      (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
    );

    for (const layer of ordered) {
      this.createLayer(layer, new Set<string>());
    }

    this.setParameters({});
  }

  unload(): void {
    this.mount?.remove();
    this.mount = undefined;
    this.nodes.clear();
  }

  setParameters(frame: ParameterFrame): void {
    for (const layer of this.definition.layers) {
      const node = this.nodes.get(layer.id);
      if (!node) continue;

      const rotation = bindingValue(frame, layer.rotation, 0);
      const tx = bindingValue(frame, layer.translateX, 0);
      const ty = bindingValue(frame, layer.translateY, 0);

      const sx = layer.scaleX
        ? 1 + bindingValue(frame, layer.scaleX, 0)
        : 1;
      const sy = layer.scaleY
        ? 1 + bindingValue(frame, layer.scaleY, 0)
        : 1;

      const px = layer.pivotX;
      const py = layer.pivotY;

      node.setAttribute(
        "transform",
        [
          "translate(" + (layer.x + tx) + " " + (layer.y + ty) + ")",
          "translate(" + px + " " + py + ")",
          "rotate(" + rotation + ")",
          "scale(" + sx + " " + sy + ")",
          "translate(" + -px + " " + -py + ")",
        ].join(" "),
      );

      if (layer.opacity) {
        node.setAttribute(
          "opacity",
          String(clamp01(bindingValue(frame, layer.opacity, 1))),
        );
      }
    }
  }

  private createLayer(
    layer: SvgPuppetLayer,
    stack: Set<string>,
  ): SVGGElement {
    const existing = this.nodes.get(layer.id);
    if (existing) return existing;

    if (stack.has(layer.id)) {
      throw new Error("Circular SVG puppet parent chain at " + layer.id);
    }

    stack.add(layer.id);

    let parent: SVGGElement | undefined;

    if (layer.parent) {
      const parentDefinition = this.definitions.get(layer.parent);
      if (!parentDefinition) {
        throw new Error(
          "Unknown SVG puppet parent " +
            layer.parent +
            " for layer " +
            layer.id,
        );
      }
      parent = this.createLayer(parentDefinition, stack);
    }

    const node = this.root.ownerDocument.createElementNS(
      SVG_NS,
      "g",
    ) as SVGGElement;
    node.dataset.partId = layer.id;

    const image = this.root.ownerDocument.createElementNS(
      SVG_NS,
      "image",
    ) as SVGImageElement;

    image.setAttribute("x", "0");
    image.setAttribute("y", "0");
    image.setAttribute("width", String(layer.width));
    image.setAttribute("height", String(layer.height));
    image.setAttribute("preserveAspectRatio", "xMidYMid meet");
    image.setAttribute("href", layer.src);
    image.setAttributeNS(XLINK_NS, "href", layer.src);

    node.appendChild(image);
    (parent ?? this.mount)?.appendChild(node);

    this.nodes.set(layer.id, node);
    stack.delete(layer.id);

    return node;
  }
}
