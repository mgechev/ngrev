export enum Message {
  LoadProject = 'load-project',
  PrevState = 'prev-state',
  GetMetadata = 'get-metadata',
  GetData = 'get-data',
  GetSymbols = 'get-symbols',
  DirectStateTransition = 'direct-state-transition',
  SaveImage = 'save-image',
  ImageData = 'image-data',
  DisableExport = 'disable-export',
  EnableExport = 'enable-export'
}

export enum Status {
  Failure = 0,
  Success = 1
}
