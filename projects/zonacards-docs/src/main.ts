import { bootstrapApplication } from '@angular/platform-browser';
import { DocsApp } from './app/docs-app';
import { docsConfig } from './app/docs.config';

bootstrapApplication(DocsApp, docsConfig).catch(err => console.error(err));
