export type GeneratedPrototypeFile = {
  path: string;
  content: string;
};

export type GeneratedPrototypeFiles = {
  files: GeneratedPrototypeFile[];
  summary?: string;
};
