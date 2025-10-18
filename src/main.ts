import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Registrar locale pt-BR para formateo de moneda
registerLocaleData(localePtBr, 'pt-BR');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
