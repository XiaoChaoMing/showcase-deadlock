import { describe, expect, it } from 'vitest';
import { parsePreviewParams } from '../../src/preview/PreviewParams';

describe('parsePreviewParams', () => {
  it('đọc tham số preview', () => {
    const p = parsePreviewParams('?hero=kestrel&view=side&overlay=skeleton,labels&bone=LeftUpperArm');
    expect(p).toMatchObject({ hero: 'kestrel', view: 'side', stage: 'full', pose: 'tpose', bone: 'LeftUpperArm' });
    expect([...p.overlay]).toEqual(['skeleton', 'labels']);
  });

  it('bỏ qua giá trị lạ', () =>
    expect(parsePreviewParams('?view=top&bone=Tail&lineup=x&stage=zz&pose=dance&overlay=foo')).toMatchObject({
      view: 'threeQuarter', bone: undefined, lineup: 'none', stage: 'full', pose: 'tpose',
    }));

  it('lineup và zoom', () => {
    expect(parsePreviewParams('?lineup=heroes').lineup).toBe('heroes');
    expect(parsePreviewParams('?zoom=kneeL').zoom).toBe('kneeL');
    expect(parsePreviewParams('?zoom=nose').zoom).toBeUndefined();
  });
});
