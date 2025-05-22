/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        BUCKET: R2Bucket;
      };
    };
  }
}