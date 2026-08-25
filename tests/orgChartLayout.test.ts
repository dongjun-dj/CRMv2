import { describe, expect, it } from 'vitest';
import {
  getHorizontalLinkPath,
  getHorizontalNodeTransform
} from '../components/OrgChart';

describe('组织关系图横向布局', () => {
  it('使用层级深度作为横坐标', () => {
    expect(getHorizontalNodeTransform({ x: 55, y: 220 })).toBe('translate(220,55)');
  });

  it('从父节点右侧连接到子节点左侧', () => {
    const path = getHorizontalLinkPath({
      source: { x: 0, y: 0 },
      target: { x: 55, y: 220 }
    }, 140);

    expect(path).toBe('M140,0C180,0 180,55 220,55');
  });
});
