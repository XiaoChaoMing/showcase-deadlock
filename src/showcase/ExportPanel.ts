import { el } from './dom';

export const renderExportPanel = (onExport: () => Promise<{ fileName: string; bytes: number; diffs: string[] }>): HTMLElement => {
  const status = el('p', { class: 'export-status' }, 'Xuất nhân vật ra file GLB, rồi nạp lại để đối chiếu.');
  const button = el('button', { type: 'button', class: 'primary' }, 'Xuất GLB');
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.className = 'export-status';
    status.textContent = 'Đang xuất…';
    try {
      const r = await onExport();
      const kb = `${(r.bytes / 1024).toFixed(0)} KB`;
      if (r.diffs.length === 0) {
        status.className = 'export-status ok';
        status.textContent = `✓ ${r.fileName} (${kb}) — nạp lại khớp hoàn toàn`;
      } else {
        status.className = 'export-status bad';
        status.replaceChildren(`✗ ${r.fileName} (${kb}) — ${r.diffs.length} khác biệt:`, el('ul', {}, ...r.diffs.map((d) => el('li', {}, d))));
      }
    } catch (e) {
      status.className = 'export-status bad';
      status.textContent = `✗ Lỗi khi xuất: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      button.disabled = false;
    }
  });
  return el('section', { class: 'export' }, el('h2', {}, 'Xuất'), button, status);
};
