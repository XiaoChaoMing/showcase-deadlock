import { PreviewApp } from './preview/PreviewApp';
import { ShowcaseApp } from './showcase/ShowcaseApp';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app container');
const isPreview = new URLSearchParams(window.location.search).has('preview');
if (isPreview) new PreviewApp(container);
else new ShowcaseApp(container);
