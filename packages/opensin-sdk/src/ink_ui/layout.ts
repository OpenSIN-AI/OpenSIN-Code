/**
 * OpenSIN Terminal Layout — Responsive Layout System
 *
 * Yoga-inspired layout engine for terminal UI that computes
 * positions and sizes for components using flexbox-like rules.
 */

import type {
  UIComponent,
  RenderContext,
  Dimensions,
  LayoutNode,
  Position,
  Style,
} from './types.js';

interface LayoutConstraint {
  x: number;
  y: number;
  availableWidth: number;
  availableHeight: number;
  parentStyle?: Style;
}

export class LayoutEngine {
  private rootNode: LayoutNode | null;

  constructor() {
    this.rootNode = null;
  }

  computeLayout(
    component: UIComponent,
    context: RenderContext
  ): LayoutNode {
    const constraint: LayoutConstraint = {
      x: 0,
      y: 0,
      availableWidth: context.dimensions.width,
      availableHeight: context.dimensions.height,
    };

    this.rootNode = this.layoutNode(component, constraint, context);
    return this.rootNode;
  }

  private layoutNode(
    component: UIComponent,
    constraint: LayoutConstraint,
    context: RenderContext
  ): LayoutNode {
    const style = component.style || {};
    const measured = component.measure(context);

    const width = this.resolveDimension(style.width, measured.width, constraint.availableWidth);
    const height = this.resolveDimension(style.height, measured.height, constraint.availableHeight);

    const node: LayoutNode = {
      component,
      x: constraint.x,
      y: constraint.y,
      width,
      height,
      children: [],
    };

    if (component.children && component.children.length > 0) {
      const childConstraints = this.computeChildConstraints(
        component.children,
        node,
        style,
        context
      );

      for (let i = 0; i < component.children.length; i++) {
        const child = component.children[i];
        const childConstraint = childConstraints[i];
        if (childConstraint) {
          const childNode = this.layoutNode(child, childConstraint, context);
          node.children.push(childNode);
        }
      }
    }

    return node;
  }

  private computeChildConstraints(
    children: UIComponent[],
    parentNode: LayoutNode,
    parentStyle: Style,
    context: RenderContext
  ): LayoutConstraint[] {
    const flexDirection = parentStyle.flexDirection || 'vertical';
    const padding = this.resolvePadding(parentStyle);
    const gap = 0;

    const constraints: LayoutConstraint[] = [];

    if (flexDirection === 'vertical') {
      let currentY = parentNode.y + padding.top;
      const availableWidth = parentNode.width - padding.left - padding.right;

      for (const child of children) {
        const childStyle = child.style || {};
        const measured = child.measure(context);
        const childHeight = this.resolveDimension(
          childStyle.height,
          measured.height,
          parentNode.height - padding.top - padding.bottom
        );

        constraints.push({
          x: parentNode.x + padding.left,
          y: currentY,
          availableWidth,
          availableHeight: childHeight,
          parentStyle,
        });

        currentY += childHeight + gap;
      }
    } else {
      let currentX = parentNode.x + padding.left;
      const availableHeight = parentNode.height - padding.top - padding.bottom;

      for (const child of children) {
        const childStyle = child.style || {};
        const measured = child.measure(context);
        const childWidth = this.resolveDimension(
          childStyle.width,
          measured.width,
          parentNode.width - padding.left - padding.right
        );

        constraints.push({
          x: currentX,
          y: parentNode.y + padding.top,
          availableWidth: childWidth,
          availableHeight,
          parentStyle,
        });

        currentX += childWidth + gap;
      }
    }

    return constraints;
  }

  private resolveDimension(
    value: number | string | undefined,
    measured: number,
    available: number
  ): number {
    if (value === undefined) return measured;
    if (typeof value === 'number') return Math.min(value, available);
    if (typeof value === 'string') {
      if (value.endsWith('%')) {
        const pct = parseFloat(value) / 100;
        return Math.round(available * pct);
      }
      const num = parseInt(value, 10);
      if (!isNaN(num)) return Math.min(num, available);
    }
    return measured;
  }

  private resolvePadding(style: Style): { top: number; right: number; bottom: number; left: number } {
    const p = style.padding;
    const pt = style.paddingTop ?? p;
    const pr = style.paddingRight ?? p;
    const pb = style.paddingBottom ?? p;
    const pl = style.paddingLeft ?? p;

    return {
      top: this.resolvePaddingValue(pt),
      right: this.resolvePaddingValue(pr),
      bottom: this.resolvePaddingValue(pb),
      left: this.resolvePaddingValue(pl),
    };
  }

  private resolvePaddingValue(value: number | string | undefined): number {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    return parseInt(value, 10) || 0;
  }

  getRootNode(): LayoutNode | null {
    return this.rootNode;
  }

  findNodeByKey(key: string): LayoutNode | null {
    if (!this.rootNode) return null;
    return this.searchNode(this.rootNode, key);
  }

  private searchNode(node: LayoutNode, key: string): LayoutNode | null {
    if (node.component.key === key) return node;
    for (const child of node.children) {
      const found = this.searchNode(child, key);
      if (found) return found;
    }
    return null;
  }

  getNodeAtPosition(x: number, y: number): LayoutNode | null {
    if (!this.rootNode) return null;
    return this.hitTest(this.rootNode, x, y);
  }

  private hitTest(node: LayoutNode, x: number, y: number): LayoutNode | null {
    if (x < node.x || x >= node.x + node.width || y < node.y || y >= node.y + node.height) {
      return null;
    }

    for (let i = node.children.length - 1; i >= 0; i--) {
      const childResult = this.hitTest(node.children[i], x, y);
      if (childResult) return childResult;
    }

    return node;
  }

  printTree(node?: LayoutNode, indent = 0): string {
    const target = node || this.rootNode;
    if (!target) return '';

    const lines: string[] = [];
    const prefix = '  '.repeat(indent);
    const name = target.component.constructor.name;
    lines.push(`${prefix}${name} (${target.x},${target.y}) ${target.width}x${target.height}`);

    for (const child of target.children) {
      lines.push(this.printTree(child, indent + 1));
    }

    return lines.join('\n');
  }
}
